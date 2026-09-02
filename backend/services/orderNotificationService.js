import Notification from '../models/Notification.js';
import { sendNotificationToUser } from './firebaseAdmin.js';
import Order from '../models/Order.js';

export const NOTIFICATION_EVENTS = {
    ORDER_PLACED: 'ORDER_PLACED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    ORDER_CONFIRMED: 'ORDER_CONFIRMED',
    ORDER_PREPARING: 'ORDER_PREPARING',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    ORDER_DELIVERED: 'ORDER_DELIVERED',
    ORDER_CANCELLED: 'ORDER_CANCELLED'
};

const EVENT_TEMPLATES = {
    ORDER_PLACED: (orderId) => ({
        title: 'Order placed',
        body: `Your GreenBond order ${orderId} has been placed successfully.`,
        type: 'Order Update',
        url: '/user/orders'
    }),
    PAYMENT_SUCCESS: (orderId) => ({
        title: 'Payment successful',
        body: `Payment for your GreenBond order ${orderId} was successful.`,
        type: 'Order Update',
        url: '/user/orders'
    }),
    PAYMENT_FAILED: (orderId) => ({
        title: 'Payment failed',
        body: `Payment for order ${orderId} could not be processed. Please try again.`,
        type: 'Order Update',
        url: '/user/orders'
    }),
    ORDER_CONFIRMED: (orderId) => ({
        title: 'Order confirmed',
        body: `Your order ${orderId} has been confirmed and is being processed.`,
        type: 'Order Update',
        url: '/user/orders'
    }),
    ORDER_PREPARING: (orderId) => ({
        title: 'Order preparing',
        body: `Your order ${orderId} is now being prepared.`,
        type: 'Order Update',
        url: '/user/orders'
    }),
    OUT_FOR_DELIVERY: (orderId) => ({
        title: 'Out for delivery',
        body: `Your GreenBond order ${orderId} is on the way.`,
        type: 'Delivery Update',
        url: `/user/tracking?orderId=${orderId}`
    }),
    ORDER_DELIVERED: (orderId) => ({
        title: 'Order delivered',
        body: `Your GreenBond order ${orderId} has been delivered.`,
        type: 'Delivery Update',
        url: '/user/orders'
    }),
    ORDER_CANCELLED: (orderId) => ({
        title: 'Order cancelled',
        body: `Your GreenBond order ${orderId} has been cancelled.`,
        type: 'Order Update',
        url: '/user/orders'
    })
};

/**
 * Dispatch an order lifecycle notification with duplicate protection & async safety
 * @param {string} event - NOTIFICATION_EVENTS enum value
 * @param {Object} order - Order document or object with { id, userId }
 * @param {Object} [io] - Optional Socket.IO instance for real-time websocket emit
 */
export const dispatchOrderNotification = async (event, order, io = null) => {
    if (!order || !order.id || !order.userId) {
        console.warn(`[Notification] Skipped ${event}: Missing order or customer userId`);
        return { success: false, skipped: true, reason: 'Missing order or userId' };
    }

    const orderId = order.id;
    const userId = order.userId;
    const templateFn = EVENT_TEMPLATES[event];

    if (!templateFn) {
        console.warn(`[Notification] Unknown event type: ${event}`);
        return { success: false, skipped: true, reason: 'Unknown event type' };
    }

    // 1. Idempotency check: Prevent duplicate notifications for the same (orderId + event)
    const existingNotification = await Notification.findOne({
        orderId: String(orderId),
        eventTag: `${orderId}_${event}`
    });

    if (existingNotification) {
        console.log(`[Notification] Idempotency: Skipped duplicate ${event} for order ${orderId}`);
        return { success: true, duplicatePrevented: true };
    }

    const template = templateFn(orderId);

    try {
        // Save in-app notification with event tag for guaranteed idempotency
        const inAppNotif = new Notification({
            userId,
            type: template.type,
            message: template.body,
            orderId,
            eventTag: `${orderId}_${event}`
        });
        await inAppNotif.save();

        // Emit socket.io real-time event if available
        if (io) {
            try {
                io.to(String(userId)).emit('notification', inAppNotif);
                io.to(String(userId)).emit('order_update', { id: orderId, event });
            } catch (ioErr) {
                console.warn('[SocketIO] Emit notice:', ioErr.message);
            }
        }

        // Asynchronously dispatch FCM Push notification without blocking the response
        setImmediate(async () => {
            try {
                const fcmResult = await sendNotificationToUser(userId, {
                    title: template.title,
                    body: template.body,
                    type: template.type,
                    orderId,
                    data: {
                        event,
                        orderId,
                        url: template.url
                    }
                });

                // Structured logging (Never logging passwords, tokens, or PII)
                console.log(JSON.stringify({
                    level: 'info',
                    component: 'NotificationService',
                    event,
                    orderId,
                    userId: String(userId),
                    pushSent: fcmResult?.pushSent ?? false,
                    simulated: fcmResult?.simulated ?? false,
                    timestamp: new Date().toISOString()
                }));
            } catch (fcmErr) {
                console.error(JSON.stringify({
                    level: 'error',
                    component: 'NotificationService',
                    event,
                    orderId,
                    error: fcmErr.message,
                    timestamp: new Date().toISOString()
                }));
            }
        });

        return { success: true, notificationId: inAppNotif._id };
    } catch (err) {
        console.error(`[Notification] Error creating notification for ${event}:`, err.message);
        return { success: false, error: err.message };
    }
};

export default {
    NOTIFICATION_EVENTS,
    dispatchOrderNotification
};
