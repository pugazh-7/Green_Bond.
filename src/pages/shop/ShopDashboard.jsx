import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const ShopDashboard = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/shop/metrics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Error fetching metrics', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const handleToggleStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = !metrics.profile.isActive;
            const res = await fetch('/api/shop/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ isActive: newStatus })
            });
            if (res.ok) {
                setMetrics(prev => ({
                    ...prev,
                    profile: { ...prev.profile, isActive: newStatus }
                }));
                toast.success(newStatus ? 'Shop is now Open' : 'Shop is now Closed');
            }
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
                    <p className="text-gray-500">Here's your shop overview for today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700">Status:</span>
                    <button 
                        onClick={handleToggleStatus}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${metrics?.profile?.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${metrics?.profile?.isActive ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm font-bold ${metrics?.profile?.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {metrics?.profile?.isActive ? 'OPEN' : 'CLOSED'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 font-medium mb-1">Total Orders</p>
                        <h2 className="text-3xl font-bold text-gray-900">{metrics?.totalOrders || 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 font-medium mb-1">Total Earnings</p>
                        <h2 className="text-3xl font-bold text-green-700">₹{metrics?.earnings?.toLocaleString() || 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 font-medium mb-1">Active Products</p>
                        <h2 className="text-3xl font-bold text-yellow-600">{metrics?.productCount || 0}</h2>
                    </div>
                    <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-4">
                        <Link to="/shop/products" className="block w-full text-center py-3 bg-yellow-50 text-yellow-700 font-bold rounded-xl hover:bg-yellow-100 transition-colors">
                            Manage Inventory
                        </Link>
                        <Link to="/shop/orders" className="block w-full text-center py-3 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                            View Recent Orders
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopDashboard;
