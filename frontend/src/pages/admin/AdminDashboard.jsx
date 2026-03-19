import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        toast.success('Logged out successfully');
        navigate('/');
    };

    const stats = [
        { label: 'Total Users', value: '1,245', icon: '👥', change: '+12%', color: 'from-emerald-500 to-teal-600' },
        { label: 'Total Farmers', value: '850', icon: '👨‍🌾', change: '+5%', color: 'from-blue-500 to-indigo-600' },
        { label: 'Active Orders', value: '342', icon: '📦', change: '+18%', color: 'from-amber-500 to-orange-600' },
        { label: 'Revenue', value: '₹4.2L', icon: '💰', change: '+22%', color: 'from-rose-500 to-pink-600' },
    ];

    const recentActivity = [
        { id: 1, user: 'Rahul Sharma', action: 'New Farmer Registration', time: '2 mins ago', status: 'Pending' },
        { id: 2, user: 'Priya Patel', action: 'Order #8421 placed', time: '15 mins ago', status: 'Completed' },
        { id: 3, user: 'Amit Singh', action: 'Support Ticket #21', time: '1 hour ago', status: 'In Progress' },
        { id: 4, user: 'Suresh Kumar', action: 'Product Update: Organic Rice', time: '3 hours ago', status: 'Completed' },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
                <div className="p-8 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/20">G</div>
                        <h1 className="text-xl font-bold tracking-tight">GreenBond <span className="text-emerald-400 font-medium text-sm block">Admin Portal</span></h1>
                    </div>
                </div>
                
                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {[
                        { id: 'overview', name: 'Overview', icon: '📊' },
                        { id: 'users', name: 'User Management', icon: '👥' },
                        { id: 'farmers', name: 'Farmer Directory', icon: '🚜' },
                        { id: 'orders', name: 'Order Management', icon: '🛍️' },
                        { id: 'products', name: 'Product Review', icon: '🌱' },
                        { id: 'settings', name: 'System Settings', icon: '⚙️' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
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
                        className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium"
                    >
                        <span className="text-xl">🚪</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-10 py-6 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
                        <p className="text-slate-500 text-sm">Welcome back, Administrator. Here's what's happening today.</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl">
                            <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">🔔</span>
                            <span className="text-sm font-bold text-slate-700">3 Notifications</span>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border-2 border-emerald-500/20 shadow-inner overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-10 space-y-10 max-w-7xl mx-auto">
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

                    {/* Table Section */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Recent System Activity</h3>
                            <button className="text-emerald-600 font-bold text-sm hover:underline">View All Activity →</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-left">
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User / Entity</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action Performed</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentActivity.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                        {item.user.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{item.user}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600 font-medium">{item.action}</td>
                                            <td className="px-8 py-5 text-slate-400 text-sm">{item.time}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                    item.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                        item.status === 'Completed' ? 'bg-emerald-500' : 
                                                        item.status === 'Pending' ? 'bg-amber-500' : 
                                                        'bg-blue-500'
                                                    }`}></span>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-6 bg-slate-50/50 text-center">
                            <p className="text-slate-500 text-sm italic">Showing up to 10 latest events from the last 24 hours.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
