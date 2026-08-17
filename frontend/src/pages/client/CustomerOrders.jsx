import React, { useState } from 'react';
import toast from 'react-hot-toast';

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);

    React.useEffect(() => {
        const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        if (savedOrders.length === 0) {
            // Optional: fallback mock data if needed, or just leave empty
            // setOrders([...MOCK_DATA]); 
        } else {
            setOrders(savedOrders);
        }
    }, []);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const handleAcceptOrder = (orderId) => {
        const updatedOrders = orders.map(order =>
            order.id === orderId ? { ...order, status: 'Accepted' } : order
        );
        setOrders(updatedOrders);
        localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));
        toast.success("Order accepted successfully!");
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Placed': return 'bg-purple-100 text-purple-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Accepted': return 'bg-teal-100 text-teal-800';
            case 'Shipped': return 'bg-blue-100 text-blue-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Orders</h1>
                    <p className="text-gray-500 mt-1">Manage and track your incoming orders.</p>
                </div>
                <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
                    <span className="text-gray-500 text-sm">Total Revenue:</span>
                    <span className="ml-2 font-bold text-green-600 text-lg">₹{totalRevenue.toLocaleString()}</span>
                </div>
            </header>

            {/* Orders List */}
            <div className="space-y-6">
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No orders received yet.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-900">{order.customer}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Order ID: {order.id} • {order.date} {order.time}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">{order.total}</p>
                                        <p className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${order.paymentStatus === 'Paid'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-red-50 text-red-600 border border-red-100'
                                            }`}>
                                            {order.paymentStatus === 'Paid' ? '✅ Payment Received' : '❌ Payment Not Received'}
                                        </p>
                                        {/* Toast for success on load is weird, but we can assume the user means when they view it. 
                                            Actually, standard toast is better on actions. 
                                            We'll leave the toast for actions and just show status here. */}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Order Details & Products</h4>
                                    <div className="space-y-3">
                                        {order.items && order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    {item.image && <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-md shadow-sm" />}
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{item.title}</span>
                                                        <span className="text-xs text-gray-500">{item.category || 'Produce'} • {item.farmer}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500 text-xs font-medium">Qty: {item.quantity}</span>
                                                    <p className="font-bold text-green-700 mt-0.5">{item.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div>
                                            <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                Delivery Address
                                            </p>
                                            <p className="text-gray-900 font-medium leading-snug">{order.deliveryAddress || 'Address not provided'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 uppercase tracking-wider text-[10px] font-bold mb-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                                Payment Method
                                            </p>
                                            <p className="text-gray-900 font-medium">{order.paymentMethod || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                        View Details
                                    </button>
                                    {(order.status === 'Placed' || order.status === 'Pending') && (
                                        <button
                                            onClick={() => handleAcceptOrder(order.id)}
                                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {order.status === 'Shipped' && (
                                        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                                            Update Status
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
