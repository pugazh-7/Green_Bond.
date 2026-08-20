import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Notification from '../models/Notification.js';
import { verifyToken, isAdmin, isFarmer, isDelivery, isShop } from '../middleware/auth.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Product from '../models/Product.js';
import OTP from '../models/OTP.js';
import ServiceZone from '../models/ServiceZone.js';
import { isWithinServiceArea, calculateDistance } from '../utils/locationUtils.js';

const router = express.Router();

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
    try {
        const orderData = req.body;
        
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

        // Pre-check inventory to prevent negative stock
        for (const item of orderData.items) {
            if (item.productId) {
                const product = await Product.findById(item.productId);
                if (!product || product.availableQuantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for product: ${item.title}. Available: ${product ? product.availableQuantity : 0}` });
                }
            }
        }

        // Inventory Deduction (Atomic)
        for (const item of orderData.items) {
            if (item.productId) {
                await Product.findOneAndUpdate(
                    { _id: item.productId, availableQuantity: { $gte: item.quantity } },
                    { $inc: { availableQuantity: -item.quantity } },
                    { new: true }
                );
            }
        }

        // COD Tracking & Commission Splits
        let totalProductAmount = 0;
        orderData.items.forEach(item => {
            const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : item.price;
            totalProductAmount += (price * item.quantity);
        });
        
        orderData.productAmount = totalProductAmount;
        orderData.greenBondCommission = totalProductAmount * 0.10; // 10%
        orderData.farmerAmount = totalProductAmount - orderData.greenBondCommission;
        orderData.deliveryFee = orderData.deliveryFee || 0;
        orderData.totalAmount = totalProductAmount + orderData.deliveryFee;

        const newOrder = new Order(orderData);
        await newOrder.save();
        
        // Clear cart after order is placed
        if (orderData.cartId) {
             await Cart.findByIdAndDelete(orderData.cartId);
        } else {
             await Cart.findOneAndUpdate({ userId: req.user.id }, { $set: { items: [], totalAmount: 0, deliveryFee: 0, grandTotal: 0 } });
        }

        // Send Notification to user
        const notif = await Notification.create({
            userId: req.user.id,
            type: 'Order Update',
            message: `Your order ${newOrder.id} has been placed successfully.`,
            orderId: newOrder.id
        });

        if (req.io) {
            req.io.to(req.user.id).emit('notification', notif);
        }
        
        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ message: 'Server error during order creation', error: error.message });
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
        const limit = parseInt(req.query.limit) || 20;
        const orders = await Order.find({ sellerId: req.user.id })
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
        const limit = parseInt(req.query.limit) || 20;
        const orders = await Order.find({ 
            $or: [
                { deliveryBoyId: req.user.id },
                { status: 'READY_FOR_PICKUP' }
            ]
        })
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
        
        const currentOrder = await Order.findOne({ id });
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

        // Strict transition validations
        const validTransitions = {
            'PLACED': ['FARMER_ACCEPTED', 'SHOP_ACCEPTED', 'CANCELLED'],
            'FARMER_ACCEPTED': ['READY_FOR_PICKUP', 'CANCELLED'],
            'SHOP_ACCEPTED': ['READY_FOR_PICKUP', 'CANCELLED'],
            'READY_FOR_PICKUP': ['DELIVERY_ASSIGNED'], // Can't go to PICKED_UP without OTP
            'DELIVERY_ASSIGNED': ['PICKED_UP'],
            'PICKED_UP': ['OUT_FOR_DELIVERY'],
            'OUT_FOR_DELIVERY': ['DELIVERED']
        };

        const currentStatus = currentOrder.status.toUpperCase();
        const nextStatus = status.toUpperCase();

        // Check if transition is valid
        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(nextStatus)) {
             return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${nextStatus}` });
        }
        
        const updateData = { status: nextStatus };
        const now = new Date();
        
        if (nextStatus === 'FARMER_ACCEPTED' || nextStatus === 'SHOP_ACCEPTED') updateData.acceptedAt = now;
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
                updateData.status = 'DELIVERY_ASSIGNED'; // auto-advance
                updateData.assignedAt = now;
            }
        }

        if (nextStatus === 'DELIVERY_ASSIGNED') {
            updateData.assignedAt = now;
        }

        // Only backend can advance to PICKED_UP, OUT_FOR_DELIVERY, and DELIVERED via OTP routes
        if (['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(nextStatus)) {
            return res.status(403).json({ message: `Cannot manually update status to ${nextStatus}. Use OTP verification.` });
        }
        
        const updatedOrder = await Order.findOneAndUpdate(
            { id }, 
            { $set: updateData }, 
            { new: true }
        );

        // Send real-time notification to the customer
        const notifMsg = getNotificationMessage(status, updatedOrder.id);
        if (notifMsg && updatedOrder.userId) {
            const notif = await Notification.create({
                userId: updatedOrder.userId,
                type: 'Order Update',
                message: notifMsg,
                orderId: updatedOrder.id
            });

            if (req.io) {
                req.io.to(updatedOrder.userId.toString()).emit('notification', notif);
                req.io.to(updatedOrder.userId.toString()).emit('order_update', updatedOrder);
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
        
        const order = await Order.findOne({ id });
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
        order.status = 'PICKED_UP'; 
        order.shippedAt = now;
        await order.save();

        let notifMsg = getNotificationMessage('PICKED_UP', order.id);
        if (req.io && order.userId) {
            req.io.to(order.userId.toString()).emit('order_update', order);
            const notif = await Notification.create({ userId: order.userId, type: 'Order Update', message: notifMsg, orderId: order.id });
            req.io.to(order.userId.toString()).emit('notification', notif);
        }

        // Advance to OUT_FOR_DELIVERY immediately (simulated real-time tracking)
        setTimeout(async () => {
            try {
                order.status = 'OUT_FOR_DELIVERY';
                await order.save();
                const outNotifMsg = getNotificationMessage('OUT_FOR_DELIVERY', order.id);
                if (req.io && order.userId) {
                    req.io.to(order.userId.toString()).emit('order_update', order);
                    const notif2 = await Notification.create({ userId: order.userId, type: 'Order Update', message: outNotifMsg, orderId: order.id });
                    req.io.to(order.userId.toString()).emit('notification', notif2);
                }
            } catch (err) {
                console.error("Error auto-advancing to OUT_FOR_DELIVERY:", err);
            }
        }, 2000);

        res.status(200).json({ message: 'Pickup OTP verified successfully', order });
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
        
        const order = await Order.findOne({ id });
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

        const notifMsg = getNotificationMessage('DELIVERED', order.id);
        if (req.io && order.userId) {
            req.io.to(order.userId.toString()).emit('order_update', order);
            const notif = await Notification.create({ userId: order.userId, type: 'Order Update', message: notifMsg, orderId: order.id });
            req.io.to(order.userId.toString()).emit('notification', notif);
        }

        res.status(200).json({ message: 'Delivery OTP verified successfully', order });
    } catch (error) {
        console.error("Verify delivery OTP error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

function getNotificationMessage(status, orderId) {
    switch(status) {
        case 'Accepted':
        case 'ACCEPTED': 
        case 'FARMER_ACCEPTED': 
        case 'SHOP_ACCEPTED': return `Your order ${orderId} has been accepted by the seller.`;
        case 'Packed': return `Your order ${orderId} is being packed.`;
        case 'ReadyForPickup': return `Your order ${orderId} is packed and ready for pickup.`;
        case 'Assigned': 
        case 'DELIVERY_ASSIGNED': return `A delivery partner has been assigned to your order ${orderId}.`;
        case 'PICKED_UP': return `Your order ${orderId} has been picked up.`;
        case 'OutForDelivery':
        case 'OUT_FOR_DELIVERY': return `Your order ${orderId} is out for delivery.`;
        case 'Delivered':
        case 'DELIVERED': return `Your order ${orderId} has been delivered successfully.`;
        case 'Cancelled':
        case 'CANCELLED': return `Your order ${orderId} has been cancelled.`;
        default: return null;
    }
}

export default router;
