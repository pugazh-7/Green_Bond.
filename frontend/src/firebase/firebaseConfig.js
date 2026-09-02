import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase Client Configuration loaded from Vite environment variables with project defaults
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDU_5_ckKUmJKYQb4AD8M3EmD3arayp0kc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "greenbond-54d07.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "greenbond-54d07",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "greenbond-54d07.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "566733428818",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:566733428818:web:a8e082bd457cb7a43aa78b",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-EV67M897ME"
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
