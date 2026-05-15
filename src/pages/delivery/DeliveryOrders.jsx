import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const DeliveryOrders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchOrders = () => {
            const allOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            // Filter orders that are relevant for delivery: Accepted, Shipped
            const relevantOrders = allOrders.filter(o => ['Accepted', 'Shipped'].includes(o.status));
            setOrders(relevantOrders);
        };

        fetchOrders();
        // Poll for new orders
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = (orderId, newStatus) => {
        const allOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        const updatedOrders = allOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        );
        localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));

        // Update local state
        setOrders(updatedOrders.filter(o => ['Accepted', 'Shipped'].includes(o.status)));
        toast.success(`Order status updated to ${newStatus}`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Available & Assigned Orders</h1>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">No active orders available.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{order.customer}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${order.status === 'Placed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'Accepted' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {order.status === 'Placed' ? 'New Request' :
                                            order.status === 'Accepted' ? 'Ready for Pickup' : 'In Transit'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                                <p className="text-gray-700 mt-2">📍 Drop: {order.deliveryAddress || "Customer Location"}</p>
                                <p className="text-gray-500 text-xs mt-1">🏪 Pickup: {order.pickupAddress || "Farmer Location"}</p>
                            </div>

                            <div className="flex gap-3">
                                {order.status === 'Placed' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'Accepted')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                                    >
                                        Accept Order
                                    </button>
                                )}
                                {order.status === 'Accepted' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'Shipped')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Start Pickup
                                    </button>
                                )}
                                {order.status === 'Shipped' && (
                                    <>
                                        <a
                                            href={`/delivery/tracking?orderId=${order.id}`}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                                        >
                                            Navigate
                                        </a>
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                        >
                                            Mark Delivered
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DeliveryOrders;
