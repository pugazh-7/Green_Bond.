import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ClientBulkInquiries = () => {
    const [inquiries, setInquiries] = useState([]);

    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders/farmer-inquiries`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('green_bond_token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInquiries(data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchInquiries();
    }, []);

    const handleAccept = async (orderId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('green_bond_token')}`
                },
                body: JSON.stringify({ status: 'Order Confirmed' })
            });
            if (res.ok) {
                setInquiries(prev => prev.map(order => order.orderId === orderId ? { ...order, status: 'Order Confirmed' } : order));
                toast.success("Order Accepted! Customer will be notified.");
            }
        } catch (err) {
            toast.error("Failed to accept order");
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this order? This cannot be undone.")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('green_bond_token')}`
                },
                body: JSON.stringify({ status: 'Order Rejected' })
            });
            if (res.ok) {
                setInquiries(prev => prev.map(order => order.orderId === orderId ? { ...order, status: 'Order Rejected' } : order));
                toast.error("Order Rejected.");
            }
        } catch (err) {
            toast.error("Failed to reject order");
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Order Requests</h1>
                <p className="text-gray-500 mt-1">Inquiries received from investors/buyers.</p>
            </header>

            {inquiries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Inquiries Yet</h2>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Requests from buyers participating in bulk orders will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {inquiries.map((inquiry, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center gap-6">
                            <img src={inquiry.image} alt={inquiry.title} className="w-24 h-24 rounded-xl object-cover shadow-sm" />
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${inquiry.status === 'Order Confirmed' ? 'bg-green-100 text-green-700' :
                                        inquiry.status === 'Order Rejected' ? 'bg-red-100 text-red-700' :
                                            inquiry.status === 'Cancelled' ? 'bg-gray-100 text-gray-500' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {inquiry.status || 'Received Interest'}
                                    </span>
                                    <span className="text-xs text-gray-400">{new Date(inquiry.date).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{inquiry.title}</h3>
                                <p className="text-green-700 font-bold text-sm bg-green-50 inline-block px-2 py-0.5 rounded mt-1">
                                    Quantity Requested: {inquiry.requestedQuantity} {inquiry.price?.split('/')?.[1] || 'Kg'}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <p className="text-gray-600 text-sm flex items-center justify-center md:justify-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        Customer: <span className={`font-semibold ${inquiry.status === 'Order Confirmed' ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {inquiry.status === 'Order Confirmed' ? (inquiry.customer?.name || 'Verified Buyer') : '🔒 Private (Accept Order to View)'}
                                        </span>
                                    </p>
                                    <p className="text-gray-600 text-sm flex items-center justify-center md:justify-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                        Contact: <span className={`font-semibold ${inquiry.status === 'Order Confirmed' ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {inquiry.status === 'Order Confirmed' ? (inquiry.customer?.contact || inquiry.customer?.email || '+91 98765 43210') : '🔒 Private (Accept Order to View)'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                {inquiry.status !== 'Order Confirmed' && inquiry.status !== 'Order Rejected' && inquiry.status !== 'Cancelled' ? (
                                    <>
                                        <button
                                            onClick={() => handleAccept(inquiry.orderId)}
                                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            Accept Order
                                        </button>
                                        <button
                                            onClick={() => handleReject(inquiry.orderId)}
                                            className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button disabled className={`px-6 py-2 font-bold rounded-lg cursor-not-allowed ${inquiry.status === 'Order Confirmed' ? 'bg-gray-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                                        {inquiry.status}
                                    </button>
                                )}
                                <button className="px-6 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors">
                                    Contact
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientBulkInquiries;
