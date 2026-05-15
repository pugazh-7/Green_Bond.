import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);

    useEffect(() => {
        const fetchOrders = () => {
            const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            setOrders(savedOrders);

            // Find an active order (Shipped or Accepted, but not Delivered)
            // Prioritize 'Shipped' (Out for Delivery)
            const active = savedOrders.find(o => o.status === 'Shipped') ||
                savedOrders.find(o => o.status === 'Accepted');
            setActiveOrder(active);
        };

        fetchOrders();
        // Poll for updates every 5 seconds to simulate real-time sync
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    // Derived Stats
    const assignedOrdersCount = orders.filter(o => ['Accepted', 'Shipped'].includes(o.status)).length;
    const deliveredTodayCount = orders.filter(o => {
        const isToday = new Date(o.date).toDateString() === new Date().toDateString();
        return o.status === 'Delivered' && isToday;
    }).length;
    const pendingDeliveryCount = orders.filter(o => ['Accepted', 'Shipped'].includes(o.status)).length;

    // Calculate Earnings (Mock logic: 10% of order value)
    const earnings = orders
        .filter(o => o.status === 'Delivered')
        .reduce((sum, o) => sum + (o.totalAmount * 0.1), 0);

    const stats = [
        { label: 'Assigned Orders', value: assignedOrdersCount, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Delivered Today', value: deliveredTodayCount, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending Delivery', value: pendingDeliveryCount, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Earnings', value: `₹${Math.round(earnings)}`, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    const handleNavigate = (order) => {
        navigate('/delivery/tracking', { state: { orderId: order.id } });
    };

    const handleAcceptOrder = (orderId) => {
        const updatedOrders = orders.map(o => {
            if (o.id === orderId) return { ...o, status: 'Accepted' };
            return o;
        });
        localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
        toast.success("Order Accepted! Proceed to Pickup.");
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-gray-500">Welcome back, Partner! Here is your live summary.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-transform hover:scale-105">
                        <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
                            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                        </div>
                        <h3 className="text-gray-500 font-medium">{stat.label}</h3>
                    </div>
                ))}
            </div>

            {/* Active Delivery Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Current Active Delivery</h2>

                {activeOrder ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-blue-900 text-lg">{activeOrder.id}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${activeOrder.status === 'Shipped' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                                        }`}>
                                        {activeOrder.status === 'Shipped' ? 'Out for Delivery' : 'Ready for Pickup'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-blue-800 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <strong>Pickup:</strong> {activeOrder.pickupAddress || 'Central Warehouse'}
                                    </p>
                                    <p className="text-blue-800 text-sm flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                        <strong>Drop:</strong> {activeOrder.deliveryAddress || 'Customer Location'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleNavigate(activeOrder)}
                                className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7"></path></svg>
                                Track / Update
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-gray-900 font-bold mb-2">No Active Deliveries</h3>
                        <p className="text-gray-500 text-sm mb-6">You are currently free. Check the Orders tab for new assignments.</p>
                        <button
                            onClick={() => navigate('/delivery/orders')}
                            className="text-blue-600 font-bold hover:text-blue-800"
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
