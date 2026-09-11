import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import { verifyToken, isAdmin, isFarmer, isDelivery, isShop } from '../middleware/auth.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Product from '../models/Product.js';
import OTP from '../models/OTP.js';
import ServiceZone from '../models/ServiceZone.js';
import { isWithinServiceArea, calculateDistance } from '../utils/locationUtils.js';
import Config from '../models/Config.js';
import { dispatchOrderNotification, NOTIFICATION_EVENTS } from '../services/orderNotificationService.js';

const router = express.Router();

// Helper to robustly find order by custom ID, decoded ID, or Mongo ObjectId
const findOrderByIdOrQuery = async (id) => {
    if (!id) return null;
    const rawId = decodeURIComponent(id);
    const conditions = [{ id: rawId }, { id }];
    if (mongoose.isValidObjectId(id)) {
        conditions.push({ _id: id });
    }
    return await Order.findOne({ $or: conditions });
};

// Check serviceability for checkout
router.post('/check-serviceability', verifyToken, async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Coordinates are required' });
        }
        
        if (!isWithinServiceArea(lat, lng)) {
            return res.status(400).json({ message: 'Green Bond is currently available within 10 KM of Thiruvannamalai.' });
        }
        
        return res.status(200).json({ message: 'Serviceable location' });
    } catch (error) {
        console.error("Serviceability check error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new order
router.post('/', verifyToken, async (req, res) => {
    const deductedStock = [];
    try {
        const orderData = { ...req.body };
        
        // Ensure user ID is correctly attached
        orderData.userId = req.user.id;
        
        // Generate a random order ID if not provided
        if (!orderData.id) {
            orderData.id = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        // Auto calculate estimated time (e.g. 2 hours from now)
        const now = new Date();
        orderData.estimatedDeliveryTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        orderData.status = 'PLACED';

        // Validate location
        const deliveryLat = orderData.deliveryLat || (orderData.deliveryLocation && orderData.deliveryLocation.lat);
        const deliveryLng = orderData.deliveryLng || (orderData.deliveryLocation && orderData.deliveryLocation.lng);
        
        if (deliveryLat && deliveryLng) {
            if (!isWithinServiceArea(deliveryLat, deliveryLng)) {
                 return res.status(400).json({ message: 'Green Bond is currently available within 10 KM of Thiruvannamalai.' });
            }
            orderData.deliveryLocation = { lat: deliveryLat, lng: deliveryLng };
        }
        
        // Also map pickupLocation if passed as pickupLat/Lng
        const pickupLat = orderData.pickupLat || (orderData.pickupLocation && orderData.pickupLocation.lat);
        const pickupLng = orderData.pickupLng || (orderData.pickupLocation && orderData.pickupLocation.lng);
        if (pickupLat && pickupLng) {
             orderData.pickupLocation = { lat: pickupLat, lng: pickupLng };
        }

        // Fetch config for commission / delivery fee defaults
        let config = await Config.findOne({ key: 'admin_settings' });
        if (!config) {
            config = { deliveryFee: 0, greenBondCommissionPercentage: 10, deliveryBoyPayoutPercentage: 100 };
        }

        if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
            return res.status(400).json({ message: 'At least one cart item is required.' });
        }

        // Consolidate repeated product IDs before validating or decrementing stock.
        const requestedQuantities = new Map();
        for (const item of orderData.items) {
            const productId = item?.productId;
            const quantity = Number(item?.quantity);
            if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({ message: 'Each cart item requires a valid productId and positive whole-number quantity.' });
            }
            requestedQuantities.set(productId.toString(), (requestedQuantities.get(productId.toString()) || 0) + quantity);
        }

        let subtotal = 0;
        let totalGstAmount = 0;
        let gstBreakdown = [];
        const serverItems = [];
        
        // Pre-check inventory to prevent negative stock and enforce DB price & GST
        for (const [productId, quantity] of requestedQuantities) {
            const product = await Product.findOne({ _id: productId, isActive: { $ne: false } });
            if (!product || product.stock < quantity) {
                return res.status(409).json({ message: `Insufficient stock for product ${product?.name || productId}.`, availableStock: product?.stock || 0 });
            }

            const unitPrice = Number(product.price);
            const itemTotal = unitPrice * quantity;
            const itemGstRate = Number(product.gstRate) || 0;
            const taxableValue = (itemTotal / (100 + itemGstRate)) * 100;
            const itemGstAmount = itemTotal - taxableValue;

            serverItems.push({
                productId: product._id,
                name: product.name,
                title: product.name, // legacy read alias
                price: unitPrice,
                farmer: product.farmer,
                farmerId: product.farmerId,
                sellerId: product.sellerId,
                sourceType: product.sourceType,
                location: product.location,
                image: product.imageUrl || product.image || product.thumbnailUrl,
                quantity
            });

            if (itemGstRate > 0) {
                gstBreakdown.push({
                    productId: product._id,
                    rate: itemGstRate,
                    taxableValue: Number(taxableValue.toFixed(2)),
                    cgst: Number((itemGstAmount / 2).toFixed(2)),
                    sgst: Number((itemGstAmount / 2).toFixed(2)),
                    igst: 0,
                    totalGst: Number(itemGstAmount.toFixed(2))
                });
            }
            subtotal += itemTotal;
            totalGstAmount += itemGstAmount;
        }

        // Inventory Deduction (Atomic)
        for (const item of serverItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: item.productId, isActive: { $ne: false }, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
            if (!updatedProduct) {
                throw new Error(`Stock changed before checkout could complete for ${item.name}.`);
            }
            deductedStock.push({ productId: item.productId, quantity: item.quantity });
        }
        
        // Finalize snapshots
        orderData.subtotal = Number((subtotal - totalGstAmount).toFixed(2));
        orderData.taxableAmount = orderData.subtotal;
        orderData.gstAmount = Number(totalGstAmount.toFixed(2));
        orderData.gstBreakdown = gstBreakdown;
        orderData.discount = 0; // Hook for future coupons
        
        // Delivery fee processing
        orderData.items = serverItems;
        orderData.qty = serverItems.reduce((sum, item) => sum + item.quantity, 0);
        orderData.customerEmail = req.user.email || orderData.customerEmail;
        orderData.customerName = req.user.name || orderData.customerName;
        orderData.sourceType = serverItems[0]?.sourceType || 'FARMER';
        orderData.sellerId = serverItems.length === 1 ? serverItems[0].sellerId : undefined;
        orderData.pickupAddress = serverItems.length === 1 ? serverItems[0].location : 'Multiple seller locations';
        orderData.deliveryFee = Number(config.deliveryFee) || 0;
        orderData.deliveryBoyPayout = Number((orderData.deliveryFee * (config.deliveryBoyPayoutPercentage / 100)).toFixed(2));
        
        orderData.totalAmount = subtotal + orderData.deliveryFee - orderData.discount;
        orderData.total = `₹${orderData.totalAmount.toFixed(2)}`;
        orderData.paymentStatus = 'PENDING';
        orderData.productAmount = subtotal; // Backwards compatibility
        
        // Settlement calculations
        orderData.greenBondCommission = Number(((orderData.taxableAmount) * (config.greenBondCommissionPercentage / 100)).toFixed(2));
        
        // Seller gets: TaxableAmount - Commission + GST (since seller has to remit GST)
        orderData.sellerAmount = Number((orderData.taxableAmount - orderData.greenBondCommission + orderData.gstAmount).toFixed(2));
        
        // Ensure farmerAmount is set for backward compatibility
        orderData.farmerAmount = orderData.sellerAmount;

        const newOrder = new Order(orderData);
        await newOrder.save();
        
        // Clear cart after order is placed
        if (orderData.cartId) {
             await Cart.findByIdAndDelete(orderData.cartId);
        } else {
             await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [], totalAmount: 0, deliveryFee: 0, grandTotal: 0 } });
        }

        // Trigger ORDER_PLACED FCM + In-App notification with duplicate protection
        dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_PLACED, newOrder, req.io);
        
        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        // Compensate any successful atomic deductions if a later item or order save fails.
        await Promise.all(deductedStock.map(({ productId, quantity }) => Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } })));
        console.error("Order creation error:", error);
        const status = error.message?.startsWith('Stock changed') ? 409 : 500;
        res.status(status).json({ message: status === 409 ? error.message : 'Server error during order creation' });
    }
});

