import express from 'express';
import { verifyToken, isShop } from '../middleware/auth.js';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get shop dashboard metrics
router.get('/metrics', verifyToken, isShop, async (req, res) => {
    try {
        const shopId = req.user.id;
        
        // Active products count
        const productCount = await Product.countDocuments({ sellerId: shopId });
        
        // Orders count
        const totalOrders = await Order.countDocuments({ sellerId: shopId });
        
        // Earnings
        const orders = await Order.find({ sellerId: shopId, status: 'DELIVERED' });
        const earnings = orders.reduce((sum, order) => sum + (order.farmerAmount || 0), 0);
        
        // Shop profile
        const shopProfile = await Shop.findById(shopId).select('-password');
        
        res.status(200).json({
            productCount,
            totalOrders,
            earnings,
            profile: shopProfile
        });
    } catch (error) {
        console.error("Fetch shop metrics error:", error);
        res.status(500).json({ message: 'Server error fetching shop metrics', error: error.message });
    }
});

// Update shop profile / operating hours / active status
router.put('/profile', verifyToken, isShop, async (req, res) => {
    try {
        const { isActive, operatingHours, name, ownerName } = req.body;
        
        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (operatingHours !== undefined) updateData.operatingHours = operatingHours;
        if (name !== undefined) updateData.name = name;
        if (ownerName !== undefined) updateData.ownerName = ownerName;
        
        const shop = await Shop.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
        
        res.status(200).json({ message: 'Profile updated successfully', shop });
    } catch (error) {
        console.error("Update shop profile error:", error);
        res.status(500).json({ message: 'Server error updating profile', error: error.message });
    }
});

export default router;
