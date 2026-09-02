import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase Client Configuration loaded from Vite environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let messagingPromise = null;

export const isFirebaseConfigured = () => {
    return Boolean(
        firebaseConfig.apiKey &&
        firebaseConfig.projectId &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId
    );
};

export const getFirebaseApp = () => {
    if (!isFirebaseConfigured()) {
        return null;
    }
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
};

export const getFirebaseMessaging = async () => {
    if (messagingPromise) return messagingPromise;

    messagingPromise = (async () => {
        try {
            const isMessagingSupported = await isSupported();
            if (!isMessagingSupported || !isFirebaseConfigured()) {
                return null;
            }
            const firebaseApp = getFirebaseApp();
            if (!firebaseApp) return null;
            return getMessaging(firebaseApp);
        } catch (error) {
            console.warn('Firebase Messaging is not supported in this browser environment:', error.message);
            return null;
        }
    })();

    return messagingPromise;
};

export default {
    firebaseConfig,
    isFirebaseConfigured,
    getFirebaseApp,
    getFirebaseMessaging
};
