import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AddressManager from '../../components/shared/AddressManager';
import NotificationManager from '../../components/NotificationManager';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('addresses');

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="pb-24 pt-6 px-4 max-w-4xl mx-auto space-y-6">
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-60 -mr-10 -mt-10"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 z-10">
                    <span className="text-2xl text-white font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="z-10 flex-1">
                    <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
                    <p className="text-gray-500 text-sm font-medium">{user?.mobile}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{user?.email}</p>
                </div>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 gap-1 overflow-x-auto hide-scrollbar">
                <button 
                    onClick={() => navigate('/user/orders')}
                    className="flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    📦 Orders
                </button>
                <button 
                    onClick={() => setActiveTab('addresses')}
                    className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'addresses' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    📍 Addresses
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 min-w-[100px] py-2.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in">
                {activeTab === 'addresses' && (
                    <AddressManager />
                )}

                {activeTab === 'settings' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                        <div className="p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">💳</div>
                                <div>
                                    <p className="font-semibold text-gray-900">Payment Methods</p>
                                    <p className="text-xs text-gray-500">Manage saved cards & UPI</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">Coming Soon</span>
                        </div>
                        
                        <NotificationManager className="border-0 shadow-none !p-4" />
                        
                        <div className="p-4 flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">🛡️</div>
                                <div>
                                    <p className="font-semibold text-gray-900">Privacy & Security</p>
                                    <p className="text-xs text-gray-500">Password & 2FA</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-500">Coming Soon</span>
                        </div>

                        <button 
                            onClick={handleLogout}
                            className="w-full p-4 flex items-center justify-between hover:bg-red-50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </div>
                                <p className="font-semibold text-red-600">Log Out</p>
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
