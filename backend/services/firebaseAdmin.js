import admin from 'firebase-admin';
import DeviceToken from '../models/DeviceToken.js';
import Notification from '../models/Notification.js';

let isInitialized = false;

export const initFirebaseAdmin = () => {
    if (isInitialized) return admin;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        try {
            // Handle escaped newlines in environment variable
            if (privateKey.includes('\\n')) {
                privateKey = privateKey.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey
                })
            });

            isInitialized = true;
            console.log('✓ Firebase Admin SDK initialized successfully');
            return admin;
        } catch (error) {
            console.error('✗ Firebase Admin SDK initialization error:', error.message);
            return null;
        }
    } else {
        console.log('ℹ Firebase Admin credentials not configured. FCM running in simulation/mock mode.');
        return null;
    }
};

// Automatically initialize on module import
initFirebaseAdmin();

export const isFirebaseConfigured = () => {
    return isInitialized;
};

/**
 * Send FCM push notification to all active devices of a user
 * @param {string|ObjectId} userId
 * @param {Object} notificationData - { title, body, icon, data, type, orderId }
 */
export const sendNotificationToUser = async (userId, notificationData = {}) => {
    const { title, body, icon = '/logo.jpeg', data = {}, type = 'System', orderId } = notificationData;

    try {
        // 1. Persist notification to MongoDB Notification model for in-app bell/feed
        const newNotification = new Notification({
            userId,
            type: type || 'System',
            message: `${title ? title + ': ' : ''}${body || ''}`,
            orderId
        });
        await newNotification.save();

        // 2. Fetch all active device tokens for the user
        const devices = await DeviceToken.find({ userId, isActive: true });
        if (!devices || devices.length === 0) {
            return {
                success: true,
                inAppNotificationId: newNotification._id,
                pushSent: false,
                reason: 'No active device tokens found for user'
            };
        }

        const tokens = devices.map(d => d.token);

        if (!isInitialized) {
            return {
                success: true,
                inAppNotificationId: newNotification._id,
                pushSent: false,
                simulated: true,
                tokenCount: tokens.length,
                message: 'Notification saved to DB. Push simulated (Firebase credentials pending)'
            };
        }

        // 3. Send multicast message via Firebase Admin SDK
        const message = {
            tokens,
            notification: {
                title: title || 'GreenBond Update',
                body: body || ''
            },
            data: {
                ...Object.fromEntries(
                    Object.entries(data).map(([k, v]) => [k, String(v)])
                ),
                notificationId: String(newNotification._id),
                type: String(type),
                click_action: data.url || data.link || '/user'
            },
            webpush: {
                notification: {
                    title: title || 'GreenBond Update',
                    body: body || '',
                    icon: icon || '/logo.jpeg',
                    badge: '/logo.jpeg'
                },
                fcmOptions: {
                    link: data.url || data.link || '/user'
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        // 4. Clean up invalid/expired tokens
        const tokensToDeactivate = [];
        response.responses.forEach((res, idx) => {
            if (!res.success) {
                const errorCode = res.error?.code;
                if (
                    errorCode === 'messaging/registration-token-not-registered' ||
                    errorCode === 'messaging/invalid-registration-token' ||
                    errorCode === 'messaging/mismatched-credential'
                ) {
                    tokensToDeactivate.push(tokens[idx]);
                }
            }
        });

        if (tokensToDeactivate.length > 0) {
            await DeviceToken.updateMany(
                { token: { $in: tokensToDeactivate } },
                { $set: { isActive: false } }
            );
            console.log(`Deactivated ${tokensToDeactivate.length} expired FCM device token(s)`);
        }

        return {
            success: true,
            inAppNotificationId: newNotification._id,
            pushSent: true,
            successCount: response.successCount,
            failureCount: response.failureCount
        };
    } catch (error) {
        console.error('Error sending notification to user:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send notification to a specific topic (e.g. 'fresh_deals', 'all_users')
 */
export const sendNotificationToTopic = async (topic, notificationData = {}) => {
    if (!isInitialized) {
        return { success: true, simulated: true, topic, message: 'Push simulated (Firebase credentials pending)' };
    }

    const { title, body, icon = '/logo.jpeg', data = {} } = notificationData;

    try {
        const message = {
            topic,
            notification: { title, body },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            webpush: {
                notification: { title, body, icon, badge: '/logo.jpeg' },
                fcmOptions: { link: data.url || '/user' }
            }
        };

        const response = await admin.messaging().send(message);
        return { success: true, messageId: response };
    } catch (error) {
        console.error(`Error sending notification to topic ${topic}:`, error.message);
        return { success: false, error: error.message };
    }
};

export default {
    initFirebaseAdmin,
    isFirebaseConfigured,
    sendNotificationToUser,
    sendNotificationToTopic
};
