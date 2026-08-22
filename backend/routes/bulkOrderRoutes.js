import express from 'express';
import BulkOrder from '../models/BulkOrder.js';
import Product from '../models/Product.js';
import { verifyToken, isFarmer } from '../middleware/auth.js';

const router = express.Router();

// User: Create a new bulk order inquiry
router.post('/', verifyToken, async (req, res) => {
    try {
        const { productId, requestedQuantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product || product.orderType !== 'bulk') {
            return res.status(400).json({ message: 'Invalid product or not eligible for bulk order.' });
        }
        
        const minOrder = parseInt(product.minOrder) || 10;
        if (requestedQuantity < minOrder) {
            return res.status(400).json({ message: `Minimum order for this product is ${minOrder} ${product.unit}` });
        }

        const newBulkOrder = new BulkOrder({
            orderId: `BLK-${Math.floor(100000 + Math.random() * 900000)}`,
            title: product.name || product.title,
            productId: product._id,
            customer: {
                id: req.user.id,
                name: req.user.name || "Customer",
                contact: req.user.phone || req.user.mobile || "+91 9999999999",
                address: req.user.address || "Preferred Location"
            },
            farmer: product.farmer,
            farmerId: product.farmerId || product.sellerId,
            location: product.location,
            requestedQuantity,
            price: `₹${product.price}/${product.unit}`,
            image: product.image
        });

        await newBulkOrder.save();
        res.status(201).json({ message: 'Bulk order inquiry sent successfully', bulkOrder: newBulkOrder });
    } catch (error) {
        console.error('Create bulk order error:', error);
        res.status(500).json({ message: 'Server error creating bulk order' });
    }
});

// User: Get my bulk inquiries
router.get('/my-inquiries', verifyToken, async (req, res) => {
    try {
        const inquiries = await BulkOrder.find({ "customer.id": req.user.id }).sort({ date: -1 }).lean();
        // Transform the date field to match the frontend expectations
        const formatted = inquiries.map(i => ({ ...i, id: i._id }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Farmer: Get inquiries directed to me
router.get('/farmer-inquiries', verifyToken, isFarmer, async (req, res) => {
    try {
        const inquiries = await BulkOrder.find({ farmerId: req.user.id }).sort({ date: -1 }).lean();
        const formatted = inquiries.map(i => ({ ...i, id: i._id }));
        res.status(200).json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Farmer/User: Update status
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Order Confirmed', 'Order Rejected', 'Cancelled'
        
        const bulkOrder = await BulkOrder.findOne({ orderId: id });
        if (!bulkOrder) return res.status(404).json({ message: 'Bulk order not found' });
        
        // Authorization check
        if (req.user.role === 'client' || req.user.role === 'farmer') {
            if (bulkOrder.farmerId.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        } else {
            if (bulkOrder.customer.id && bulkOrder.customer.id.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }
        }

        bulkOrder.status = status;
        await bulkOrder.save();
        
        res.status(200).json({ message: `Bulk order ${status.toLowerCase()}`, bulkOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
