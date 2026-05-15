import React, { useState, useEffect } from 'react';

const DeliveryHistory = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const allOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        const deliveredOrders = allOrders.filter(o => o.status === 'Delivered');
        setHistory(deliveredOrders);
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Delivery History</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Order ID</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Customer</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Date</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Amount</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No delivered orders yet.</td>
                            </tr>
                        ) : (
                            history.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900 font-medium">{order.id}</td>
                                    <td className="px-6 py-4 text-gray-700">{order.customer}</td>
                                    <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                    <td className="px-6 py-4 text-gray-900">{order.total}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                            Success
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeliveryHistory;
