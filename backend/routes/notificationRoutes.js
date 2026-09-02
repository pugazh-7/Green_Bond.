import express from 'express';
import Notification from '../models/Notification.js';
import DeviceToken from '../models/DeviceToken.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { sendNotificationToUser, isFirebaseConfigured } from '../services/firebaseAdmin.js';

const router = express.Router();

// 1. Get current user's notifications
router.get('/', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error("Fetch notifications error:", error);
        res.status(500).json({ success: false, message: "Server error fetching notifications" });
    }
});

// 2. Register or update FCM device token
router.post('/fcm-token', verifyToken, async (req, res) => {
    try {
        const { token, platform, deviceType } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, message: 'Valid FCM device token is required' });
        }

        const userId = req.user.id;
        const role = req.user.role || 'user';
        const userAgent = req.headers['user-agent'] || '';

        // Detect platform if not specified
        let detectedPlatform = platform || 'web';
        if (/android/i.test(userAgent)) detectedPlatform = 'android';
        else if (/iphone|ipad|ipod/i.test(userAgent)) detectedPlatform = 'ios';
        else if (/windows|macintosh|linux/i.test(userAgent)) detectedPlatform = 'desktop';

        // Upsert token
        const deviceRecord = await DeviceToken.findOneAndUpdate(
            { token },
            {
                userId,
                role,
                token,
                platform: detectedPlatform,
                deviceType: deviceType || 'browser',
                userAgent,
                isActive: true,
                lastUsedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'FCM device token registered successfully',
            deviceId: deviceRecord._id
        });
    } catch (error) {
        console.error("Register FCM token error:", error);
        res.status(500).json({ success: false, message: "Server error registering FCM device token" });
    }
});

// 3. Deactivate / remove FCM device token (e.g. on logout or permission revoke)
router.delete('/fcm-token', verifyToken, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: 'Device token is required' });
        }

        await DeviceToken.updateMany(
            { token, userId: req.user.id },
            { $set: { isActive: false } }
        );

        res.status(200).json({ success: true, message: 'Device token deactivated successfully' });
    } catch (error) {
        console.error("Delete FCM token error:", error);
        res.status(500).json({ success: false, message: "Server error deleting FCM device token" });
    }
});

// 4. Notification capability and device status for current user
router.get('/status', verifyToken, async (req, res) => {
    try {
        const activeDevices = await DeviceToken.countDocuments({ 
            userId: req.user.id, 
            isActive: true 
        });

        res.status(200).json({
            success: true,
            firebaseConfigured: isFirebaseConfigured(),
            activeDevicesCount: activeDevices,
            unreadNotifications: await Notification.countDocuments({ userId: req.user.id, isRead: false })
        });
    } catch (error) {
        console.error("Get notification status error:", error);
        res.status(500).json({ success: false, message: "Server error getting notification status" });
    }
});

// 5. Send test notification to own devices (or admin test)
router.post('/test', verifyToken, async (req, res) => {
    try {
        const targetUserId = req.body.targetUserId || req.user.id;
        
        // Non-admins can only test send to themselves
        if (String(targetUserId) !== String(req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        const result = await sendNotificationToUser(targetUserId, {
            title: req.body.title || '🌱 GreenBond Notification',
            body: req.body.body || 'Your notification service is active and ready!',
            type: 'System',
            data: {
                url: req.body.url || '/user',
                timestamp: new Date().toISOString()
            }
        });

        res.status(200).json({
            success: true,
            message: 'Test notification processed',
            result
        });
    } catch (error) {
        console.error("Test notification error:", error);
        res.status(500).json({ success: false, message: "Server error sending test notification" });
    }
});

// 6. Mark all notifications as read
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
        console.error("Update notifications error:", error);
        res.status(500).json({ success: false, message: "Server error updating notifications" });
    }
});

// 7. Mark single notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error("Update notification error:", error);
        res.status(500).json({ success: false, message: "Server error updating notification" });
    }
});

export default router;
