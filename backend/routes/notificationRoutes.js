import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user's notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50); // Hard cap at 50 per user as discussed
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Fetch notifications error:", error);
        res.status(500).json({ message: "Server error fetching notifications" });
    }
});

// Mark all as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Update notifications error:", error);
        res.status(500).json({ message: "Server error updating notifications" });
    }
});

// Mark single as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.status(200).json(notification);
    } catch (error) {
        console.error("Update notification error:", error);
        res.status(500).json({ message: "Server error updating notification" });
    }
});

export default router;
