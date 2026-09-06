import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    LogOut,
    Store,
    Shield
} from '../../components/ui/Icons';

const ShopLayout = () => {
    const { logout, user, isLoggingOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login/shop');
    };

    const navItems = [
        { path: '/shop', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/shop/products', icon: Package, label: 'Inventory' },
        { path: '/shop/orders', icon: ShoppingBag, label: 'Orders' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar Desktop */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-sm z-10">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <Link to="/shop" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">GreenBond</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Merchant Portal</span>
                        </div>
                    </Link>
                </div>
                
                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                                    isActive 
                                    ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100/80 font-bold' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Shop Owner'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user?.mobile || user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-100 disabled:opacity-50"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-colors ${
                                isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-slate-50/50">
                {/* Mobile Top Header */}
                <div className="md:hidden bg-white px-4 py-3 shadow-sm border-b border-slate-200 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            <Store className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">GreenBond Merchant</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ShopLayout;
