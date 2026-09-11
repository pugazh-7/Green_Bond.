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
        const productCount = await Product.countDocuments({ 
            $or: [{ sellerId: shopId }, { farmerId: shopId }] 
        });
        
        // Detailed Order Stage Counts
        const [totalOrders, pendingOrders, preparingOrders, packedOrders, completedOrders, deliveredOrdersList, shopProfile] = await Promise.all([
            Order.countDocuments({ sellerId: shopId }),
            Order.countDocuments({ sellerId: shopId, status: { $in: ['PLACED', 'PENDING'] } }),
            Order.countDocuments({ sellerId: shopId, status: { $in: ['SHOP_ACCEPTED', 'CONFIRMED', 'PACKING'] } }),
            Order.countDocuments({ sellerId: shopId, status: { $in: ['PACKED', 'READY_FOR_PICKUP'] } }),
            Order.countDocuments({ sellerId: shopId, status: 'DELIVERED' }),
            Order.find({ sellerId: shopId, status: 'DELIVERED' }).select('total totalAmount farmerAmount'),
            Shop.findById(shopId).select('-password')
        ]);
        
        const earnings = deliveredOrdersList.reduce((sum, order) => {
            const amt = order.farmerAmount || parseFloat((order.total || order.totalAmount || '0').toString().replace(/[^0-9.]/g, '')) || 0;
            return sum + amt;
        }, 0);
        
        res.status(200).json({
            productCount,
            totalOrders,
            pendingOrders,
            preparingOrders,
            packedOrders,
            completedOrders,
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
