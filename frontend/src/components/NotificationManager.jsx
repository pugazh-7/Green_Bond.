import React, { useState, useEffect } from 'react';
import { 
    isNotificationSupported, 
    getNotificationPermission, 
    requestNotificationPermissionAndRegister,
    setupForegroundListener 
} from '../services/notificationService';
import toast from 'react-hot-toast';

export default function NotificationManager({ className = '' }) {
    const [permission, setPermission] = useState(getNotificationPermission());
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported] = useState(isNotificationSupported());
    const [isTestSending, setIsTestSending] = useState(false);

    useEffect(() => {
        setPermission(getNotificationPermission());
        
        // Listen to foreground notifications
        const unsubscribe = setupForegroundListener();
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('green_bond_token');
            const result = await requestNotificationPermissionAndRegister(token);
            setPermission(getNotificationPermission());

            if (result.success) {
                toast.success('Push notifications enabled successfully! 🌱');
            } else if (result.message) {
                toast(result.message, { icon: 'ℹ️' });
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            toast.error('Could not enable notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendTestNotification = async () => {
        setIsTestSending(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('green_bond_token');
            const apiBase = import.meta.env.VITE_API_URL || '';
            
            const response = await fetch(`${apiBase}/api/notifications/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: '🌱 GreenBond Live Test',
                    body: 'Your FCM Notification system is working seamlessly!',
                    url: '/user'
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Test notification triggered!');
            } else {
                toast.error(data.message || 'Failed to trigger test notification');
            }
        } catch (error) {
            console.error('Test notification error:', error);
            toast.error('Network error triggering test notification');
        } finally {
            setIsTestSending(false);
        }
    };

    if (!isSupported) {
        return (
            <div className={`p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-500 ${className}`}>
                <p>⚠️ Push notifications are not supported in this browser environment.</p>
            </div>
        );
    }

    return (
        <div className={`p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔔</span>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Push Notifications</h4>
                        <p className="text-xs text-gray-500">
                            {permission === 'granted' 
                                ? 'Active: Receiving order and delivery updates' 
                                : permission === 'denied' 
                                    ? 'Permission blocked in browser settings' 
                                    : 'Stay updated on orders, fresh produce & deliveries'}
                        </p>
                    </div>
                </div>

                {permission === 'granted' ? (
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Enabled
                        </span>
                        <button
                            onClick={handleSendTestNotification}
                            disabled={isTestSending}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {isTestSending ? 'Sending...' : 'Test'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleEnableNotifications}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? 'Enabling...' : 'Enable'}
                    </button>
                )}
            </div>
        </div>
    );
}