// Fetch invoice details for an order
router.get('/:id/invoice', verifyToken, async (req, res) => {
    try {
        const order = await Order.findOne({ id: req.params.id, userId: req.user.id })
            .populate('items.productId')
            .lean();
            
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        let config = await Config.findOne({ key: 'admin_settings' }).lean();
        if (!config) {
            config = {
                gstin: 'PENDING-GSTIN',
                legalName: 'GreenBond Technologies',
                registeredAddress: 'Thiruvannamalai, TN, India',
                invoicePrefix: 'GB-'
            };
        }
        
        res.json({
            order,
            config,
            invoiceNumber: `${config.invoicePrefix}${order.id.replace('#ORD-', '')}`
        });
    } catch (error) {
        console.error("Invoice fetch error:", error);
        res.status(500).json({ message: 'Server error retrieving invoice' });
    }
});

// Fetch current logged in user's orders
router.get('/my-orders', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const orders = await Order.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error);
        res.status(500).json({ message: 'Server error fetching orders', error: error.message });
    }
});

// Fetch farmer's orders
router.get('/farmer-orders', verifyToken, isFarmer, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const orders = await Order.find({ "items.farmerId": req.user.id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch farmer orders error:", error);
        res.status(500).json({ message: 'Server error fetching farmer orders', error: error.message });
    }
});

