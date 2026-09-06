import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ShoppingBag,
    Truck,
    MapPin,
    CheckCircle2,
    Clock,
    Navigation,
    XCircle,
    RefreshCw,
    Search,
    AlertCircle
} from '../../components/ui/Icons';

const DeliveryOrders = () => {
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // OTP Modal
    const [otpModal, setOtpModal] = useState({
        isOpen: false,
        type: 'PICKUP',
        orderId: null,
        otpValue: ''
    });

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/delivery-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching delivery orders:', error);
            toast.error('Network error fetching orders');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleAcceptOrder = async (orderId) => {
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${orderId}/accept-delivery`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Order claimed for delivery!');
                fetchOrders();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Failed to accept order');
            }
        } catch (err) {
            toast.error('Network error accepting order');
        }
    };

    const handleOpenOtpModal = (orderId, type) => {
        setOtpModal({
            isOpen: true,
            type,
            orderId,
            otpValue: ''
        });
    };

    const handleVerifyOtpSubmit = async (e) => {
        e.preventDefault();
        const { orderId, type, otpValue } = otpModal;
        if (!otpValue || otpValue.trim().length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }

        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const endpoint = type === 'PICKUP' 
                ? `/api/orders/${orderId}/verify-pickup-otp` 
                : `/api/orders/${orderId}/verify-delivery-otp`;

            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp: otpValue.trim() })
            });

            if (res.ok) {
                toast.success(type === 'PICKUP' ? 'Pickup verified! Order is now Out for Delivery.' : 'Order marked Delivered!');
                setOtpModal({ isOpen: false, type: 'PICKUP', orderId: null, otpValue: '' });
                fetchOrders();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Invalid OTP code');
            }
        } catch (err) {
            toast.error('Network error verifying OTP');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = !searchQuery || 
            (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.deliveryAddress?.address || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === 'ALL') return true;
        return (o.status || '').toUpperCase() === statusFilter;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Available & Assigned Orders</h1>
                    <p className="text-gray-500 text-sm">Review orders ready for pickup or currently assigned to you.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh orders"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order ID or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                    {['ALL', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(st => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                                statusFilter === st ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'
                            }`}
                        >
                            {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400 space-y-2">
                        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs font-bold">Syncing delivery orders from MongoDB...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-3 shadow-sm">
                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
                        <h3 className="font-bold text-gray-800">No Orders Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                            No orders currently match the selected status filter. Check back once shops mark new orders ready.
                        </p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const isMyOrder = order.deliveryBoyId === user?.id || order.deliveryBoyId === user?._id;
                        const isReadyForPickup = order.status === 'READY_FOR_PICKUP';
                        const isAssigned = order.status === 'DELIVERY_ASSIGNED';
                        const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

                        return (
                            <div key={order._id || order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-black font-mono text-gray-900">{order.id}</h3>
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                            order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                            order.status === 'OUT_FOR_DELIVERY' ? 'bg-amber-100 text-amber-800' :
                                            order.status === 'DELIVERY_ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {(order.status || 'PENDING').replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                            <span className="text-gray-500 font-bold uppercase block text-[10px]">Pickup From</span>
                                            <p className="font-semibold text-gray-800 mt-0.5">
                                                {order.pickupLocation?.address || order.pickupAddress || 'Farm / Store Location'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                            <span className="text-gray-500 font-bold uppercase block text-[10px]">Deliver To</span>
                                            <p className="font-semibold text-gray-800 mt-0.5">
                                                {order.deliveryLocation?.address || order.deliveryAddress?.address || 'Customer Location'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 font-semibold">
                                        Total Amount: <span className="text-gray-900 font-bold">{order.totalAmount || order.total || '₹0'}</span> ({order.paymentMethod || 'COD'})
                                    </p>
                                </div>

                                {/* Order Action Buttons */}
                                <div className="flex flex-wrap items-center gap-2 self-stretch md:self-center">
                                    {isReadyForPickup && !order.deliveryBoyId && (
                                        <button
                                            onClick={() => handleAcceptOrder(order.id)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Accept Order
                                        </button>
                                    )}

                                    {isAssigned && isMyOrder && (
                                        <button
                                            onClick={() => handleOpenOtpModal(order.id, 'PICKUP')}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Verify Pickup OTP
                                        </button>
                                    )}

                                    {isOutForDelivery && isMyOrder && (
                                        <>
                                            <button
                                                onClick={() => handleOpenOtpModal(order.id, 'DELIVERY')}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> Verify Delivery OTP
                                            </button>
                                            <button
                                                onClick={() => navigate(`/delivery/tracking?orderId=${order.id}`)}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                            >
                                                <Navigation className="w-4 h-4" /> Map
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* OTP Modal */}
            {otpModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-150">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {otpModal.type === 'PICKUP' ? 'Seller Pickup Verification' : 'Customer Delivery Verification'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {otpModal.type === 'PICKUP' 
                                ? 'Enter the 6-digit OTP from seller to confirm package pickup.' 
                                : 'Enter the 6-digit OTP from customer upon delivering the package.'}
                        </p>

                        <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">6-Digit Code</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    required
                                    autoFocus
                                    placeholder="e.g. 481923"
                                    value={otpModal.otpValue}
                                    onChange={(e) => setOtpModal(prev => ({ ...prev, otpValue: e.target.value.replace(/[^0-9]/g, '') }))}
                                    className="w-full text-center tracking-widest text-2xl font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOtpModal({ isOpen: false, type: 'PICKUP', orderId: null, otpValue: '' })}
                                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                                >
                                    Confirm OTP
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryOrders;
