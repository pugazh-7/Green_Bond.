import React, { useState, useEffect } from 'react';

const Portfolio = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // Load data from LocalStorage
        const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        setOrders(savedOrders);
    }, []);

    // Calculate Stats
    const safeOrders = Array.isArray(orders) ? orders : [];
    const totalSpent = safeOrders.reduce((acc, order) => {
        if (!order || !order.total) return acc;
        const amount = parseFloat(String(order.total).replace(/[^\d.]/g, ''));
        return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header Stats */}
            <div className="bg-green-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-green-800/50 backdrop-blur-sm p-6 rounded-2xl border border-green-600/30">
                            <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-2">Total Orders</p>
                            <p className="text-3xl font-bold">{safeOrders.length}</p>
                        </div>
                        <div className="bg-green-800/50 backdrop-blur-sm p-6 rounded-2xl border border-green-600/30">
                            <p className="text-green-200 text-sm font-medium uppercase tracking-wider mb-2">Agri-Produce Bought</p>
                            <p className="text-3xl font-bold">₹{totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    className="pb-4 px-4 font-semibold text-lg transition-colors relative text-green-700"
                >
                    Order History
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-green-700 rounded-t-full"></div>
                </button>
            </div>

            {/* Content Area */}
            <div className="space-y-6">
                {safeOrders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No orders placed yet.</p>
                        <a href="/user/marketplace" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            Browse Marketplace
                        </a>
                    </div>
                ) : (
                    safeOrders.map((order) => (
                        <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                                            'bg-blue-50 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4">{order.date} • {order.items.length} Items</p>
                                <div className="flex -space-x-3">
                                    {order.items.slice(0, 5).map((item, i) => (
                                        <img key={i} src={item.image} alt={item.title} className="w-10 h-10 rounded-full border-2 border-white object-cover" title={item.title} />
                                    ))}
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-center">
                                <p className="text-gray-500 text-sm mb-1">Total Amount</p>
                                <p className="text-2xl font-bold text-gray-900">{order.total}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Portfolio;
