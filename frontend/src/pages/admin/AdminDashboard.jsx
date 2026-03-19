import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dynamic Data States
    const [users, setUsers] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState([]);

    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || '{}');
    const userName = currentUser.name || 'Administrator';
    const userRole = currentUser.role || 'Admin';

    useEffect(() => {
        const loadRealTimeData = () => {
            const rawUsers = JSON.parse(localStorage.getItem('green_bond_users') || '[]');
            const rawFarmers = JSON.parse(localStorage.getItem('green_bond_farmers') || '[]');
            const rawOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            const rawProducts = JSON.parse(localStorage.getItem('green_bond_products') || '[]');

            setUsers(rawUsers);
            setFarmers(rawFarmers);
            setOrders(rawOrders);
            setProducts(rawProducts);

            // Calculate Stats
            const totalRevenue = rawOrders.reduce((acc, curr) => {
                const amt = parseFloat(curr.totalAmount?.toString().replace(/[^0-9.]/g, '') || 0);
                return acc + amt;
            }, 0);

            const activeOrdersCount = rawOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;

            setStats([
                { label: 'Total Users', value: rawUsers.length.toString(), icon: '👥', change: '+12%', color: 'from-emerald-500 to-teal-600' },
                { label: 'Total Farmers', value: rawFarmers.length.toString(), icon: '👨‍🌾', change: '+5%', color: 'from-blue-500 to-indigo-600' },
                { label: 'Active Orders', value: activeOrdersCount.toString(), icon: '📦', change: '+18%', color: 'from-amber-500 to-orange-600' },
                { label: 'Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: '💰', change: '+22%', color: 'from-rose-500 to-pink-600' },
            ]);
        };

        loadRealTimeData();
        const interval = setInterval(loadRealTimeData, 5000); // Poll every 5 seconds for "real-time" feel
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        toast.success('Logged out successfully');
        navigate('/');
    };

    const navItems = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'users', name: 'User Management', icon: '👥' },
        { id: 'farmers', name: 'Farmer Directory', icon: '🚜' },
        { id: 'orders', name: 'Order Management', icon: '🛍️' },
        { id: 'products', name: 'Product Review', icon: '🌱' },
        { id: 'settings', name: 'System Settings', icon: '⚙️' },
    ];

    const getTabTitle = () => {
        return navItems.find(item => item.id === activeTab)?.name || 'Dashboard';
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl shadow-lg ring-4 ring-white`}>
                                            {stat.icon}
                                        </div>
                                        <span className="text-emerald-500 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider">{stat.label}</h3>
                                        <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Orders Table */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Live Order Stream</h3>
                                <button onClick={() => setActiveTab('orders')} className="text-emerald-600 font-bold text-sm hover:underline">Manage All Orders →</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-left">
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders.slice(0, 5).map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                                <td className="px-8 py-5 font-bold text-slate-700">{order.id}</td>
                                                <td className="px-8 py-5 text-slate-600 font-medium">{order.userName || 'Guest User'}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                                                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="px-8 py-10 text-center text-slate-400 italic">No live orders found in the system.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
                            <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-bold">{users.length} Total</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Details</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map((u, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 text-slate-700 font-bold">{u.name}</td>
                                            <td className="px-8 py-5 text-slate-600 font-medium">{u.role || 'User'}</td>
                                            <td className="px-8 py-5 text-right text-emerald-600 font-bold uppercase text-[10px]">Active</td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-slate-400">No users registered.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'farmers':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Farmer Network</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold">{farmers.length} Registered</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Farmer</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {farmers.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 font-bold text-slate-700">{f.name}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="text-blue-600 hover:underline">Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {farmers.length === 0 && (
                                        <tr><td colSpan="2" className="p-10 text-center text-slate-400">No farmers in directory.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Total System Orders</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {orders.map((o, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{o.id}</td>
                                            <td className="px-8 py-5 text-slate-600">{o.userName}</td>
                                            <td className="px-8 py-5 text-slate-900 font-bold">{o.totalAmount}</td>
                                            <td className="px-8 py-5 text-right uppercase text-[10px] font-black">{o.status}</td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400">No orders placed yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Global Inventory</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {products.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{p.name}</td>
                                            <td className="px-8 py-5 text-emerald-600 font-bold">{p.price}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="text-rose-500 hover:scale-110 transition-transform">🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan="3" className="p-10 text-center text-slate-400">Inventory is empty.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="p-2 bg-slate-100 rounded-lg">🛡️</span>
                                Global Controller
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Real-Time Sync', desc: 'Sync data across all portals in milliseconds', enabled: true },
                                    { label: 'Maintenance Window', desc: 'Auto-publish maintenance schedules', enabled: false },
                                ].map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-bold text-slate-700">{s.label}</p>
                                            <p className="text-xs text-slate-400">{s.desc}</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${s.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${s.enabled ? 'translate-x-6' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden transition-all duration-300">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-slate-800 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/20">G</div>
                        <h1 className="text-xl font-bold tracking-tight">GreenBond <span className="text-emerald-400 font-medium text-sm block">Admin Portal</span></h1>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden absolute top-8 right-6 text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                                activeTab === item.id 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 translate-x-1' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium group"
                    >
                        <span className="text-xl group-hover:rotate-12 transition-transform">🚪</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative flex flex-col custom-scrollbar">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-6 lg:px-10 py-6 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">{getTabTitle()}</h2>
                            <p className="text-slate-500 text-xs lg:text-sm hidden sm:block font-medium">Signed in as <span className="text-emerald-600 font-bold">{userName}</span> ({userRole})</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Metrics</span>
                        </div>
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-100 rounded-xl lg:rounded-2xl flex items-center justify-center border-2 border-emerald-500/20 shadow-inner overflow-hidden ring-4 ring-white">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt={userName} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full flex-1">
                    {renderContent()}
                </div>
                
                {/* Footer */}
                <footer className="p-6 lg:p-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[10px] lg:text-xs gap-4 uppercase tracking-widest font-bold">
                    <p>© 2026 GreenBond Administrative Ecosystem</p>
                    <div className="flex items-center gap-6">
                        <button className="hover:text-emerald-500 transition-colors underline decoration-dotted underline-offset-4">Security Protocol</button>
                        <button className="hover:text-emerald-500 transition-colors underline decoration-dotted underline-offset-4">Legal Notice</button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AdminDashboard;
