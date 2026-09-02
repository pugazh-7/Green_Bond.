import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const UserTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState('PROCESSING');
    
    useEffect(() => {
        // Fetch order details
        const fetchOrder = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                    setStatus(data.status || 'PROCESSING');
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchOrder();

        // Setup Socket.IO for live updates
        const socket = io(import.meta.env.VITE_API_URL || 'https://green-bond.onrender.com');
        socket.on('order_update', (data) => {
            if (data.orderId === id) {
                setStatus(data.status);
            }
        });

        return () => socket.disconnect();
    }, [id]);

    const steps = [
        { key: 'PROCESSING', label: 'Order Confirmed', icon: '📝' },
        { key: 'PACKED', label: 'Packed & Ready', icon: '📦' },
        { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
        { key: 'DELIVERED', label: 'Delivered', icon: '✅' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === status);
    
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
            <div className="bg-white px-4 pt-safe-top pb-3 border-b border-gray-100 flex items-center shadow-sm sticky top-0 z-40">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 active:bg-gray-100 rounded-full mr-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-bold font-display text-gray-900">Track Order</h1>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Order #{String(id).slice(-6)}</p>
                    <h2 className="font-bold text-2xl text-gray-900 mb-6 font-display">
                        {status === 'DELIVERED' ? 'Arrived!' : 'Arriving in 12 mins'}
                    </h2>

                    <div className="relative pt-2 pb-6">
                        {/* Progress Bar Background */}
                        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-100 rounded-full z-0"></div>
                        {/* Active Progress */}
                        <div className="absolute top-6 left-6 h-1 bg-greenbond-500 rounded-full z-0 transition-all duration-1000" style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}></div>
                        
                        {/* Steps */}
                        <div className="flex justify-between relative z-10 px-2">
                            {steps.map((step, idx) => {
                                const isActive = idx <= currentStepIndex;
                                return (
                                    <div key={step.key} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm transition-colors duration-300 ${isActive ? 'bg-greenbond-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                                            {step.icon}
                                        </div>
                                        <p className={`text-[10px] font-bold mt-2 text-center w-16 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTracking;