// Fetch shop's orders
router.get('/shop-orders', verifyToken, isShop, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const filter = { sellerId: req.user.id };
        if (req.query.status && req.query.status !== 'ALL') {
            filter.status = req.query.status;
        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch shop orders error:", error);
        res.status(500).json({ message: 'Server error fetching shop orders', error: error.message });
    }
});

// Fetch delivery partner's orders
router.get('/delivery-orders', verifyToken, isDelivery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const statusFilter = req.query.status;

        const baseQuery = {
            $or: [
                { deliveryBoyId: req.user.id },
                { status: 'READY_FOR_PICKUP' }
            ]
        };

        if (statusFilter && statusFilter !== 'ALL') {
            baseQuery.status = statusFilter;
        }

        const orders = await Order.find(baseQuery)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch delivery orders error:", error);
        res.status(500).json({ message: 'Server error fetching delivery orders', error: error.message });
    }
});

// Get real dynamic delivery stats
router.get('/delivery-stats', verifyToken, isDelivery, async (req, res) => {
    try {
        const deliveryBoyId = req.user.id;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [activeCount, todayDeliveredCount, pendingPickupsCount, deliveredOrders] = await Promise.all([
            Order.countDocuments({ 
                deliveryBoyId, 
                status: { $in: ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] } 
            }),
            Order.countDocuments({ 
                deliveryBoyId, 
                status: 'DELIVERED', 
                deliveredAt: { $gte: startOfToday } 
            }),
            Order.countDocuments({ 
                $or: [
                    { deliveryBoyId, status: 'DELIVERY_ASSIGNED' },
                    { status: 'READY_FOR_PICKUP' }
                ]
            }),
            Order.find({ deliveryBoyId, status: 'DELIVERED' }).select('deliveryFee totalAmount total')
        ]);

        const totalEarnings = deliveredOrders.reduce((acc, curr) => {
            return acc + (curr.deliveryFee || 40);
        }, 0);

        res.status(200).json({
            activeDeliveries: activeCount,
            deliveredToday: todayDeliveredCount,
            pendingPickups: pendingPickupsCount,
            totalEarnings
        });
    } catch (error) {
        console.error('Error fetching delivery stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delivery Boy Claim / Accept Delivery
router.put('/:id/accept-delivery', verifyToken, isDelivery, async (req, res) => {
    try {
        const { id } = req.params;
        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.deliveryBoyId && order.deliveryBoyId.toString() !== req.user.id) {
            return res.status(400).json({ message: 'This order is already claimed by another delivery partner.' });
        }

        const validAcceptStatuses = ['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PACKED'];
        if (!validAcceptStatuses.includes(order.status.toUpperCase())) {
            return res.status(400).json({ message: `Order cannot be accepted at current stage (${order.status}).` });
        }

        order.deliveryBoyId = req.user.id;
        order.status = 'DELIVERY_ASSIGNED';
        order.assignedAt = new Date();
        await order.save();

        res.status(200).json({ message: 'Order accepted for delivery successfully!', order });
    } catch (error) {
        console.error('Error accepting delivery:', error);
        res.status(500).json({ message: 'Server error accepting delivery', error: error.message });
    }
});

// Admin ONLY: Fetch all system orders
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch all orders error:", error);
        res.status(500).json({ message: 'Server error fetching all orders', error: error.message });
    }
});

