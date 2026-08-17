import express from 'express';
import Order from '../models/Order.js';
import { isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create new order
router.post('/', async (req, res) => {
    try {
        const orderData = req.body;
        // Generate a random order ID if not provided
        if (!orderData.id) {
            orderData.id = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        const newOrder = new Order(orderData);
        await newOrder.save();
        
        res.status(201).json({ message: 'Order created successfully', order: newOrder });
    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ message: 'Server error during order creation', error: error.message });
    }
});

// Fetch user orders by email
router.get('/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const cleanEmail = email.trim().toLowerCase();
        
        const orders = await Order.find({ customerEmail: cleanEmail }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch orders error:", error);
        res.status(500).json({ message: 'Server error fetching orders', error: error.message });
    }
});

// Admin ONLY: Fetch all system orders
router.get('/admin/all', isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Fetch all orders error:", error);
        res.status(500).json({ message: 'Server error fetching all orders', error: error.message });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updateData = { status };
        
        // Stamp the correct timestamp dynamically
        const now = new Date();
        if (status === 'Accepted') updateData.acceptedAt = now;
        if (status === 'Shipped') updateData.shippedAt = now;
        if (status === 'Delivered') updateData.deliveredAt = now;
        
        const updatedOrder = await Order.findOneAndUpdate(
            { id }, 
            { $set: updateData }, 
            { new: true }
        );
        
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.status(200).json({ message: 'Order updated successfully', order: updatedOrder });
    } catch (error) {
        console.error("Order status update error:", error);
        res.status(500).json({ message: 'Server error updating order', error: error.message });
    }
});

export default router;
