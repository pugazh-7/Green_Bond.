import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login/user');
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-white px-4 pt-safe-top pb-3 border-b border-gray-100 flex items-center shadow-sm sticky top-0 z-40">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 active:bg-gray-100 rounded-full mr-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-bold font-display text-gray-900">Settings</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Account Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-2">Account</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-gray-700 text-sm">Personal Information</p>
                                <p className="text-xs text-gray-400 mt-0.5">{user?.email || 'Update your details'}</p>
                            </div>
                            <span className="text-gray-300">→</span>
                        </div>
                        <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
                            <div>
                                <p className="font-semibold text-gray-700 text-sm">Saved Addresses</p>
                                <p className="text-xs text-gray-400 mt-0.5">Manage delivery locations</p>
                            </div>
                            <span className="text-gray-300">→</span>
                        </div>
                    </div>
                </section>

                {/* Preferences Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-2">Preferences</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50">
                            <p className="font-semibold text-gray-700 text-sm">Push Notifications</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-greenbond-500"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <p className="font-semibold text-gray-700 text-sm">Location Services</p>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-greenbond-500"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Support Section */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 pl-2">Support & About</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
                            <p className="font-semibold text-gray-700 text-sm">Help Center</p>
                            <span className="text-gray-300">→</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
                            <p className="font-semibold text-gray-700 text-sm">Terms of Service</p>
                            <span className="text-gray-300">→</span>
                        </div>
                        <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
                            <p className="font-semibold text-gray-700 text-sm">Privacy Policy</p>
                            <span className="text-gray-300">→</span>
                        </div>
                    </div>
                </section>

                <button 
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-red-100 hover:bg-red-100 transition-colors mt-6 shadow-sm active:scale-95"
                >
                    Log Out
                </button>

                <div className="text-center mt-8 pb-8">
                    <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">GreenBond App</p>
                    <p className="text-[10px] text-gray-300 mt-1">Version 2.0.0 (Mobile First)</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
