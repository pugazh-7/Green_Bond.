// GreenBond Firebase Cloud Messaging Service Worker

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Parse configuration from search params or use project defaults
const urlParams = new URL(location).searchParams;
const firebaseConfig = {
    apiKey: urlParams.get('apiKey') || "AIzaSyDU_5_ckKUmJKYQb4AD8M3EmD3arayp0kc",
    authDomain: urlParams.get('authDomain') || "greenbond-54d07.firebaseapp.com",
    projectId: urlParams.get('projectId') || "greenbond-54d07",
    storageBucket: urlParams.get('storageBucket') || "greenbond-54d07.firebasestorage.app",
    messagingSenderId: urlParams.get('messagingSenderId') || "566733428818",
    appId: urlParams.get('appId') || "1:566733428818:web:a8e082bd457cb7a43aa78b"
};

// Initialize Firebase compat app if projectId is provided
if (firebaseConfig.projectId) {
    try {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            console.log('[firebase-messaging-sw.js] Background message received: ', payload);
            
            const notificationTitle = payload.notification?.title || payload.data?.title || 'GreenBond Update';
            const notificationOptions = {
                body: payload.notification?.body || payload.data?.body || 'You have an update regarding your order.',
                icon: payload.notification?.icon || '/logo.jpeg',
                badge: '/logo.jpeg',
                tag: payload.data?.orderId || 'greenbond-notification',
                data: {
                    url: payload.data?.click_action || payload.data?.url || '/user',
                    orderId: payload.data?.orderId
                }
            };

            return self.registration.showNotification(notificationTitle, notificationOptions);
        });
    } catch (e) {
        console.warn('Firebase background messaging initialization note:', e.message);
    }
}

// Fallback direct Push event listener for generic web push payloads
self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
        const data = event.data.json();
        const title = data.notification?.title || data.title || '🌱 GreenBond Notification';
        const options = {
            body: data.notification?.body || data.body || 'You have a new update.',
            icon: data.notification?.icon || '/logo.jpeg',
            badge: '/logo.jpeg',
            data: {
                url: data.data?.url || data.url || '/user'
            }
        };
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.warn('Direct push parse note:', err);
    }
});

// Handle notification click: focus existing window or open target URL
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/user';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
