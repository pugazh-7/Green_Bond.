import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import {
    Truck,
    Package,
    MapPin,
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Navigation,
    Phone,
    RefreshCw,
    ChevronRight,
    ShoppingBag
} from '../../components/ui/Icons';
import LocationPicker from '../../components/LocationPicker';

const DeliveryDashboard = () => {
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [deliveryStats, setDeliveryStats] = useState({
        activeDeliveries: 0,
        deliveredToday: 0,
        pendingPickups: 0,
        totalEarnings: 0
    });
    const [status, setStatus] = useState('Available');
    const [location, setLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Modal state for OTP verification
    const [otpModal, setOtpModal] = useState({
        isOpen: false,
        type: 'PICKUP', // 'PICKUP' or 'DELIVERY'
        orderId: null,
        otpValue: ''
    });

    const fetchData = useCallback(async () => {
        setFetchError(null);
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            if (!token) return;
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiBase = import.meta.env.VITE_API_URL || '';

            const [ordersRes, statsRes] = await Promise.all([
                fetch(`${apiBase}/api/orders/delivery-orders`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/orders/delivery-stats`, { headers }).catch(() => null)
            ]);

            if (ordersRes?.ok) {
                const data = await ordersRes.json();
                setOrders(data);
                
                // Active order: assigned to partner and in active transit
                const active = data.find(o => 
                    ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
                );
                setActiveOrder(active || null);
            }

            if (statsRes?.ok) {
                const statsData = await statsRes.json();
                setDeliveryStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching delivery dashboard data:', error);
            setFetchError('Failed to synchronize delivery data from server.');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchData();

        const token = accessToken || localStorage.getItem('green_bond_token');
        let deliveryId = user?.id || user?._id;
        if (!deliveryId && token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                deliveryId = payload.id;
            } catch (e) {}
        }

        const socket = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined);
        if (deliveryId) {
            socket.emit('join', deliveryId);
            socket.on('order_update', () => {
                fetchData();
            });
            socket.on('delivery_assigned', () => {
                toast.success('New delivery order assigned!', { icon: '📦' });
                fetchData();
            });
        }

        const interval = setInterval(fetchData, 20000); // 20s polling fallback
        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, [fetchData, user, accessToken]);

    const handleAcceptOrder = async (orderId) => {
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${orderId}/accept-delivery`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Order accepted for delivery!');
                fetchData();
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
                toast.success(type === 'PICKUP' ? 'Pickup verified! Order is Out for Delivery.' : 'Delivery completed successfully!');
                setOtpModal({ isOpen: false, type: 'PICKUP', orderId: null, otpValue: '' });
                fetchData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Invalid OTP code. Please try again.');
            }
        } catch (err) {
            toast.error('Network error verifying OTP');
        }
    };

    const toggleStatus = () => {
        const newStatus = status === 'Offline' ? 'Available' : 'Offline';
        setStatus(newStatus);
        toast.success(`Delivery status: ${newStatus}`);
    };

    const statCards = [
        { label: 'Active Deliveries', value: deliveryStats.activeDeliveries, icon: Truck, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Delivered Today', value: deliveryStats.deliveredToday, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Pending Pickups', value: deliveryStats.pendingPickups, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Earnings', value: `₹${deliveryStats.totalEarnings}`, icon: CreditCard, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header with Live Status Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Delivery Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Welcome, <strong className="text-gray-800">{user?.name || 'Partner'}</strong>. Live fulfillment summary.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Duty Status:</span>
                    <button 
                        onClick={toggleStatus}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            status === 'Available' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${status === 'Available' ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></span>
                        {status}
                    </button>
                </div>
            </div>

            {/* Dynamic Real Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => {
                    const IconComp = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                                    <IconComp className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded">
                                    MongoDB
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Delivery Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-900">Current Active Delivery</h2>
                    </div>
                    <button 
                        onClick={fetchData}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Refresh data"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {activeOrder ? (
                    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Assigned Order</span>
                                <h3 className="text-xl font-black font-mono">{activeOrder.id}</h3>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                activeOrder.status === 'OUT_FOR_DELIVERY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                                {activeOrder.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                                <p className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5 mb-1.5">
                                    <MapPin className="w-3.5 h-3.5" /> Pickup Location
                                </p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {activeOrder.pickupLocation?.address || activeOrder.pickupAddress || 'Farm / Warehouse Location'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Source: {activeOrder.sourceType === 'SHOP' ? 'Shop Seller' : 'Local Farmer'}</p>
                            </div>

                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                                <p className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 mb-1.5">
                                    <Navigation className="w-3.5 h-3.5" /> Customer Drop Address
                                </p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {activeOrder.deliveryLocation?.address || activeOrder.deliveryAddress || 'Customer Address'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Amount: {activeOrder.totalAmount || activeOrder.total || '₹0'} ({activeOrder.paymentMethod || 'COD'})</p>
                            </div>
                        </div>

                        {/* Lifecycle Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            {activeOrder.status === 'DELIVERY_ASSIGNED' && (
                                <button
                                    onClick={() => handleOpenOtpModal(activeOrder.id, 'PICKUP')}
                                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md inline-flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Verify Seller Pickup OTP
                                </button>
                            )}

                            {activeOrder.status === 'OUT_FOR_DELIVERY' && (
                                <button
                                    onClick={() => handleOpenOtpModal(activeOrder.id, 'DELIVERY')}
                                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md inline-flex items-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Verify Customer Delivery OTP
                                </button>
                            )}

                            <button
                                onClick={() => navigate(`/delivery/tracking?orderId=${activeOrder.id}`)}
                                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold rounded-xl text-sm transition-all inline-flex items-center gap-2"
                            >
                                <Navigation className="w-4 h-4" /> Live Map Navigation
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 mx-auto flex items-center justify-center text-gray-400">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-800">No Active Delivery In Progress</h3>
                        <p className="text-gray-500 text-xs max-w-sm mx-auto">
                            You currently have no active deliveries in transit. Check the Assigned Orders tab to claim ready packages.
                        </p>
                        <button
                            onClick={() => navigate('/delivery/orders')}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            View Available Orders <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Current Location Setup */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-gray-900">Delivery Partner Location Broadcast</h2>
                </div>
                <LocationPicker onLocationChange={(loc) => setLocation(loc)} defaultLocation={location} />
            </div>

            {/* OTP Verification Modal */}
            {otpModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-150">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                            {otpModal.type === 'PICKUP' ? 'Verify Pickup OTP' : 'Verify Delivery OTP'}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            {otpModal.type === 'PICKUP' 
                                ? 'Ask the seller/farmer for the 6-digit Pickup OTP to collect the package.' 
                                : 'Ask the customer for the 6-digit Delivery OTP upon handing over the order.'}
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
                                    Verify & Proceed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryDashboard;
