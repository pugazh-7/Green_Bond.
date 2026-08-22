import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Portfolio = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const isOrdersView = pathname.includes('/orders');
    
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOrdersView) {
            fetchOrders();
        }
    }, [isOrdersView]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                // fallback to local if backend fails
                setOrders(JSON.parse(localStorage.getItem('green_bond_orders') || '[]'));
            }
        } catch (error) {
            setOrders(JSON.parse(localStorage.getItem('green_bond_orders') || '[]'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login/user');
    };

    if (isOrdersView) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
                <div className="bg-white px-4 pt-safe-top pb-3 border-b border-gray-100 shadow-sm sticky top-0 z-40">
                    <h1 className="text-xl font-bold font-display text-gray-900 mt-2">My Orders</h1>
                </div>
                
                <div className="p-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-2xl"></div>)}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="text-4xl mb-4">📦</span>
                            <h3 className="font-bold text-gray-900 mb-1">No Orders Yet</h3>
                            <p className="text-sm text-gray-500">You haven't placed any orders.</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id || order._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${order.status === 'DELIVERED' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></span>
                                        <span className="text-xs font-bold text-gray-600 uppercase">{order.status || 'PROCESSING'}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Order #{String(order.id || order._id).slice(-6)}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm mb-1">{order.items?.length || 1} Items</p>
                                        <p className="text-xs text-gray-500">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">₹{order.totalAmount || order.total || 0}</p>
                                        <button onClick={() => navigate(`/user/tracking/${order.id || order._id}`)} className="text-[10px] text-greenbond-600 font-bold mt-1 bg-greenbond-50 px-2 py-1 rounded">View Details</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Profile View
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
            <div className="bg-greenbond-600 px-4 pt-safe-top pb-8 rounded-b-3xl shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-greenbond-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 mt-4 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-inner">
                        👤
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-display text-white">{user?.name || 'GreenBond User'}</h1>
                        <p className="text-greenbond-100 text-sm">{user?.email || 'user@example.com'}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 -mt-4 relative z-20">
                {/* Rewards Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🌱</span>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Green Points</h3>
                            <p className="text-[10px] text-gray-500">Earned from Fresh purchases</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-greenbond-600">350</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button onClick={() => navigate('/user/orders')} className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-400">📦</span>
                            <span className="font-semibold text-gray-700 text-sm">My Orders</span>
                        </div>
                        <span className="text-gray-300">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-400">📍</span>
                            <span className="font-semibold text-gray-700 text-sm">Saved Addresses</span>
                        </div>
                        <span className="text-gray-300">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-400">💳</span>
                            <span className="font-semibold text-gray-700 text-sm">Payment Methods</span>
                        </div>
                        <span className="text-gray-300">→</span>
                    </button>
                    <button onClick={() => navigate('/user/settings')} className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-400">⚙️</span>
                            <span className="font-semibold text-gray-700 text-sm">Settings</span>
                        </div>
                        <span className="text-gray-300">→</span>
                    </button>
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 hover:bg-red-100 transition-colors mt-6"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Portfolio;
