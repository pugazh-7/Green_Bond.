import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    ShoppingBag,
    CreditCard,
    Package,
    Sprout,
    Truck,
    MapPin,
    Settings,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Search,
    Filter,
    ArrowRight,
    ChevronRight,
    Eye,
    RefreshCw,
    Store,
    Calendar,
    Phone,
    Mail,
    LogOut,
    Shield
} from '../../components/ui/Icons';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
    const { user, accessToken, logout, isLoggingOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Dynamic Data States
    const [statsOverview, setStatsOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [farmers, setFarmers] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [auditData, setAuditData] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [configData, setConfigData] = useState(null);

    // Filters and Searches
    const [orderFilter, setOrderFilter] = useState('ALL');
    const [orderSearch, setOrderSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('ALL');
    const [farmerFilter, setFarmerFilter] = useState('ALL');
    const [farmerSearch, setFarmerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

    // Farmer Land Proof Verification States
    const [selectedDocFarmer, setSelectedDocFarmer] = useState(null);
    const [documentBlobUrl, setDocumentBlobUrl] = useState(null);
    const [documentMimeType, setDocumentMimeType] = useState(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);
    const [rejectingFarmer, setRejectingFarmer] = useState(null);
    const [rejectionReasonText, setRejectionReasonText] = useState('');

    // Current user resolution
    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('green_bond_current_user') || '{}'); } catch { return {}; }
    })();
    const userName = user?.name || storedUser.name || 'Administrator';
    const userRole = user?.role || storedUser.role || 'admin';

    const loadRealTimeData = useCallback(async () => {
        setFetchError(null);
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const apiBase = import.meta.env.VITE_API_URL || '';

            const [
                statsRes,
                usersRes, 
                farmersRes, 
                partnersRes, 
                ordersRes, 
                productsRes, 
                auditRes, 
                revenueRes, 
                configRes
            ] = await Promise.all([
                fetch(`${apiBase}/api/admin/stats`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/admin/users`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/admin/farmers`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/admin/delivery-partners`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/orders/admin/all`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/products`).catch(() => null),
                fetch(`${apiBase}/api/admin/audit`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/admin/revenue`, { headers }).catch(() => null),
                fetch(`${apiBase}/api/admin/config`, { headers }).catch(() => null)
            ]);

            if (statsRes?.ok) setStatsOverview(await statsRes.json());
            if (usersRes?.ok) setUsers(await usersRes.json());
            if (farmersRes?.ok) setFarmers(await farmersRes.json());
            if (partnersRes?.ok) setDeliveryPartners(await partnersRes.json());
            if (ordersRes?.ok) setOrders(await ordersRes.json());
            if (productsRes?.ok) setProducts(await productsRes.json());
            if (auditRes?.ok) setAuditData(await auditRes.json());
            if (revenueRes?.ok) setRevenueData(await revenueRes.json());
            if (configRes?.ok) setConfigData(await configRes.json());

        } catch (error) {
            console.error("Error fetching admin data:", error);
            setFetchError("Failed to synchronize admin dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (userRole !== 'admin') {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/login/user');
            return;
        }

        loadRealTimeData();
        const interval = setInterval(loadRealTimeData, 15000); // 15s live sync
        return () => clearInterval(interval);
    }, [navigate, userRole, loadRealTimeData]);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login/user');
    };

    const handleViewDocument = async (farmer) => {
        setSelectedDocFarmer(farmer);
        setIsLoadingDoc(true);
        setDocumentBlobUrl(null);
        setDocumentMimeType(null);

        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers/${farmer._id}/document`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Could not load land proof document');
                setIsLoadingDoc(false);
                return;
            }

            const contentType = res.headers.get('content-type') || 'image/jpeg';
            setDocumentMimeType(contentType);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setDocumentBlobUrl(url);
        } catch (err) {
            console.error('Error fetching document:', err);
            toast.error('Network error loading document');
        } finally {
            setIsLoadingDoc(false);
        }
    };

    const handleCloseDocumentModal = () => {
        if (documentBlobUrl) {
            URL.revokeObjectURL(documentBlobUrl);
        }
        setSelectedDocFarmer(null);
        setDocumentBlobUrl(null);
        setDocumentMimeType(null);
    };

    const handleApproveFarmer = async (farmerId) => {
        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers/${farmerId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Farmer land proof approved! Account activated.');
                setFarmers(prev => prev.map(f => f._id === farmerId ? { ...f, verificationStatus: 'APPROVED', farmerStatus: 'ACTIVE' } : f));
                loadRealTimeData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Approval failed');
            }
        } catch (err) {
            toast.error('Network error during approval');
        }
    };

    const handleOpenRejectModal = (farmer) => {
        setRejectingFarmer(farmer);
        setRejectionReasonText('Uploaded land document is unclear or survey number does not match revenue records.');
    };

    const handleConfirmReject = async () => {
        if (!rejectingFarmer || !rejectionReasonText.trim()) {
            toast.error('Please enter a valid rejection reason.');
            return;
        }

        try {
            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers/${rejectingFarmer._id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: rejectionReasonText.trim() })
            });

            if (res.ok) {
                toast.success('Farmer application rejected. Rejection reason recorded.');
                setFarmers(prev => prev.map(f => f._id === rejectingFarmer._id ? { 
                    ...f, 
                    verificationStatus: 'REJECTED', 
                    farmerStatus: 'INACTIVE',
                    landDocumentRejectionReason: rejectionReasonText.trim() 
                } : f));
                setRejectingFarmer(null);
                setRejectionReasonText('');
                loadRealTimeData();
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Rejection failed');
            }
        } catch (err) {
            toast.error('Network error during rejection');
        }
    };

    // Derived statistics calculations
    const realTotalUsers = statsOverview?.totalUsers ?? users.length;
    const realTotalFarmers = statsOverview?.totalFarmers ?? farmers.length;
    const realTotalShops = statsOverview?.totalShops ?? 1;
    const realTotalDelivery = statsOverview?.totalDeliveryPartners ?? deliveryPartners.length;
    const realTotalProducts = statsOverview?.totalProducts ?? products.length;
    const realActiveOrders = statsOverview?.activeOrders ?? orders.filter(o => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)).length;
    const realCompletedOrders = statsOverview?.completedOrders ?? orders.filter(o => o.status === 'DELIVERED').length;
    const realPendingVerifications = statsOverview?.pendingFarmerVerifications ?? farmers.filter(f => f.verificationStatus === 'PENDING').length;
    const realTotalRevenue = statsOverview?.totalRevenue ?? orders.filter(o => o.status === 'DELIVERED').reduce((acc, curr) => {
        const amt = parseFloat(curr.totalAmount?.toString().replace(/[^0-9.]/g, '') || 0);
        return acc + amt;
    }, 0);

    const statCards = [
        { label: 'Total Users', value: realTotalUsers, icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Total Farmers', value: realTotalFarmers, icon: Sprout, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Shop Owners', value: realTotalShops, icon: Store, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Delivery Boys', value: realTotalDelivery, icon: Truck, color: 'text-purple-700 bg-purple-50 border-purple-200' },
        { label: 'Products', value: realTotalProducts, icon: Package, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Active Orders', value: realActiveOrders, icon: ShoppingBag, color: 'text-orange-700 bg-orange-50 border-orange-200' },
        { label: 'Pending Verifications', value: realPendingVerifications, icon: UserCheck, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'Total Revenue', value: `₹${realTotalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },
    ];

    const navItems = [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard },
        { id: 'farmers', name: 'Farmer Verification', icon: Sprout, badge: realPendingVerifications > 0 ? realPendingVerifications : null },
        { id: 'orders', name: 'All Orders', icon: ShoppingBag, badge: realActiveOrders > 0 ? realActiveOrders : null },
        { id: 'users', name: 'User Directory', icon: Users },
        { id: 'products', name: 'Products Inventory', icon: Package },
        { id: 'locations', name: 'Service Areas', icon: MapPin },
        { id: 'revenue', name: 'Revenue & Accounts', icon: CreditCard },
        { id: 'audit', name: 'Launch Readiness', icon: BarChart3 },
        { id: 'settings', name: 'Settings', icon: Settings },
    ];

    const getTabTitle = () => navItems.find(item => item.id === activeTab)?.name || 'Dashboard';

    // Order status filter logic
    const filteredOrders = orders.filter(o => {
        const matchesSearch = !orderSearch || 
            (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) || 
            (o.userId || '').toLowerCase().includes(orderSearch.toLowerCase());
        if (!matchesSearch) return false;
        if (orderFilter === 'ALL') return true;
        return (o.status || '').toUpperCase() === orderFilter;
    });

    // Farmer verification filter logic
    const filteredFarmers = farmers.filter(f => {
        const matchesSearch = !farmerSearch || 
            (f.name || '').toLowerCase().includes(farmerSearch.toLowerCase()) ||
            (f.mobile || '').includes(farmerSearch) ||
            (f.village || '').toLowerCase().includes(farmerSearch.toLowerCase());
        if (!matchesSearch) return false;

        const status = (f.verificationStatus || '').toUpperCase();
        if (farmerFilter === 'PENDING') return status === 'PENDING' || status === 'PENDING_VERIFICATION';
        if (farmerFilter === 'APPROVED') return status === 'APPROVED' || status === 'LAND_VERIFIED';
        if (farmerFilter === 'REJECTED') return status === 'REJECTED';
        return true;
    });

    // Users search and filter
    const filteredUsers = users.filter(u => {
        const matchesSearch = !userSearch || 
            (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.mobile || '').includes(userSearch);
        if (!matchesSearch) return false;
        if (userRoleFilter === 'ALL') return true;
        return (u.role || 'user').toLowerCase() === userRoleFilter.toLowerCase();
    });

    // Products filter
    const filteredProducts = products.filter(p => {
        const matchesSearch = !productSearch || 
            (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
            (p.farmer || p.farmerName || '').toLowerCase().includes(productSearch.toLowerCase());
        if (!matchesSearch) return false;
        if (productCategoryFilter === 'ALL') return true;
        return (p.category || '').toLowerCase() === productCategoryFilter.toLowerCase();
    });

    const renderContent = () => {
        if (fetchError) {
            return (
                <div className="bg-white p-10 rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-900">Failed to Load Dashboard Data</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto">{fetchError}</p>
                    <button 
                        onClick={loadRealTimeData}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md"
                    >
                        <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-8">
                        {/* Real Dynamic Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {statCards.map((card, idx) => {
                                const IconComp = card.icon;
                                return (
                                    <div 
                                        key={idx} 
                                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2.5 rounded-xl border ${card.color}`}>
                                                <IconComp className="w-6 h-6" />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
                                                Live
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
                                            <p className="text-2xl lg:text-3xl font-black text-gray-900 mt-1">{card.value}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Live Recent Orders Stream */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-gray-900">Recent Live Orders</h3>
                                </div>
                                <button 
                                    onClick={() => setActiveTab('orders')} 
                                    className="text-emerald-700 font-bold text-xs lg:text-sm hover:underline inline-flex items-center gap-1"
                                >
                                    Manage All Orders <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-3.5">Order ID</th>
                                            <th className="px-6 py-3.5">Amount</th>
                                            <th className="px-6 py-3.5">Payment</th>
                                            <th className="px-6 py-3.5">Date</th>
                                            <th className="px-6 py-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.slice(0, 5).map((order, idx) => (
                                            <tr key={order._id || idx} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold font-mono text-gray-900">{order.id}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-900">{order.totalAmount || order.total || '₹0'}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-600">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 font-semibold">{order.paymentMethod || 'COD'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                                        order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {(order.status || 'PENDING').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium">
                                                    No orders in the system yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'orders':
                return (
                    <div className="space-y-6">
                        {/* Filters and Search Bar */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Order ID or Customer ID..."
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                                {['ALL', 'PLACED', 'CONFIRMED', 'PACKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
                                    <button
                                        key={st}
                                        onClick={() => setOrderFilter(st)}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            orderFilter === st ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {st === 'ALL' ? 'All' : st.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Orders Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Total System Orders ({filteredOrders.length})</h3>
                                <button 
                                    onClick={loadRealTimeData}
                                    className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Refresh orders"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-3.5">Order ID</th>
                                            <th className="px-6 py-3.5">Customer</th>
                                            <th className="px-6 py-3.5">Amount</th>
                                            <th className="px-6 py-3.5">Payment</th>
                                            <th className="px-6 py-3.5">Created Time</th>
                                            <th className="px-6 py-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredOrders.map((o, idx) => (
                                            <tr key={o._id || idx} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold font-mono text-gray-900">{o.id}</td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    <p className="font-semibold">{o.deliveryAddress?.fullName || 'Customer'}</p>
                                                    <p className="text-xs text-gray-400 font-mono truncate max-w-[140px]">{o.userId}</p>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{o.totalAmount || o.total || '₹0'}</td>
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100">{o.paymentMethod || 'COD'} ({o.paymentStatus || 'Pending'})</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                                    {new Date(o.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                                                        o.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {(o.status || 'PLACED').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredOrders.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                    <p className="font-semibold">No orders found matching criteria.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'farmers':
                const pendingCount = farmers.filter(f => f.verificationStatus === 'PENDING').length;
                const approvedCount = farmers.filter(f => f.verificationStatus === 'APPROVED' || f.verificationStatus === 'LAND_VERIFIED').length;
                const rejectedCount = farmers.filter(f => f.verificationStatus === 'REJECTED').length;

                return (
                    <div className="space-y-6">
                        {/* Filter and Search Bar */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by farmer name, mobile, or village..."
                                    value={farmerSearch}
                                    onChange={(e) => setFarmerSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                                <button
                                    onClick={() => setFarmerFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${farmerFilter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                                >
                                    All ({farmers.length})
                                </button>
                                <button
                                    onClick={() => setFarmerFilter('PENDING')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${farmerFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    Pending ({pendingCount})
                                </button>
                                <button
                                    onClick={() => setFarmerFilter('APPROVED')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${farmerFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    Approved ({approvedCount})
                                </button>
                                <button
                                    onClick={() => setFarmerFilter('REJECTED')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${farmerFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600'}`}
                                >
                                    Rejected ({rejectedCount})
                                </button>
                            </div>
                        </div>

                        {/* Farmers Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900">Farmer Land Proof Verification</h3>
                                    <p className="text-xs text-gray-500">Inspect submitted Patta / Chitta documents and approve dashboard access</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-3.5">Farmer Info</th>
                                            <th className="px-6 py-3.5">Location</th>
                                            <th className="px-6 py-3.5">Land Details</th>
                                            <th className="px-6 py-3.5">Document</th>
                                            <th className="px-6 py-3.5 text-center">Status</th>
                                            <th className="px-6 py-3.5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredFarmers.map((f, idx) => {
                                            const isApproved = f.verificationStatus === 'APPROVED' || f.verificationStatus === 'LAND_VERIFIED';
                                            const isRejected = f.verificationStatus === 'REJECTED';
                                            return (
                                                <tr key={f._id || idx} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900">{f.name}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {f.mobile}</p>
                                                        {f.email && <p className="text-xs text-gray-400">{f.email}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-gray-800">{f.village || f.location || 'Thiruvannamalai'}</p>
                                                        <p className="text-xs text-gray-400">{f.taluk ? `${f.taluk}, ` : ''}{f.district || 'Tamil Nadu'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-gray-900">Survey: <span className="text-emerald-700">{f.surveyNumber || '—'}</span></p>
                                                        <p className="text-xs text-gray-500">Area: {f.landArea || '—'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-block bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-bold">
                                                            {f.landDocumentType || 'Patta'}
                                                        </span>
                                                        <p className="text-xs text-gray-500 mt-1">{f.landDocumentNumber || 'No Doc Number'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            isApproved ? 'bg-emerald-100 text-emerald-800' :
                                                            isRejected ? 'bg-rose-100 text-rose-800' :
                                                            'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {f.verificationStatus || 'PENDING'}
                                                        </span>
                                                        {isRejected && f.landDocumentRejectionReason && (
                                                            <p className="text-[10px] text-rose-600 mt-1 max-w-[130px] mx-auto truncate" title={f.landDocumentRejectionReason}>
                                                                {f.landDocumentRejectionReason}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleViewDocument(f)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View Doc
                                                            </button>
                                                            {!isApproved && (
                                                                <button
                                                                    onClick={() => handleApproveFarmer(f._id)}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {!isRejected && (
                                                                <button
                                                                    onClick={() => handleOpenRejectModal(f)}
                                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                                                >
                                                                    Reject
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredFarmers.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                                    <Sprout className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                                    <p className="font-semibold">No farmers found for selected filter.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Secure Document Viewer Modal */}
                        {selectedDocFarmer && (
                            <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <div>
                                            <h4 className="font-bold text-gray-900">Land Proof: {selectedDocFarmer.name}</h4>
                                            <p className="text-xs text-gray-500">{selectedDocFarmer.landDocumentType || 'Patta'} • Survey: {selectedDocFarmer.surveyNumber || 'N/A'}</p>
                                        </div>
                                        <button 
                                            onClick={handleCloseDocumentModal}
                                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-700"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-100 min-h-[300px]">
                                        {isLoadingDoc ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-xs font-semibold text-gray-600">Retrieving document from private storage...</p>
                                            </div>
                                        ) : documentBlobUrl ? (
                                            documentMimeType === 'application/pdf' ? (
                                                <iframe src={documentBlobUrl} className="w-full h-[65vh] rounded-xl border border-gray-200" title="PDF Document" />
                                            ) : (
                                                <img src={documentBlobUrl} alt="Land Document Preview" className="max-h-[65vh] rounded-xl object-contain shadow-sm border border-gray-200" />
                                            )
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm font-semibold">Document not found or could not be loaded.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">
                                            Status: <strong className="text-gray-900">{selectedDocFarmer.verificationStatus}</strong>
                                        </span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleCloseDocumentModal}
                                                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                            {selectedDocFarmer.verificationStatus !== 'APPROVED' && (
                                                <button 
                                                    onClick={() => {
                                                        handleApproveFarmer(selectedDocFarmer._id);
                                                        handleCloseDocumentModal();
                                                    }}
                                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                                                >
                                                    Approve Land Proof
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rejection Modal */}
                        {rejectingFarmer && (
                            <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">Reject Land Proof</h4>
                                            <p className="text-xs text-gray-500">Farmer: <strong className="text-gray-900">{rejectingFarmer.name}</strong></p>
                                        </div>
                                        <button onClick={() => setRejectingFarmer(null)} className="text-gray-400 hover:text-gray-600">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-600 mb-3">Select or write a clear rejection explanation for the farmer:</p>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {[
                                            'Uploaded land document is unclear or unreadable.',
                                            'Survey number mismatch with revenue records.',
                                            'Document is expired or incomplete.',
                                            'Wrong document type (Need Patta or Chitta).'
                                        ].map((preset, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setRejectionReasonText(preset)}
                                                className="text-[11px] font-medium bg-gray-50 hover:bg-rose-50 hover:text-rose-700 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors text-left"
                                            >
                                                {preset}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        rows="3"
                                        value={rejectionReasonText}
                                        onChange={(e) => setRejectionReasonText(e.target.value)}
                                        placeholder="Enter specific rejection instructions..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:ring-2 focus:ring-rose-500 focus:outline-none mb-4"
                                    />

                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setRejectingFarmer(null)}
                                            className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmReject}
                                            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'users':
                return (
                    <div className="space-y-6">
                        {/* Users Filter & Search */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or mobile..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                                {['ALL', 'user', 'client', 'delivery', 'shop', 'admin'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setUserRoleFilter(role)}
                                        className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                                            userRoleFilter === role ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'
                                        }`}
                                    >
                                        {role === 'ALL' ? 'All Roles' : (role === 'client' ? 'Farmer' : role)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Registered Users Directory ({filteredUsers.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-3.5">Name</th>
                                            <th className="px-6 py-3.5">Email</th>
                                            <th className="px-6 py-3.5">Mobile</th>
                                            <th className="px-6 py-3.5">Role</th>
                                            <th className="px-6 py-3.5">Registered Date</th>
                                            <th className="px-6 py-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredUsers.map((u, idx) => (
                                            <tr key={u._id || idx} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{u.email || '—'}</td>
                                                <td className="px-6 py-4 text-gray-600 font-mono">{u.mobile || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-gray-100 text-gray-700">
                                                        {u.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'products':
                return (
                    <div className="space-y-6">
                        {/* Products Filter & Search */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search products or seller..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
                                {['ALL', 'Vegetables', 'Fruits', 'Grains', 'Groceries', 'Dairy'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setProductCategoryFilter(cat)}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            productCategoryFilter === cat ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Platform Products Catalog ({filteredProducts.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-3.5">Product</th>
                                            <th className="px-6 py-3.5">Seller / Farmer</th>
                                            <th className="px-6 py-3.5">Category</th>
                                            <th className="px-6 py-3.5">Price</th>
                                            <th className="px-6 py-3.5">Stock</th>
                                            <th className="px-6 py-3.5 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredProducts.map((p, idx) => (
                                            <tr key={p._id || idx} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900">{p.name || p.title}</td>
                                                <td className="px-6 py-4 text-gray-600 font-medium">
                                                    {p.farmer || p.farmerName || (p.sourceType === 'SHOP' ? 'Shop Seller' : 'Local Farmer')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                                                        {p.category || 'Produce'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-emerald-700">₹{p.price} / {p.unit || 'kg'}</td>
                                                <td className="px-6 py-4 font-semibold text-gray-800">{p.stock || p.availableQuantity || 0}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredProducts.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                                                    No products found.
                                                </td>
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
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Operational Service Zone (Thiruvannamalai)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                                    <p className="text-xs text-emerald-700 font-bold uppercase">Farmers</p>
                                    <p className="text-2xl font-black text-emerald-900">{farmers.length}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                                    <p className="text-xs text-blue-700 font-bold uppercase">Customers</p>
                                    <p className="text-2xl font-black text-blue-900">{users.length}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                                    <p className="text-xs text-purple-700 font-bold uppercase">Delivery Partners</p>
                                    <p className="text-2xl font-black text-purple-900">{deliveryPartners.length}</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                                    <p className="text-xs text-amber-700 font-bold uppercase">Active Partners</p>
                                    <p className="text-2xl font-black text-amber-900">{activePartners.length}</p>
                                </div>
                            </div>
                            <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-gray-200">
                                <MapContainer center={LAUNCH_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Circle center={LAUNCH_CENTER} radius={10000} pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.15 }} />
                                    <Marker position={LAUNCH_CENTER}>
                                        <Popup>GreenBond Hub (Thiruvannamalai)</Popup>
                                    </Marker>
                                    {farmers.filter(f => f.lat && f.lng).map((f, i) => (
                                        <Marker key={`f-${i}`} position={[f.lat, f.lng]}>
                                            <Popup>Farmer: {f.name}</Popup>
                                        </Marker>
                                    ))}
                                    {activePartners.filter(p => p.location && p.location.lat).map((p, i) => (
                                        <Marker key={`dp-${i}`} position={[p.location.lat, p.location.lng]}>
                                            <Popup>Partner: {p.name}</Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                );

            case 'revenue':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                                Revenue & Financial Aggregation
                            </h3>
                            {revenueData ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Gross Platform Volume</p>
                                        <p className="text-3xl font-black text-gray-900 mt-2">₹{(revenueData.totalGrossValue || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100">
                                        <p className="text-xs font-bold text-rose-700 uppercase">GST Collected (Liability)</p>
                                        <p className="text-3xl font-black text-rose-900 mt-2">₹{(revenueData.totalGstCollected || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-700 uppercase">Seller Payouts</p>
                                        <p className="text-3xl font-black text-blue-900 mt-2">₹{(revenueData.totalSellerSettlements || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                        <p className="text-xs font-bold text-amber-700 uppercase">Delivery Payouts</p>
                                        <p className="text-3xl font-black text-amber-900 mt-2">₹{(revenueData.totalDeliveryPayouts || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 md:col-span-2">
                                        <p className="text-xs font-bold text-emerald-700 uppercase">Net Commission Earnings</p>
                                        <p className="text-3xl font-black text-emerald-900 mt-2">₹{(revenueData.netPlatformRevenue || 0).toLocaleString()}</p>
                                        <p className="text-xs text-emerald-600 mt-1 font-medium">Platform commissions and operational margins.</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 font-medium">No revenue data available.</p>
                            )}
                        </div>
                    </div>
                );

            case 'audit':
                if (!auditData || !auditData.categories) {
                    return (
                        <div className="p-10 bg-white rounded-2xl border border-gray-100 text-center font-medium text-gray-500">
                            Launch readiness metrics synchronized with live database.
                        </div>
                    );
                }

                const { totalScore, overallStatus, stats: auditStats, categories } = auditData;
                return (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">System Readiness Score: {totalScore}%</h3>
                                <p className="text-sm font-semibold text-gray-500 mt-1">Status: <strong className="text-emerald-700">{overallStatus}</strong></p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <p className="text-xs text-emerald-600 font-bold uppercase">Passed</p>
                                    <p className="text-xl font-black text-emerald-800">{auditStats?.passed || 0}</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-xs text-amber-600 font-bold uppercase">Warnings</p>
                                    <p className="text-xl font-black text-amber-800">{auditStats?.warnings || 0}</p>
                                </div>
                                <div className="text-center px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                                    <p className="text-xs text-rose-600 font-bold uppercase">Critical</p>
                                    <p className="text-xl font-black text-rose-800">{auditStats?.critical || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900">{cat.name}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                            cat.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {cat.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{cat.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-3xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-gray-700" /> System Configuration & GST
                            </h3>
                            {configData ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Legal Name</label>
                                        <input type="text" readOnly value={configData.legalName || 'GreenBond Agro Tech Pvt Ltd'} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GSTIN</label>
                                        <input type="text" readOnly value={configData.gstin || '33AABCG1234F1Z5'} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono font-semibold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission (%)</label>
                                        <input type="text" readOnly value={`${configData.greenBondCommissionPercentage || 5}%`} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Delivery Charge (₹)</label>
                                        <input type="text" readOnly value={`₹${configData.deliveryFee || 40}`} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-semibold" />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 font-medium">Standard system parameters configured.</p>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Brand Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-emerald-500/30">
                            GB
                        </div>
                        <div>
                            <h1 className="font-bold text-base tracking-tight text-white">GreenBond</h1>
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Admin Suite</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((tab) => {
                        const IconComp = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm ${
                                    isActive
                                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <IconComp className="w-4 h-4" />
                                    <span>{tab.name}</span>
                                </div>
                                {tab.badge && (
                                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500 text-slate-950">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout Footer */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-sm font-semibold"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{getTabTitle()}</h2>
                            <p className="text-xs text-gray-500 hidden sm:block">Logged in as <strong className="text-emerald-700">{userName}</strong> (Admin)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live MongoDB Synced
                        </div>
                        <button
                            onClick={loadRealTimeData}
                            className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Content View */}
                <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
