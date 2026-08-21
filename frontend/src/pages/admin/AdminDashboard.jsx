import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
    const { accessToken } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dynamic Data States
    const [users, setUsers] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState([]);
    const [auditData, setAuditData] = useState({});

    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || '{}');
    const userName = currentUser.name || 'Administrator';
    const userRole = currentUser.role || 'user';

    useEffect(() => {
        // Redirect if not admin
        if (userRole !== 'admin') {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/user/marketplace');
            return;
        }

        const loadRealTimeData = async () => {
            try {
                const token = accessToken;
                const headers = { 'Authorization': `Bearer ${token}` };

                const [usersRes, farmersRes, partnersRes, ordersRes, productsRes, auditRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/users`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/delivery-partners`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/admin/all`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/products`),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/audit`, { headers })
                ]);

                if (usersRes.ok) setUsers(await usersRes.json());
                if (farmersRes.ok) setFarmers(await farmersRes.json());
                if (partnersRes.ok) setDeliveryPartners(await partnersRes.json());
                if (ordersRes.ok) setOrders(await ordersRes.json());
                if (productsRes.ok) setProducts(await productsRes.json());
                if (auditRes.ok) setAuditData(await auditRes.json());

            } catch (error) {
                console.error("Error fetching admin data:", error);
            }
        };

        loadRealTimeData();
        const interval = setInterval(loadRealTimeData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [navigate, userRole]);

    useEffect(() => {
        // Calculate Stats
        const totalRevenue = orders.reduce((acc, curr) => {
            const amt = parseFloat(curr.totalAmount?.toString().replace(/[^0-9.]/g, '') || 0);
            return acc + amt;
        }, 0);

        const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;

        setStats([
            { label: 'Total Users', value: users.length.toString(), icon: '👥', change: '+Active', color: 'from-emerald-500 to-teal-600' },
            { label: 'Total Farmers', value: farmers.length.toString(), icon: '👨‍🌾', change: '+Active', color: 'from-blue-500 to-indigo-600' },
            { label: 'Active Orders', value: activeOrdersCount.toString(), icon: '📦', change: '+Live', color: 'from-amber-500 to-orange-600' },
            { label: 'Revenue', value: `₹${Math.round(totalRevenue)}`, icon: '💰', change: '+Total', color: 'from-rose-500 to-pink-600' },
        ]);
    }, [users, farmers, orders]);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('green_bond_current_user');
        
        toast.success('Logged out successfully');
        navigate('/');
    };

    const handleVerifyFarmer = async (farmerId, newStatus) => {
        try {
            const token = accessToken;
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers/${farmerId}/verify`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ verificationStatus: newStatus })
            });

            if (res.ok) {
                toast.success(`Farmer status updated to ${newStatus}`);
                setFarmers(farmers.map(f => f._id === farmerId ? { ...f, verificationStatus: newStatus } : f));
            } else {
                toast.error("Failed to update status");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const navItems = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'locations', name: 'Service Area', icon: '🗺️' },
        { id: 'audit', name: 'Launch Readiness', icon: '🚀' },
        { id: 'users', name: 'User Management', icon: '👥' },
        { id: 'farmers', name: 'Farmer Verification', icon: '🚜' },
        { id: 'orders', name: 'Order Details', icon: '🛍️' },
        { id: 'products', name: 'Product Inventory', icon: '🌱' },
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
                        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                            {stats.map((stat, i) => (
                                <div key={i} className="group bg-white p-3 lg:p-6 rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start mb-2 lg:mb-4 gap-2">
                                        <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl lg:text-3xl shadow-lg ring-2 lg:ring-4 ring-white shrink-0`}>
                                            {stat.icon}
                                        </div>
                                        <span className="text-emerald-500 text-[8px] lg:text-sm font-bold bg-emerald-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md lg:rounded-lg">
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="text-center lg:text-left">
                                        <h3 className="text-slate-500 font-bold text-[8px] lg:text-sm uppercase tracking-tighter lg:tracking-wider truncate">{stat.label}</h3>
                                        <p className="text-sm lg:text-3xl font-black text-slate-900 mt-0.5">{stat.value}</p>
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
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer ID</th>
                                            <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {orders.slice(0, 5).map((order) => (
                                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group text-sm">
                                                <td className="px-8 py-5 font-bold text-slate-700">{order.id}</td>
                                                <td className="px-8 py-5 text-slate-600 font-medium truncate max-w-[150px]">{order.userId}</td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                                                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {order.status.replace(/_/g, ' ')}
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
            case 'locations':
                const LAUNCH_CENTER = [12.2253, 79.0747]; // Thiruvannamalai
                const activePartners = deliveryPartners.filter(p => p.status === 'Available');
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Service Area map</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-emerald-600 font-bold uppercase">Farmers</p>
                                    <p className="text-2xl font-black text-emerald-900">{farmers.length}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-blue-600 font-bold uppercase">Customers</p>
                                    <p className="text-2xl font-black text-blue-900">{users.length}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-purple-600 font-bold uppercase">Partners</p>
                                    <p className="text-2xl font-black text-purple-900">{deliveryPartners.length}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-orange-600 font-bold uppercase">Active Partners</p>
                                    <p className="text-2xl font-black text-orange-900">{activePartners.length}</p>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-rose-600 font-bold uppercase">Live Orders</p>
                                    <p className="text-2xl font-black text-rose-900">{orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}</p>
                                </div>
                            </div>
                            <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-200">
                                <MapContainer center={LAUNCH_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    {/* 10 KM Radius Circle */}
                                    <Circle center={LAUNCH_CENTER} radius={10000} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }} />
                                    {/* Launch Center Marker */}
                                    <Marker position={LAUNCH_CENTER}>
                                        <Popup>Launch Center (Thiruvannamalai)</Popup>
                                    </Marker>
                                    
                                    {/* Farmers Markers */}
                                    {farmers.filter(f => f.lat && f.lng).map((f, i) => (
                                        <Marker key={`f-${i}`} position={[f.lat, f.lng]}>
                                            <Popup>👨‍🌾 Farmer: {f.name}</Popup>
                                        </Marker>
                                    ))}

                                    {/* Customers Markers */}
                                    {users.filter(u => u.location && u.location.lat).map((u, i) => (
                                        <Marker key={`u-${i}`} position={[u.location.lat, u.location.lng]}>
                                            <Popup>👥 Customer: {u.name}</Popup>
                                        </Marker>
                                    ))}

                                    {/* Active Delivery Partners */}
                                    {activePartners.filter(p => p.location && p.location.lat).map((p, i) => (
                                        <Marker key={`dp-${i}`} position={[p.location.lat, p.location.lng]}>
                                            <Popup>🚚 Partner: {p.name}</Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                );
            case 'audit':
                if (!auditData || !auditData.categories) return <div className="p-10 text-center animate-pulse text-slate-500 font-bold">Loading audit data...</div>;

                const { totalScore, overallStatus, stats: auditStats, categories } = auditData;
                const scoreColor = overallStatus === 'NOT READY' || overallStatus === 'NEEDS MAJOR IMPROVEMENT' 
                    ? 'text-rose-600' : (overallStatus === 'PRODUCTION READY' ? 'text-emerald-600' : 'text-amber-500');
                const progressColor = overallStatus === 'NOT READY' || overallStatus === 'NEEDS MAJOR IMPROVEMENT' 
                    ? 'bg-rose-500' : (overallStatus === 'PRODUCTION READY' ? 'bg-emerald-500' : 'bg-amber-400');
                
                const bannerBg = overallStatus === 'NOT READY' 
                    ? 'bg-rose-100 border-rose-200' : (overallStatus === 'PRODUCTION READY' ? 'bg-emerald-100 border-emerald-200' : 'bg-amber-100 border-amber-200');

                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Overall Score Dashboard Card */}
                        <div className={`p-8 md:p-12 rounded-[2rem] border-2 shadow-sm ${bannerBg} flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden`}>
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="flex-1 text-center md:text-left z-10">
                                <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-2">Green Bond</p>
                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Launch Readiness</h2>
                                
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm font-bold text-slate-700">
                                        <span>Progress</span>
                                        <span className={scoreColor}>{totalScore}%</span>
                                    </div>
                                    <div className="w-full bg-white/60 h-4 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${progressColor}`} 
                                            style={{ width: `${totalScore}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-4 inline-block bg-white/80 px-4 py-2 rounded-xl border border-white/50 shadow-sm self-start">
                                        <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Ready Level</span>
                                        <span className={`text-xl font-black ${scoreColor}`}>
                                            {overallStatus === 'PRODUCTION READY' ? '🟢' : overallStatus === 'NOT READY' ? '🔴' : '🟡'} {overallStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap md:flex-col gap-4 z-10 w-full md:w-auto">
                                <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none border border-white/50 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Passed</p>
                                    <p className="text-3xl font-black text-emerald-600">{auditStats.passed}</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none border border-white/50 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Warnings</p>
                                    <p className="text-3xl font-black text-amber-500">{auditStats.warnings}</p>
                                </div>
                                <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl flex-1 md:flex-none border border-white/50 shadow-sm text-center transform transition-transform hover:scale-105">
                                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Critical</p>
                                    <p className="text-3xl font-black text-rose-600">{auditStats.critical}</p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Category Breakdown */}
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span>📋</span> Detailed Category Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {categories.map((cat, idx) => {
                                    const isGreen = cat.status === 'READY';
                                    const isRed = cat.status === 'CRITICAL';
                                    
                                    const cardColor = isRed ? 'bg-rose-50 border-rose-200' : (isGreen ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200');
                                    const textColor = isRed ? 'text-rose-700' : (isGreen ? 'text-emerald-700' : 'text-amber-700');
                                    const icon = isRed ? '🔴' : (isGreen ? '🟢' : '🟡');

                                    return (
                                        <div key={idx} className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${cardColor} flex flex-col h-full`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="font-bold text-slate-800 pr-4 leading-tight">{cat.name}</h4>
                                                <span className="text-2xl drop-shadow-sm">{icon}</span>
                                            </div>
                                            
                                            <div className="mt-auto space-y-4">
                                                <p className={`text-sm font-black ${textColor} bg-white/50 inline-block px-3 py-1 rounded-lg border border-white/40`}>
                                                    {cat.status === 'READY' ? 'PASS' : cat.status === 'NEEDS IMPROVEMENT' ? 'WARNING' : 'CRITICAL'}
                                                </p>
                                                
                                                <div className="flex justify-between items-end border-t border-black/5 pt-4">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Weight</p>
                                                        <p className="text-lg font-bold text-slate-700">{cat.weight}%</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Earned</p>
                                                        <p className={`text-xl font-black ${textColor}`}>{cat.score}/{cat.weight}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-white/60 p-3 rounded-xl border border-white/50 text-xs text-slate-600 font-medium">
                                                    {cat.reason}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Final Verification Block */}
                        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white shadow-xl flex flex-col items-center text-center mt-12 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 opacity-50"></div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-300 mb-6">FINAL LAUNCH VERIFICATION</h2>
                            <div className="flex gap-8 mb-8 text-left max-w-sm w-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <div className="space-y-2 font-mono text-sm flex-1">
                                    <p className="text-slate-400">Score:</p>
                                    <p className="text-slate-400">Status:</p>
                                    <p className="text-rose-400">Blockers:</p>
                                </div>
                                <div className="space-y-2 font-mono text-sm font-bold flex-1 text-right">
                                    <p className={scoreColor}>{totalScore}%</p>
                                    <p className={scoreColor}>{overallStatus}</p>
                                    <p className="text-rose-400">{auditStats.critical}</p>
                                </div>
                            </div>
                            {auditData.canLaunch ? (
                                <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xl md:text-2xl px-12 py-6 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/20 uppercase tracking-widest animate-pulse">
                                    🚀 Initiate Launch
                                </button>
                            ) : (
                                <button disabled className="bg-rose-500/20 text-rose-300 border-2 border-rose-500/30 font-bold text-lg md:text-xl px-10 py-5 rounded-2xl cursor-not-allowed uppercase tracking-widest">
                                    Launch Blocked
                                </button>
                            )}
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
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User Name</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map((u, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5 text-slate-700 font-bold">{u.name}</td>
                                            <td className="px-8 py-5 text-slate-600 font-medium">{u.email}</td>
                                            <td className="px-8 py-5 text-slate-600 font-medium">{u.role || 'User'}</td>
                                            <td className="px-8 py-5 text-right text-emerald-600 font-bold uppercase text-[10px]">Active</td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400">No users registered.</td></tr>
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
                            <h3 className="text-lg font-bold text-slate-900">Farmer Verification Network</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold">{farmers.length} Registered</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 text-left">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Farmer Info</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Location</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Verification Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {farmers.map((f, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors text-sm">
                                            <td className="px-8 py-5">
                                                <p className="font-bold text-slate-700">{f.name}</p>
                                                <p className="text-xs text-slate-500">{f.mobile}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-slate-600">{f.address || f.location}</p>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                                    f.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    f.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {f.verificationStatus.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <select 
                                                    value={f.verificationStatus}
                                                    onChange={(e) => handleVerifyFarmer(f._id, e.target.value)}
                                                    className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="PENDING_VERIFICATION">Pending</option>
                                                    <option value="IDENTITY_VERIFIED">Identity Verified</option>
                                                    <option value="LAND_VERIFIED">Land Verified</option>
                                                    <option value="APPROVED">Approved</option>
                                                    <option value="REJECTED">Rejected</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {farmers.length === 0 && (
                                        <tr><td colSpan="4" className="p-10 text-center text-slate-400">No farmers in directory.</td></tr>
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
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer ID</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {orders.map((o, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-700">{o.id}</td>
                                            <td className="px-8 py-5 text-slate-600 truncate max-w-[150px]">{o.userId}</td>
                                            <td className="px-8 py-5 text-slate-900 font-bold">{o.totalAmount}</td>
                                            <td className="px-8 py-5 text-right uppercase text-[10px] font-black">{o.status.replace(/_/g, ' ')}</td>
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
                                            <td className="px-8 py-5 text-emerald-600 font-bold">₹{p.price}/{p.unit}</td>
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


