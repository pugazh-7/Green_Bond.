import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const BulkOrders = () => {
    const [inquiries, setInquiries] = useState([]);

    useEffect(() => {
        const savedInquiries = JSON.parse(localStorage.getItem('green_bond_bulk_orders') || '[]');
        setInquiries(savedInquiries);
    }, []);

    const handleCancel = (orderId) => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <p className="font-semibold text-gray-900">Cancel this inquiry?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        No, keep it
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmCancel(orderId);
                        }}
                        className="px-3 py-1.5 text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        Yes, cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                borderRadius: '16px',
                padding: '16px',
                background: '#fff',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #f3f4f6'
            },
        });
    };

    const confirmCancel = (orderId) => {
        const updatedInquiries = inquiries.map(order => {
            if (order.orderId === orderId) {
                return { ...order, status: 'Cancelled' };
            }
            return order;
        });
        setInquiries(updatedInquiries);
        localStorage.setItem('green_bond_bulk_orders', JSON.stringify(updatedInquiries));
        toast.success("Order cancelled.");
    };



    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Order Inquiries</h1>
                <p className="text-gray-500 mt-1">Track your interest in bulk farm produce.</p>
            </header>

            {inquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Bulk Inquiries Yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        Interested in buying directly from farmers in bulk? Select "Bulk Order" on any produce in the marketplace.
                    </p>
                    <Link to="/user/marketplace" className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                        Browse Marketplace
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6">
                            <img src={inquiry.image} alt={inquiry.title} className="w-24 h-24 rounded-xl object-cover shadow-sm" />
                            <div className="flex-1 text-center md:text-left">
                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full mb-2 ${inquiry.status === 'Order Confirmed' ? 'bg-green-100 text-green-700' :
                                    inquiry.status === 'Order Rejected' ? 'bg-red-100 text-red-700' :
                                        inquiry.status === 'Cancelled' ? 'bg-gray-100 text-gray-500' :
                                            'bg-blue-50 text-blue-700'
                                    }`}>
                                    {inquiry.status}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900">{inquiry.title}</h3>
                                <p className="text-gray-900 font-bold mb-1">Requested: {inquiry.requestedQuantity} {inquiry.price?.split('/')?.[1] || 'Kg'}</p>
                                <p className="text-gray-500 text-sm mb-1">Farmer: <span className="font-medium text-gray-800">{inquiry.farmer}</span></p>
                                <p className="text-gray-500 text-sm">Location: {inquiry.location}</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                {inquiry.status === 'Order Confirmed' ? (
                                    <a href={`tel:${inquiry.contact || '+919999999999'}`} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm text-center">
                                        Call Farmer
                                    </a>
                                ) : (
                                    <button disabled className="px-6 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed text-center">
                                        Wait for Approval
                                    </button>
                                )}
                                {(inquiry.status === 'Inquiry Sent' || inquiry.status === 'Order Confirmed') && (
                                    <button
                                        onClick={() => handleCancel(inquiry.orderId)}
                                        className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm"
                                    >
                                        Cancel order
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 text-center">Inquired on {new Date(inquiry.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BulkOrders;
