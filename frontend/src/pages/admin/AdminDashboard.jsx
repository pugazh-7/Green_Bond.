import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const dummyData = {
        users: [
            { id: 101, name: 'Arjun Mehta', email: 'arjun@example.com', role: 'Investor', joined: 'Mar 12, 2026', status: 'Active' },
            { id: 102, name: 'Sneha Rao', email: 'sneha@example.com', role: 'Investor', joined: 'Mar 15, 2026', status: 'Inactive' },
            { id: 103, name: 'Vikram Sahai', email: 'vikram@example.com', role: 'Investor', joined: 'Mar 18, 2026', status: 'Active' },
        ],
        farmers: [
            { id: 201, name: 'Gopal Dass', location: 'Punjab', mobile: '9876543210', products: 12, status: 'Verified' },
            { id: 202, name: 'Lakshmi Devi', location: 'Karnataka', mobile: '9123456780', products: 8, status: 'Pending' },
            { id: 203, name: 'Ramesh Singh', location: 'UP', mobile: '8877665544', products: 24, status: 'Verified' },
        ],
        orders: [
            { id: 'GB-9420', user: 'Arjun Mehta', amount: '₹14,500', payment: 'Success', status: 'Shipped' },
            { id: 'GB-9421', user: 'Priya Patel', amount: '₹8,200', payment: 'Success', status: 'Processing' },
            { id: 'GB-9422', user: 'Rahul Jain', amount: '₹22,100', payment: 'Pending', status: 'Pending' },
        ],
        products: [
            { id: 301, name: 'Premium Basmati Rice', farmer: 'Gopal Dass', price: '₹85/kg', stock: '500kg', status: 'Approved' },
            { id: 302, name: 'Organic Turmeric', farmer: 'Lakshmi Devi', price: '₹120/kg', stock: '100kg', status: 'Pending' },
            { id: 303, name: 'Cold Pressed Coconut Oil', farmer: 'Ramesh Singh', price: '₹450/L', stock: '200L', status: 'Approved' },
        ]
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

                        {/* Recent Activity Table */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-900">Recent System Activity</h3>
                                <button className="text-emerald-600 font-bold text-sm hover:underline">View All →</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-left">
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User / Entity</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentActivity.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                                <td className="px-8 py-5 font-bold text-slate-700">{item.user}</td>
                                                <td className="px-8 py-5 text-slate-600 font-medium">{item.action}</td>
                                                <td className="px-8 py-5 text-slate-400">{item.time}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                                                        item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                                                        item.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Registered Users</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name / Email</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dummyData.users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-slate-700">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600 font-medium">{u.role}</td>
                                            <td className="px-8 py-5 text-slate-400">{u.joined}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{u.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'farmers':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Farmer Directory</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Farmer Name</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Location / Mobile</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Listings</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Verification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dummyData.farmers.map((f) => (
                                        <tr key={f.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 font-bold text-slate-700">{f.name}</td>
                                            <td className="px-8 py-5">
                                                <p className="text-slate-600">{f.location}</p>
                                                <p className="text-xs text-slate-400">{f.mobile}</p>
                                            </td>
                                            <td className="px-8 py-5 text-emerald-600 font-bold">{f.products} Products</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${f.status === 'Verified' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{f.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'orders':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Global Orders</h3>
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
                                <tbody className="divide-y divide-slate-50">
                                    {dummyData.orders.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 font-bold text-slate-700">{o.id}</td>
                                            <td className="px-8 py-5 text-slate-600">{o.user}</td>
                                            <td className="px-8 py-5 text-slate-900 font-bold">{o.amount}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${o.status === 'Shipped' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'products':
                return (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Product Approval Queue</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Product Name</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Farmer / Price</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Available Stock</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dummyData.products.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 font-bold text-slate-700">{p.name}</td>
                                            <td className="px-8 py-5">
                                                <p className="text-slate-600">{p.farmer}</p>
                                                <p className="text-xs text-emerald-600 font-bold">{p.price}</p>
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 uppercase text-[10px] font-bold tracking-wider">{p.stock}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-500 hover:text-white transition-all'}`}>{p.status === 'Approved' ? 'Live' : 'Approve'}</button>
                                            </td>
                                        </tr>
                                    ))}
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
                                Security Settings
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Two-Factor Authentication', desc: 'Secure your login with a second step', enabled: true },
                                    { label: 'Admin Activity Logs', desc: 'Track all changes made by administrators', enabled: true },
                                    { label: 'Maintenance Mode', desc: 'Temporarily disable public access to the portal', enabled: false },
                                ].map((s, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div>
                                            <p className="font-bold text-slate-700">{s.label}</p>
                                            <p className="text-xs text-slate-400">{s.desc}</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${s.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${s.enabled ? 'translate-x-6' : ''}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <span className="p-2 bg-slate-100 rounded-lg">⚙️</span>
                                API Configuration
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Gateway Endpoint</label>
                                    <input type="text" readOnly value="https://api.greenbond.com/v1" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-600 font-mono text-sm focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Secret Key</label>
                                    <input type="password" readOnly value="••••••••••••••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-600 font-mono text-sm focus:outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
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
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">{getTabTitle()}</h2>
                            <p className="text-slate-500 text-xs lg:text-sm hidden sm:block font-medium">Administrative Management Control Center</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-6">
                        <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl">
                            <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">🔔</span>
                            <span className="text-sm font-bold text-slate-700">3 Notifications</span>
                        </div>
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-100 rounded-xl lg:rounded-2xl flex items-center justify-center border-2 border-emerald-500/20 shadow-inner overflow-hidden ring-4 ring-white">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
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
                        <button className="hover:text-emerald-500 transition-colors">Security Audit</button>
                        <button className="hover:text-emerald-500 transition-colors">System Logs</button>
                        <button className="hover:text-emerald-500 transition-colors">Help Desk</button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default AdminDashboard;
