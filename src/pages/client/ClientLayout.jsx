import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const ClientLayout = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const [orderCount, setOrderCount] = React.useState(0);
    const [bulkCount, setBulkCount] = React.useState(0);

    React.useEffect(() => {
        const checkUpdates = () => {
            const orders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            // Orders with status 'Placed' are new for the farmer
            const newOrders = orders.filter(o => o.status === 'Placed');
            setOrderCount(newOrders.length);

            const bulkInquiries = JSON.parse(localStorage.getItem('green_bond_bulk_orders') || '[]');
            // Inquiries with status 'Inquiry Sent' are new interest
            const newInquiries = bulkInquiries.filter(i => i.status === 'Inquiry Sent');
            setBulkCount(newInquiries.length);
        };
        checkUpdates();
        const interval = setInterval(checkUpdates, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gray-800 text-white shadow-md overflow-y-auto flex flex-col`}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-green-400">Farmer Panel</h1>
                </div>
                <nav className="mt-6">
                    <Link to="/client" className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Dashboard</Link>
                    <Link to="/client/orders" className="px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white flex justify-between items-center group">
                        <span>Customer Orders</span>
                        {orderCount > 0 && (
                            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                {orderCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/client/add-product" className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Add Produce</Link>
                    <Link to="/client/bulk-orders" className="px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white flex justify-between items-center group">
                        <span>Bulk Inquiries</span>
                        {bulkCount > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {bulkCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/client/tracking" className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Location Tracking</Link>
                    <button onClick={handleLogout} className="w-full text-left block px-6 py-3 text-red-400 hover:bg-red-900/20 mt-10">Logout</button>

                    <button
                        onClick={() => {
                            if (confirm("Reset all application data? This will clear your products, orders, and login.")) {
                                localStorage.removeItem('green_bond_products');
                                localStorage.removeItem('green_bond_projects');
                                localStorage.removeItem('green_bond_orders');
                                localStorage.removeItem('green_bond_users');
                                localStorage.removeItem('green_bond_farmers');
                                localStorage.removeItem('green_bond_current_user');
                                localStorage.removeItem('user_cart');
                                localStorage.removeItem('userRole');
                                window.location.href = '/';
                            }
                        }}
                        className="w-full text-left block px-6 py-3 text-xs text-gray-500 hover:text-gray-300 mt-4 border-t border-gray-700"
                    >
                        {/* Reset App Data (Debug) */}
                    </button>
                </nav>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden relative">
                <header className="md:hidden bg-gray-800 shadow-sm p-4 flex items-center justify-between z-20">
                    <h1 className="text-xl font-bold text-green-400">Farmer Panel</h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white focus:outline-none focus:bg-gray-700 rounded-md">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ClientLayout;
