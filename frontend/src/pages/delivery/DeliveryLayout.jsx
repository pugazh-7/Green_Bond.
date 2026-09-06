import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Navigation,
    Clock,
    LogOut,
    Truck,
    Menu,
    XCircle,
    UserCheck
} from '../../components/ui/Icons';

const DeliveryLayout = () => {
    const { logout, user, isLoggingOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [assignedCount, setAssignedCount] = useState(0);

    const navItems = [
        { path: '/delivery', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/delivery/orders', icon: ShoppingBag, label: 'Assigned Orders', badge: assignedCount > 0 ? assignedCount : null },
        { path: '/delivery/tracking', icon: Navigation, label: 'Live Navigation' },
        { path: '/delivery/history', icon: Clock, label: 'Delivery History' },
    ];

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login/delivery');
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
            <Toaster position="top-right" />
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-emerald-500/30">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-base tracking-tight text-white">GreenBond</h1>
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Delivery Partner</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const IconComp = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm ${
                                    isActive
                                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <IconComp className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-slate-950">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Footer */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Signing Out...' : 'Sign Out'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content View */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header Bar */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between md:hidden shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">Delivery Partner</h2>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DeliveryLayout;
