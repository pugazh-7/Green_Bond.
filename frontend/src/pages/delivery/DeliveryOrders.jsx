import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DeliveryOrders = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/orders/delivery-orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
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

    const handleUpdateStatus = async (orderId, newStatus) => {
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
                toast.success(`Order status updated!`);
                fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update order');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleVerifyPickup = async (orderId) => {
        const otp = prompt('Enter Pickup OTP provided by the Seller:');
        if (!otp) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/orders/${orderId}/verify-pickup-otp`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ otp })
            });

            if (res.ok) {
                toast.success('Pickup verified successfully!');
                fetchOrders();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Invalid OTP');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading assigned orders...</div>;

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
                                    <h3 className="text-lg font-bold text-gray-900">Order {order.id}</h3>
                                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase 
                                        ${order.status === 'READY_FOR_PICKUP' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'DELIVERY_ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                          order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">Seller: {order.sourceType === 'SHOP' ? 'Shop' : 'Farmer'}</p>
                                <p className="text-gray-700 mt-2">📍 Drop: {order.deliveryLocation?.address || "Customer Location"}</p>
                                <p className="text-gray-500 text-xs mt-1">🏪 Pickup: {order.pickupLocation?.address || "Central Warehouse"}</p>
                            </div>

                            <div className="flex gap-3">
                                {order.status === 'READY_FOR_PICKUP' && !order.deliveryBoyId && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'DELIVERY_ASSIGNED')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm"
                                    >
                                        Accept Order
                                    </button>
                                )}
                                {(order.status === 'DELIVERY_ASSIGNED' || (order.status === 'READY_FOR_PICKUP' && order.deliveryBoyId === user.id)) && (
                                    <button
                                        onClick={() => handleVerifyPickup(order.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                    >
                                        Verify Pickup OTP
                                    </button>
                                )}
                                {order.status === 'OUT_FOR_DELIVERY' && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/delivery/tracking?orderId=${order.id}`)}
                                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                                        >
                                            Navigate & Deliver
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
