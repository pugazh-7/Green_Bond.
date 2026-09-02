import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import { io } from 'socket.io-client';

const DeliveryDashboard = () => {
    const { accessToken } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);
    const [status, setStatus] = useState('Available');
    const [location, setLocation] = useState(null);

    const fetchOrders = async () => {
        try {
            const token = accessToken;
            if (!token) return;

            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/delivery-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data);
                
                // Active order: Assigned to me, and not yet delivered
                // Actually, backend returns orders assigned to me or READY_FOR_PICKUP
                const active = data.find(o => 
                    ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
                );
                setActiveOrder(active);
            }
        } catch (error) {
            console.error('Error fetching delivery orders:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        
        const token = accessToken;
        let deliveryId = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                deliveryId = payload.id;
            } catch (e) {}
        }

        const socket = io(import.meta.env.VITE_API_URL || 'https://green-bond.onrender.com');
        if (deliveryId) {
            socket.emit('join', deliveryId);
            socket.on('order_update', () => {
                fetchOrders();
            });
        }
        
        const interval = setInterval(fetchOrders, 60000); // 60s fallback sync
        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    // Derived Stats
    const assignedOrdersCount = orders.filter(o => ['DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
    const deliveredTodayCount = orders.filter(o => {
        const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString(); // Simplified
        return o.status === 'DELIVERED' && isToday;
    }).length;
    const pendingDeliveryCount = assignedOrdersCount;

    // Calculate Earnings (Mock logic: 10% of order value)
    const earnings = orders
        .filter(o => o.status === 'DELIVERED')
        .reduce((sum, o) => sum + ((parseFloat((o.total||"0").replace(/[^0-9.]/g, '')) || 0) * 0.1), 0);

    const stats = [
        { label: 'Active Delivery', value: assignedOrdersCount, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Delivered Today', value: deliveredTodayCount, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending Pickups', value: pendingDeliveryCount, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Earnings', value: `₹${Math.round(earnings)}`, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    const handleNavigate = (order) => {
        navigate(`/delivery/tracking?orderId=${order.id}`);
    };

    const toggleStatus = () => {
        const newStatus = status === 'Offline' ? 'Available' : 'Offline';
        setStatus(newStatus);
        toast.success(`You are now ${newStatus}`);
    };

    const handleLocationChange = (loc) => {
        setLocation(loc);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 font-heading tracking-tight">Delivery Dashboard</h1>
                    <p className="text-gray-500 font-medium">Welcome back, Partner! Here is your live summary.</p>
                </div>
                <div className="flex items-center gap-4 premium-card p-3 rounded-2xl">
                    <span className={`font-bold ${status === 'Available' ? 'text-green-700' : 'text-gray-400'}`}>
                        {status}
                    </span>
                    <button 
                        onClick={toggleStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${status === 'Available' ? 'bg-green-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status === 'Available' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className="premium-card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Your Location</h2>
                <LocationPicker onLocationChange={handleLocationChange} defaultLocation={location} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="premium-card p-6 transition-transform hover:scale-105">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                            <span className={`text-2xl font-black ${stat.color} font-heading`}>{stat.value}</span>
                        </div>
                        <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm">{stat.label}</h3>
                    </div>
                ))}
            </div>

            {/* Active Delivery Section */}
            <div className="premium-card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Current Active Delivery</h2>

                {activeOrder ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="font-black text-white text-xl font-mono">{activeOrder.id}</h3>
                                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider ${activeOrder.status === 'OUT_FOR_DELIVERY' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                        {activeOrder.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-gray-300 text-sm flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-800 rounded-lg text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </div>
                                        <span className="font-bold text-gray-400 w-16 uppercase tracking-wider text-xs">Pickup</span>
                                        <span className="font-medium">{activeOrder.pickupAddress || 'Central Warehouse'}</span>
                                    </p>
                                    <p className="text-gray-300 text-sm flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-800 rounded-lg text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                        </div>
                                        <span className="font-bold text-gray-400 w-16 uppercase tracking-wider text-xs">Drop</span>
                                        <span className="font-medium">{activeOrder.deliveryAddress || 'Customer Location'}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleNavigate(activeOrder)}
                                className="w-full md:w-auto bg-green-500 text-gray-900 px-6 py-4 rounded-xl hover:bg-green-400 font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide uppercase text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7"></path></svg>
                                Track & Update
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mx-auto flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-gray-900 font-bold mb-2 font-heading text-lg">No Active Deliveries</h3>
                        <p className="text-gray-500 text-sm mb-6 font-medium">You are currently free. Check the Orders tab for new assignments.</p>
                        <button
                            onClick={() => navigate('/delivery/orders')}
                            className="text-green-700 font-bold hover:text-green-800 bg-green-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            View Available Orders &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryDashboard;