// Update order status
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const currentOrder = await findOrderByIdOrQuery(id);
        if (!currentOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // --- IDOR PROTECTION ---
        if (req.user.role !== 'admin') {
            if (req.user.role === 'customer' || req.user.role === 'user') {
                if (currentOrder.userId.toString() !== req.user.id) {
                    return res.status(403).json({ message: 'Access denied. You do not own this order.' });
                }
            } else if (req.user.role === 'client') { // Farmer
                const isFarmerAssigned = currentOrder.items.some(item => item.farmerId && item.farmerId.toString() === req.user.id);
                if (!isFarmerAssigned) {
                    return res.status(403).json({ message: 'Access denied. You are not assigned to this order.' });
                }
            } else if (req.user.role === 'shop') {
                if (!currentOrder.sellerId || currentOrder.sellerId.toString() !== req.user.id) {
                    return res.status(403).json({ message: 'Access denied. You are not assigned to this order.' });
                }
            } else if (req.user.role === 'delivery') {
                if (currentOrder.deliveryBoyId && currentOrder.deliveryBoyId.toString() !== req.user.id) {
                    return res.status(403).json({ message: 'Access denied. You are not the delivery partner for this order.' });
                }
            }
        }
        // ------------------------

        // Strict transition validations (Canonical & Role States)
        const validTransitions = {
            'PLACED': ['CONFIRMED', 'SHOP_ACCEPTED', 'FARMER_ACCEPTED', 'PACKING', 'CANCELLED'],
            'CONFIRMED': ['PACKING', 'READY_FOR_PICKUP', 'CANCELLED'],
            'SHOP_ACCEPTED': ['PACKING', 'PACKED', 'READY_FOR_PICKUP', 'CANCELLED'],
            'FARMER_ACCEPTED': ['PACKING', 'PACKED', 'READY_FOR_PICKUP', 'CANCELLED'],
            'PACKING': ['PACKED', 'READY_FOR_PICKUP', 'CANCELLED'],
            'PACKED': ['READY_FOR_PICKUP', 'CANCELLED'],
            'READY_FOR_PICKUP': ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'CANCELLED'], 
            'DELIVERY_ASSIGNED': ['PICKED_UP', 'OUT_FOR_DELIVERY', 'CANCELLED'],
            'PICKED_UP': ['OUT_FOR_DELIVERY', 'CANCELLED'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': ['RETURN_REQUESTED', 'REFUNDED'],
            'RETURN_REQUESTED': ['RETURN_APPROVED', 'RETURN_REJECTED'],
            'RETURN_APPROVED': ['REFUND_PENDING', 'REFUNDED'],
            'RETURN_REJECTED': [],
            'REFUND_PENDING': ['REFUNDED'],
            'CANCELLED': ['REFUNDED']
        };

        const currentStatus = currentOrder.status.toUpperCase();
        const nextStatus = status.toUpperCase();

        // Check if transition is valid
        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(nextStatus)) {
             return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${nextStatus}` });
        }
        
        const updateData = { status: nextStatus };
        const now = new Date();
        
        if (['CONFIRMED', 'SHOP_ACCEPTED', 'FARMER_ACCEPTED'].includes(nextStatus)) updateData.acceptedAt = now;
        if (['PACKING', 'PACKED'].includes(nextStatus)) updateData.packedAt = now;
        if (nextStatus === 'READY_FOR_PICKUP') {
            updateData.readyAt = now;
            const pOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const dOtp = Math.floor(100000 + Math.random() * 900000).toString();
            updateData.pickupOtp = pOtp; // fallback backward compat
            updateData.deliveryOtp = dOtp;

            // Generate Secure OTP records
            const expireTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
            await OTP.create([
                { orderId: currentOrder._id, type: 'PICKUP', code: pOtp, expiresAt: expireTime },
                { orderId: currentOrder._id, type: 'DELIVERY', code: dOtp, expiresAt: expireTime }
            ]);

            // Auto-assign delivery partner using FARMER's pickup location
            const pickupLat = currentOrder.pickupLocation?.lat || currentOrder.pickupLat;
            const pickupLng = currentOrder.pickupLocation?.lng || currentOrder.pickupLng;

            let nearestPartner = null;

            if (pickupLat && pickupLng) {
                // Fetch active service zone radius
                const tvmZone = await ServiceZone.findOne({ city: /tiruvannamalai|thiruvannamalai/i, active: true });
                const radiusMeters = tvmZone && tvmZone.radiusKm ? tvmZone.radiusKm * 1000 : 10000;

                // Find nearest available delivery partner using 2dsphere index (strictly within service area)
                const partners = await DeliveryPartner.find({
                    status: 'Available',
                    locationGeo: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [pickupLng, pickupLat] },
                            $maxDistance: radiusMeters 
                        }
                    }
                }).limit(1);

                if (partners.length > 0) {
                    nearestPartner = partners[0];
                }
            }

            // Fallback if location geo didn't yield results (due to unmigrated data)
            if (!nearestPartner && pickupLat && pickupLng) {
                const availablePartners = await DeliveryPartner.find({ status: 'Available' });
                let minDistance = Infinity;
                for (const partner of availablePartners) {
                    if (partner.location && partner.location.lat && partner.location.lng) {
                        const dist = calculateDistance(pickupLat, pickupLng, partner.location.lat, partner.location.lng);
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestPartner = partner;
                        }
                    }
                }
            }

            if (nearestPartner) {
                updateData.deliveryBoyId = nearestPartner._id;
                // Don't auto-advance status here in the new state machine, just assign the partner
                updateData.assignedAt = now;
            }
        }

        // Only backend can advance to OUT_FOR_DELIVERY and DELIVERED via OTP routes
        if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(nextStatus)) {
            return res.status(403).json({ message: `Cannot manually update status to ${nextStatus}. Use OTP verification.` });
        }
        
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: currentOrder._id }, 
            { $set: updateData }, 
            { new: true }
        );

        // Dispatch appropriate FCM lifecycle event
        if (nextStatus === 'CONFIRMED') {
            dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_CONFIRMED, updatedOrder, req.io);
        } else if (nextStatus === 'PACKING' || nextStatus === 'READY_FOR_PICKUP') {
            dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_PREPARING, updatedOrder, req.io);
        } else if (nextStatus === 'CANCELLED') {
            dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_CANCELLED, updatedOrder, req.io);
        } else {
            // Fallback for other status transitions
            const notifMsg = getNotificationMessage(status, updatedOrder.id);
            if (notifMsg && updatedOrder.userId) {
                dispatchOrderNotification(status, updatedOrder, req.io);
            }
        }
        
        res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
    } catch (error) {
        console.error("Order status update error:", error);
        res.status(500).json({ message: 'Server error updating order', error: error.message });
    }
});

// Verify Farmer Pickup OTP
router.post('/:id/verify-pickup-otp', verifyToken, isDelivery, async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;
        
        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        if (order.status.toUpperCase() !== 'DELIVERY_ASSIGNED' && order.status.toUpperCase() !== 'READY_FOR_PICKUP') {
             return res.status(400).json({ message: 'Order is not ready for pickup' });
        }

        if (order.deliveryBoyId && order.deliveryBoyId.toString() !== req.user.id) {
             return res.status(403).json({ message: 'You are not assigned to this order' });
        }

        const otpRecord = await OTP.findOne({ orderId: order._id, type: 'PICKUP' });
        
        if (otpRecord) {
            if (otpRecord.attempts >= 3) {
                return res.status(429).json({ message: 'Maximum OTP attempts exceeded. Please request a new OTP.' });
            }
            if (new Date() > otpRecord.expiresAt) {
                return res.status(400).json({ message: 'OTP has expired.' });
            }
            if (otpRecord.code !== otp) {
                otpRecord.attempts += 1;
                await otpRecord.save();
                return res.status(400).json({ message: 'Invalid Pickup OTP' });
            }
            otpRecord.verified = true;
            await otpRecord.save();
        } else {
            // Fallback for orders created before OTP model
            if (order.pickupOtp !== otp) {
                 return res.status(400).json({ message: 'Invalid Pickup OTP' });
            }
        }

        const now = new Date();
        order.pickupOtpVerified = true;
        order.status = 'OUT_FOR_DELIVERY'; // Transition straight to OUT_FOR_DELIVERY in canonical states
        order.shippedAt = now;
        await order.save();

        // Trigger OUT_FOR_DELIVERY notification to customer
        dispatchOrderNotification(NOTIFICATION_EVENTS.OUT_FOR_DELIVERY, order, req.io);

        res.status(200).json({ message: 'Pickup OTP verified successfully, order is OUT_FOR_DELIVERY', order });
    } catch (error) {
        console.error("Verify pickup OTP error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Verify Customer Delivery OTP
router.post('/:id/verify-delivery-otp', verifyToken, isDelivery, async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;
        
        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        if (order.status.toUpperCase() !== 'OUT_FOR_DELIVERY') {
             return res.status(400).json({ message: 'Order is not out for delivery' });
        }

        if (order.deliveryBoyId && order.deliveryBoyId.toString() !== req.user.id) {
             return res.status(403).json({ message: 'You are not assigned to this order' });
        }

        const otpRecord = await OTP.findOne({ orderId: order._id, type: 'DELIVERY' });
        
        if (otpRecord) {
            if (otpRecord.attempts >= 3) {
                return res.status(429).json({ message: 'Maximum OTP attempts exceeded. Please request a new OTP.' });
            }
            if (new Date() > otpRecord.expiresAt) {
                return res.status(400).json({ message: 'OTP has expired.' });
            }
            if (otpRecord.code !== otp) {
                otpRecord.attempts += 1;
                await otpRecord.save();
                return res.status(400).json({ message: 'Invalid Delivery OTP' });
            }
            otpRecord.verified = true;
            await otpRecord.save();
        } else {
            // Fallback for orders created before OTP model
            if (order.deliveryOtp !== otp) {
                 return res.status(400).json({ message: 'Invalid Delivery OTP' });
            }
        }

        const now = new Date();
        order.deliveryOtpVerified = true;
        order.status = 'DELIVERED';
        order.deliveredAt = now;
        
        if (order.paymentMethod === 'COD') {
             order.codStatus = 'COLLECTED';
        }

        await order.save();

        // Trigger ORDER_DELIVERED notification to customer
        dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_DELIVERED, order, req.io);

        res.status(200).json({ message: 'Delivery OTP verified successfully', order });
    } catch (error) {
        console.error("Verify delivery OTP error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Customer / Admin Cancel Order
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Authorization check
        const isOwner = order.userId && order.userId.toString() === req.user.id;
        const isSeller = (order.sellerId && order.sellerId.toString() === req.user.id) || 
                         order.items.some(i => i.farmerId && i.farmerId.toString() === req.user.id);
        const isAdminUser = req.user.role === 'admin';

        if (!isOwner && !isSeller && !isAdminUser) {
            return res.status(403).json({ message: 'Unauthorized to cancel this order' });
        }

        // Status restriction: Can only cancel before READY_FOR_PICKUP / OUT_FOR_DELIVERY
        const cancellableStates = ['PLACED', 'PENDING', 'CONFIRMED', 'SHOP_ACCEPTED', 'FARMER_ACCEPTED', 'PACKING', 'PACKED'];
        if (!cancellableStates.includes(order.status.toUpperCase())) {
            return res.status(400).json({ 
                message: `Order cannot be cancelled at this stage (${order.status}). It has already been dispatched.` 
            });
        }

        // Atomically restore product inventory
        for (const item of order.items) {
            if (item.productId) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: item.quantity }
                });
            }
        }

        order.status = 'CANCELLED';
        order.cancellationReason = reason || 'Order cancelled';
        order.cancelledAt = new Date();
        order.cancelledBy = isAdminUser ? 'ADMIN' : (isSeller ? 'SELLER' : 'CUSTOMER');

        // If online payment was completed, mark refund pending
        if (order.paymentStatus === 'Paid' || order.paymentStatus === 'PAID') {
            order.refundDetails = {
                refundId: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: order.totalAmount,
                status: 'PENDING',
                processedAt: null
            };
        }

        await order.save();

        dispatchOrderNotification(NOTIFICATION_EVENTS.ORDER_CANCELLED, order, req.io);

        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error cancelling order', error: error.message });
    }
});

// Customer Request Return
router.post('/:id/return', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await findOrderByIdOrQuery(id);
        if (!order || (order.userId && order.userId.toString() !== req.user.id && req.user.role !== 'admin')) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status.toUpperCase() !== 'DELIVERED') {
            return res.status(400).json({ message: 'Only delivered orders are eligible for return.' });
        }

        order.status = 'RETURN_REQUESTED';
        order.returnReason = reason || 'Customer requested return';
        order.returnRequestedAt = new Date();
        await order.save();

        res.status(200).json({ message: 'Return request submitted successfully', order });
    } catch (error) {
        console.error('Return order error:', error);
        res.status(500).json({ message: 'Server error submitting return', error: error.message });
    }
});

// Seller / Admin Review Return Request
router.put('/:id/return-review', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, adminNote } = req.body; // action: 'APPROVE' | 'REJECT'

        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isSeller = (order.sellerId && order.sellerId.toString() === req.user.id) || 
                         order.items.some(i => i.farmerId && i.farmerId.toString() === req.user.id);
        const isAdminUser = req.user.role === 'admin';

        if (!isSeller && !isAdminUser) {
            return res.status(403).json({ message: 'Unauthorized to review returns for this order' });
        }

        if (order.status !== 'RETURN_REQUESTED') {
            return res.status(400).json({ message: 'Order is not in RETURN_REQUESTED status' });
        }

        const now = new Date();
        if (action === 'APPROVE') {
            order.status = 'RETURN_APPROVED';
            order.returnApprovedAt = now;
            order.returnAdminNote = adminNote || 'Return approved by seller/admin';
            order.refundDetails = {
                refundId: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: order.totalAmount,
                status: 'PENDING',
                processedAt: null
            };
        } else if (action === 'REJECT') {
            order.status = 'RETURN_REJECTED';
            order.returnRejectedAt = now;
            order.returnAdminNote = adminNote || 'Return rejected';
        } else {
            return res.status(400).json({ message: "Action must be 'APPROVE' or 'REJECT'" });
        }

        await order.save();

        res.status(200).json({ message: `Return ${action.toLowerCase()}d successfully`, order });
    } catch (error) {
        console.error('Review return error:', error);
        res.status(500).json({ message: 'Server error reviewing return', error: error.message });
    }
});

// Admin Process Refund
router.post('/:id/refund', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can process refunds' });
        }

        const order = await findOrderByIdOrQuery(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!['RETURN_APPROVED', 'CANCELLED', 'REFUND_PENDING'].includes(order.status)) {
            return res.status(400).json({ message: `Cannot refund order in current status: ${order.status}` });
        }

        const now = new Date();
        order.status = 'REFUNDED';
        if (!order.refundDetails) {
            order.refundDetails = {
                refundId: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
                amount: order.totalAmount
            };
        }
        order.refundDetails.status = 'PROCESSED';
        order.refundDetails.processedAt = now;

        await order.save();

        res.status(200).json({ message: 'Refund processed successfully', order });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ message: 'Server error processing refund', error: error.message });
    }
});

function getNotificationMessage(status, orderId) {
    switch(status) {
        case 'CONFIRMED': return `Your order ${orderId} has been confirmed.`;
        case 'PACKING': return `Your order ${orderId} is being packed.`;
        case 'READY_FOR_PICKUP': return `Your order ${orderId} is packed and ready for pickup.`;
        case 'OUT_FOR_DELIVERY': return `Your order ${orderId} is out for delivery.`;
        case 'DELIVERED': return `Your order ${orderId} has been delivered successfully.`;
        case 'CANCELLED': return `Your order ${orderId} has been cancelled.`;
        case 'REFUNDED': return `Your order ${orderId} has been refunded.`;
        // Legacy fallbacks
        case 'Accepted':
        case 'ACCEPTED': 
        case 'FARMER_ACCEPTED': 
        case 'SHOP_ACCEPTED': return `Your order ${orderId} has been accepted by the seller.`;
        case 'Packed': return `Your order ${orderId} is being packed.`;
        case 'ReadyForPickup': return `Your order ${orderId} is packed and ready for pickup.`;
        case 'Assigned': 
        case 'DELIVERY_ASSIGNED': return `A delivery partner has been assigned to your order ${orderId}.`;
        case 'PICKED_UP': return `Your order ${orderId} has been picked up.`;
        case 'OutForDelivery': return `Your order ${orderId} is out for delivery.`;
        case 'Delivered': return `Your order ${orderId} has been delivered successfully.`;
        case 'Cancelled': return `Your order ${orderId} has been cancelled.`;
        default: return null;
    }
}

export default router;
