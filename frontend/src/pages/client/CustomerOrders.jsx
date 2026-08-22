import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ProductImage from '../../components/shared/ProductImage';

const CustomerOrders = () => {
    const { accessToken } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const token = accessToken;
            if (!token) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/farmer-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Error fetching farmer orders:', error);
            toast.error('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const token = accessToken;
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success(`Order marked as ${newStatus.replace(/_/g, ' ')}!`);
                fetchOrders(); // Refresh to get the OTP if generated
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Server error while updating status.');
        }
    };

    const getStatusColor = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'PLACED': return 'bg-purple-100 text-purple-800 border border-purple-200';
            case 'FARMER_ACCEPTED': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
            case 'READY_FOR_PICKUP': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'DELIVERY_ASSIGNED': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'PICKED_UP': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'OUT_FOR_DELIVERY': return 'bg-teal-100 text-teal-800 border border-teal-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 border border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 font-bold">Loading Orders...</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Orders</h1>
                    <p className="text-gray-500 mt-1">Manage, pack, and hand off your orders securely.</p>
                </div>
                <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-gray-500 text-sm">Total Revenue:</span>
                    <span className="ml-2 font-bold text-green-600 text-lg">₹{totalRevenue.toLocaleString()}</span>
                </div>
            </header>

            <div className="space-y-6">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-bold">No orders received yet.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-900">{order.customerName}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 font-mono">ID: {order.id} • {new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">{order.total}</p>
                                        <p className="text-xs font-bold px-3 py-1 rounded-full inline-block bg-gray-100 text-gray-700 mt-1 border border-gray-200">
                                            {order.paymentMethod}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Produce Packed</h4>
                                    <div className="space-y-3">
                                        {order.items && order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    {item.image && <ProductImage product={item} className="w-12 h-12 object-cover rounded-md shadow-sm" />}
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{item.title}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500 text-xs font-medium">Qty: {item.quantity}</span>
                                                    <p className="font-bold text-green-700 mt-0.5">{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security OTP Block */}
                                {(order.status === 'READY_FOR_PICKUP' || order.status === 'DELIVERY_ASSIGNED') && (
                                    <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-xl flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                Secure Pickup PIN
                                            </h4>
                                            <p className="text-xs text-orange-700 mt-1">Provide this to the delivery partner when they arrive.</p>
                                        </div>
                                        <div className="bg-white border border-orange-300 px-4 py-2 rounded-lg font-mono text-2xl font-black text-orange-600 tracking-widest shadow-inner">
                                            {order.pickupOtp || '------'}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end gap-3">
                                    {order.status === 'PLACED' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'FARMER_ACCEPTED')}
                                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {order.status === 'FARMER_ACCEPTED' && (
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                                            className="px-6 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors text-sm shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Pack & Mark Ready
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;


