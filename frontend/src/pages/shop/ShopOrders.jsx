import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

import {
    Package,
    Clock,
    CheckCircle2,
    AlertCircle,
    Truck,
    Search,
    RefreshCw,
    MapPin,
    Calendar,
    ArrowRight
} from '../../components/ui/Icons';

const ShopOrders = () => {
    const { accessToken } = useAuth();
    const { socket } = useSocket() || {};
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const fetchOrders = useCallback(async (quiet = false) => {
        if (!quiet) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch('/api/orders/shop-orders', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            } else {
                toast.error('Failed to load shop orders');
            }
        } catch (error) {
            console.error('Error fetching shop orders:', error);
            toast.error('Network error loading orders');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchOrders();

        if (socket) {
            const handleOrderUpdate = () => {
                fetchOrders(true);
            };

            socket.on('order_created', handleOrderUpdate);
            socket.on('order_status_update', handleOrderUpdate);
            return () => {
                socket.off('order_created', handleOrderUpdate);
                socket.off('order_status_update', handleOrderUpdate);
            };
        }
    }, [fetchOrders]);

    const updateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success(`Order moved to ${newStatus.replace(/_/g, ' ')}`);
                await fetchOrders(true);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update order status');
            }
        } catch (err) {
            toast.error('Network error updating status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const filterCounts = {
        ALL: orders.length,
        PLACED: orders.filter(o => o.status === 'PLACED').length,
        PACKING: orders.filter(o => ['SHOP_ACCEPTED', 'CONFIRMED', 'PACKING', 'PACKED'].includes(o.status)).length,
        READY_FOR_PICKUP: orders.filter(o => ['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
        DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    };

    const filteredOrders = orders.filter(order => {
        // Status filter
        if (statusFilter === 'PLACED' && order.status !== 'PLACED') return false;
        if (statusFilter === 'PACKING' && !['SHOP_ACCEPTED', 'CONFIRMED', 'PACKING', 'PACKED'].includes(order.status)) return false;
        if (statusFilter === 'READY_FOR_PICKUP' && !['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status)) return false;
        if (statusFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false;

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const idMatch = (order.id || order._id || '').toLowerCase().includes(q);
            const userMatch = (order.userId?.name || '').toLowerCase().includes(q);
            const addressMatch = (order.deliveryAddress?.address || '').toLowerCase().includes(q);
            return idMatch || userMatch || addressMatch;
        }

        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PLACED':
                return { label: 'New Order', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
            case 'SHOP_ACCEPTED':
            case 'CONFIRMED':
                return { label: 'Accepted', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'PACKING':
                return { label: 'Packing Items', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
            case 'PACKED':
                return { label: 'Packed & Sealed', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'READY_FOR_PICKUP':
                return { label: 'Ready for Pickup', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'DELIVERY_ASSIGNED':
                return { label: 'Driver Assigned', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
            case 'OUT_FOR_DELIVERY':
                return { label: 'Out for Delivery', bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
            case 'DELIVERED':
                return { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
            case 'CANCELLED':
                return { label: 'Cancelled', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
            default:
                return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Package className="w-6 h-6 text-emerald-600" />
                        Shop Orders
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Fulfill, pack, and prepare customer orders for delivery pickup
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchOrders(true)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
                    {[
                        { key: 'ALL', label: 'All Orders' },
                        { key: 'PLACED', label: 'New / Placed' },
                        { key: 'PACKING', label: 'In Packing' },
                        { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
                        { key: 'DELIVERED', label: 'Delivered' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                                statusFilter === tab.key
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {filterCounts[tab.key] || 0}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search order ID, user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                </div>
            </div>

            {/* Order Cards List */}
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Loading shop orders...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No orders found</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {searchQuery ? 'Try adjusting your search criteria' : 'New customer orders will appear here automatically'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(order => {
                        const badge = getStatusBadge(order.status);
                        const isUpdating = updatingOrderId === order.id;

                        return (
                            <div
                                key={order.id || order._id}
                                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                    Order #{order.id}
                                                </h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(order.createdAt).toLocaleString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pickup OTP Display when ready */}
                                    {['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status) && (
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Pickup OTP (Give to Driver)</p>
                                                <p className="text-base font-black text-emerald-700 tracking-widest">{order.pickupOtp || '----'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Body */}
                                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                                    {/* Items to Pack */}
                                    <div className="lg:col-span-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                                            Order Items ({order.items?.length || 0})
                                        </h4>
                                        <div className="space-y-2 bg-slate-50/60 rounded-xl p-3 border border-slate-100">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-200/50 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                        <span className="font-semibold text-slate-800">{item.title}</span>
                                                        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Customer & Delivery Details */}
                                    <div className="space-y-3 bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                Customer & Destination
                                            </h4>
                                            <p className="text-sm font-bold text-slate-800">
                                                {order.userId?.name || 'Customer'}
                                            </p>
                                            {order.userId?.mobile && (
                                                <p className="text-xs text-slate-600 mt-0.5">📞 {order.userId.mobile}</p>
                                            )}
                                            <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{order.deliveryAddress?.address || 'Standard Delivery Location'}</span>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-slate-500">Total Amount</p>
                                                <p className="text-lg font-black text-slate-900">₹{order.totalAmount || order.total || 0}</p>
                                            </div>
                                            <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-700">
                                                {order.paymentMode || 'COD'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Footer */}
                                <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Current Status: <b className="text-slate-800">{badge.label}</b></span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Placed -> Accept */}
                                        {order.status === 'PLACED' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'SHOP_ACCEPTED')}
                                                disabled={isUpdating}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>{isUpdating ? 'Updating...' : 'Accept Order'}</span>
                                            </button>
                                        )}

                                        {/* Shop Accepted / Confirmed -> Start Packing */}
                                        {['SHOP_ACCEPTED', 'CONFIRMED'].includes(order.status) && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'PACKING')}
                                                disabled={isUpdating}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                                            >
                                                <Package className="w-4 h-4" />
                                                <span>{isUpdating ? 'Updating...' : 'Start Packing'}</span>
                                            </button>
                                        )}

                                        {/* Packing -> Mark Packed */}
                                        {order.status === 'PACKING' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'PACKED')}
                                                disabled={isUpdating}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>{isUpdating ? 'Updating...' : 'Mark Packed'}</span>
                                            </button>
                                        )}

                                        {/* Packed -> Ready for Pickup */}
                                        {order.status === 'PACKED' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                                                disabled={isUpdating}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                                            >
                                                <Truck className="w-4 h-4" />
                                                <span>{isUpdating ? 'Updating...' : 'Ready for Driver Pickup'}</span>
                                            </button>
                                        )}

                                        {/* Ready for Pickup notice */}
                                        {order.status === 'READY_FOR_PICKUP' && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Awaiting delivery partner assignment</span>
                                            </div>
                                        )}

                                        {order.status === 'DELIVERY_ASSIGNED' && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                                <Truck className="w-3.5 h-3.5" />
                                                <span>Driver on way to pickup (verify OTP)</span>
                                            </div>
                                        )}

                                        {order.status === 'OUT_FOR_DELIVERY' && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200">
                                                <Truck className="w-3.5 h-3.5" />
                                                <span>Out for customer delivery</span>
                                            </div>
                                        )}

                                        {order.status === 'DELIVERED' && (
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Order Completed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ShopOrders;
