import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Store,
    ShoppingBag,
    Package,
    CreditCard,
    Clock,
    CheckCircle2,
    RefreshCw,
    ChevronRight,
    ArrowRight,
    Power
} from '../../components/ui/Icons';

const ShopDashboard = () => {
    const { user, accessToken } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setFetchError(null);
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiBase = import.meta.env.VITE_API_URL || '';

            const [metricsRes, ordersRes] = await Promise.all([
                fetch(`${apiBase}/api/shop/metrics`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/orders/shop-orders?limit=5`, { headers }).catch(() => null)
            ]);

            if (metricsRes?.ok) {
                const data = await metricsRes.json();
                setMetrics(data);
            }
            if (ordersRes?.ok) {
                const orderData = await ordersRes.json();
                setRecentOrders(Array.isArray(orderData) ? orderData : []);
            }
        } catch (error) {
            console.error('Error fetching shop dashboard metrics:', error);
            setFetchError('Failed to synchronize shop metrics from server.');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 15000); // 15s poll
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const handleToggleStatus = async () => {
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const newStatus = !(metrics?.profile?.isActive ?? true);
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/shop/profile`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ isActive: newStatus })
            });

            if (res.ok) {
                setMetrics(prev => ({
                    ...prev,
                    profile: { ...prev?.profile, isActive: newStatus }
                }));
                toast.success(newStatus ? 'Shop is now OPEN for orders' : 'Shop is now CLOSED');
            } else {
                toast.error('Failed to update shop status');
            }
        } catch (err) {
            toast.error('Network error updating shop status');
        }
    };

    const isOpen = metrics?.profile?.isActive ?? true;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header with Store Status Toggle */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200 text-amber-700">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{metrics?.profile?.name || user?.name || 'Shop Panel'}</h1>
                        <p className="text-gray-500 text-sm">Managed by <strong className="text-gray-800">{metrics?.profile?.ownerName || user?.name}</strong></p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Store Status:</span>
                    <button 
                        onClick={handleToggleStatus}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            isOpen ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-300 text-gray-700'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-white animate-pulse' : 'bg-gray-500'}`}></span>
                        {isOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl border text-amber-700 bg-amber-50 border-amber-200">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">Action</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Orders</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.pendingOrders || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl border text-blue-700 bg-blue-50 border-blue-200">
                            <Package className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">Packing</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In Preparation</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{(metrics?.preparingOrders || 0) + (metrics?.packedOrders || 0)}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl border text-emerald-700 bg-emerald-50 border-emerald-200">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">Fulfilled</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Orders</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{metrics?.completedOrders || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 rounded-xl border text-purple-700 bg-purple-50 border-purple-200">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">Net</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Earnings</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">₹{(metrics?.earnings || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders Stream */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-amber-600" />
                            <h2 className="font-bold text-gray-900">Recent Shop Orders</h2>
                        </div>
                        <Link to="/shop/orders" className="text-xs font-bold text-amber-700 hover:underline inline-flex items-center gap-1">
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="divide-y divide-gray-100 text-sm">
                        {recentOrders.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">
                                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                <p className="font-semibold">No orders placed yet for your shop products.</p>
                            </div>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order._id || order.id} className="p-5 flex justify-between items-center hover:bg-gray-50/60 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold font-mono text-gray-900">{order.id}</span>
                                            <span className="text-xs text-gray-400">• {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {order.items?.length || 1} item(s) • Total: <strong className="text-gray-800">₹{order.totalAmount || order.total}</strong>
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                        order.status === 'READY_FOR_PICKUP' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'PACKING' ? 'bg-amber-100 text-amber-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {(order.status || 'PLACED').replace(/_/g, ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                        <h3 className="font-bold text-gray-900 text-base">Quick Shortcuts</h3>
                        <Link 
                            to="/shop/products"
                            className="flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-amber-700" />
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Manage Inventory</p>
                                    <p className="text-xs text-gray-500">{metrics?.productCount || 0} active products</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link 
                            to="/shop/orders"
                            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-gray-700" />
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Process Orders</p>
                                    <p className="text-xs text-gray-500">Pack & Dispatch</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDashboard;
