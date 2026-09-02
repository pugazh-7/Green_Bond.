import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging, isFirebaseConfigured } from '../firebase/firebaseConfig';
import toast from 'react-hot-toast';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Check if the current browser environment supports Push Notifications & Service Workers
 */
export const isNotificationSupported = () => {
    return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window
    );
};

/**
 * Get current browser notification permission
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

/**
 * Register Service Worker for FCM
 */
export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
        });
        return registration;
    } catch (error) {
        console.warn('Service worker registration failed:', error.message);
        return null;
    }
};

/**
 * Request notification permission and register FCM device token with backend
 * @param {string} authToken - User's JWT Bearer token
 * @returns {Promise<{ success: boolean, token?: string, message?: string }>}
 */
export const requestNotificationPermissionAndRegister = async (authToken) => {
    if (!isNotificationSupported()) {
        return { success: false, message: 'Push notifications are not supported by this browser.' };
    }

    try {
        // Request user permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, message: 'Notification permission was denied or dismissed.' };
        }

        if (!isFirebaseConfigured()) {
            console.warn('Firebase configuration missing in environment. Token generation skipped.');
            return { success: false, message: 'Firebase configuration is not set up yet.' };
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) {
            return { success: false, message: 'Firebase Messaging is unavailable on this device.' };
        }

        // Ensure service worker is ready
        const swRegistration = await registerServiceWorker();

        const currentToken = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration || undefined
        });

        if (!currentToken) {
            return { success: false, message: 'Unable to retrieve registration token from Firebase.' };
        }

        // Store token locally
        try {
            localStorage.setItem('green_bond_fcm_token', currentToken);
        } catch (e) {
            console.warn('Storage warning:', e);
        }

        // Register token with backend if user is authenticated
        const activeAuthToken = authToken || localStorage.getItem('token') || localStorage.getItem('green_bond_token');
        if (activeAuthToken) {
            await fetch(`${API_BASE}/api/notifications/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeAuthToken}`
                },
                body: JSON.stringify({
                    token: currentToken,
                    deviceType: 'browser'
                })
            });
        }

        return { success: true, token: currentToken };
    } catch (error) {
        console.error('Error enabling notifications:', error);
        return { success: false, message: error.message || 'Failed to enable notifications.' };
    }
};

/**
 * Set up foreground message listener
 * @param {Function} onMessageCallback - Optional custom callback
 */
export const setupForegroundListener = async (onMessageCallback) => {
    try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return () => {};

        return onMessage(messaging, (payload) => {
            console.log('Foreground FCM notification received:', payload);
            
            const title = payload.notification?.title || payload.data?.title || 'GreenBond Alert';
            const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
            
            // Show toast notification
            toast((t) => (
                <div 
                    onClick={() => {
                        const targetUrl = payload.data?.click_action || payload.data?.url || '/user';
                        window.location.href = targetUrl;
                        toast.dismiss(t.id);
                    }}
                    className="cursor-pointer flex flex-col gap-1"
                >
                    <span className="font-bold text-gray-900">{title}</span>
                    <span className="text-sm text-gray-600">{body}</span>
                </div>
            ), {
                duration: 5000,
                icon: '🌱'
            });

            if (typeof onMessageCallback === 'function') {
                onMessageCallback(payload);
            }
        });
    } catch (error) {
        console.warn('Unable to setup foreground FCM listener:', error.message);
        return () => {};
    }
};

/**
 * Unregister device token on logout or user preference toggle off
 */
export const unregisterNotificationToken = async (authToken) => {
    try {
        const token = localStorage.getItem('green_bond_fcm_token');
        if (!token) return;

        const activeAuthToken = authToken || localStorage.getItem('token') || localStorage.getItem('green_bond_token');
        if (activeAuthToken) {
            await fetch(`${API_BASE}/api/notifications/fcm-token`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeAuthToken}`
                },
                body: JSON.stringify({ token })
            });
        }

        localStorage.removeItem('green_bond_fcm_token');
    } catch (error) {
        console.warn('Error unregistering notification token:', error.message);
    }
};

export default {
    isNotificationSupported,
    getNotificationPermission,
    registerServiceWorker,
    requestNotificationPermissionAndRegister,
    setupForegroundListener,
    unregisterNotificationToken
};
