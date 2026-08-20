import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ShopOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/orders/shop-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toast.success('Order status updated!');
                fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update order');
            }
        } catch (err) {
            toast.error('Network error while updating status');
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Shop Orders</h1>
                <p className="text-gray-500 mt-1">Manage and pack incoming orders for delivery.</p>
            </header>

            {orders.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 font-medium">No orders yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900">Order {order.id}</h3>
                                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm">
                                    {order.status}
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Items to pack:</p>
                                <ul className="space-y-2">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-sm">
                                            <span>{item.title} (x{item.quantity})</span>
                                            <span className="font-medium">₹{item.price * item.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500">Order Total</p>
                                    <p className="font-bold text-gray-900">₹{order.totalAmount || order.total}</p>
                                </div>
                                <div className="flex gap-2">
                                    {order.status === 'PLACED' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'SHOP_ACCEPTED')}
                                            className="px-4 py-2 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {order.status === 'SHOP_ACCEPTED' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                                            className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700"
                                        >
                                            Mark Ready for Pickup
                                        </button>
                                    )}
                                    {order.status === 'READY_FOR_PICKUP' && order.pickupOtp && (
                                        <div className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200">
                                            Pickup OTP: {order.pickupOtp}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopOrders;
