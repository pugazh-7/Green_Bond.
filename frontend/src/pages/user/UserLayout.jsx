import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.jpeg';

const UserLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const scrollRef = React.useRef(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    const [cartCount, setCartCount] = React.useState(0);
    const [orderCount, setOrderCount] = React.useState(0);
    const [bulkCount, setBulkCount] = React.useState(0);

    React.useEffect(() => {
        const checkUpdates = () => {
            const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
            setCartCount(cart.length);

            const orders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            const activeOrders = orders.filter(o => ['Accepted', 'Shipped'].includes(o.status));
            setOrderCount(activeOrders.length);

            const bulkInquiries = JSON.parse(localStorage.getItem('green_bond_bulk_orders') || '[]');
            const activeBulk = bulkInquiries.filter(i => ['Order Confirmed', 'Order Rejected'].includes(i.status));
            setBulkCount(activeBulk.length);
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
            <div className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white shadow-md overflow-y-auto flex flex-col`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={logo} alt="Green Bond" className="w-16 h-16 object-contain" />
                        <h1 className="text-2xl font-bold text-green-700">Green Bond</h1>
                    </div>
                    <p className="text-xs text-gray-500 font-medium ml-1">User Panel</p>
                </div>
                <nav className="mt-6">
                    <Link to="/user/dashboard" className="px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 flex justify-between items-center group transition-colors">
                        <span>My Order</span>
                        {orderCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                {orderCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/user/marketplace" className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600">Marketplace</Link>
                    <Link to="/user/portfolio" className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600">My Portfolio</Link>
                    <Link to="/user/bulk-orders" className="px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 flex justify-between items-center group transition-colors">
                        <span>Bulk Orders</span>
                        {bulkCount > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {bulkCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/user/cart" className="px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 flex justify-between items-center group">
                        <span>My Cart</span>
                        {cartCount > 0 && (
                            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:bg-green-700 transition-colors shadow-sm">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left block px-6 py-3 text-red-600 hover:bg-red-50 mt-10">Logout</button>

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
                        className="w-full text-left block px-6 py-3 text-xs text-gray-400 hover:text-gray-600 mt-4 border-t border-gray-100"
                    >
                        {/* Reset App Data (Debug) */}
                    </button>
                </nav>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Mobile Header / Toggle */}
                <header className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Green Bond" className="w-8 h-8 object-contain" />
                        <h1 className="text-xl font-bold text-green-700">Green Bond</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 focus:outline-none focus:bg-gray-100 rounded-md">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <div
                    ref={scrollRef}
                onScroll={(e) => {
                    if (e.target.scrollTop > 300) {
                        setShowScrollButton(true);
                    } else {
                        setShowScrollButton(false);
                    }
                }}
                className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth"
            >
                <Outlet />

                {/* Scroll to Top Button */}
                {showScrollButton && (
                    <button
                        onClick={() => {
                            scrollRef.current?.scrollTo({
                                top: 0,
                                behavior: 'smooth'
                            });
                        }}
                        className="fixed bottom-8 right-8 z-50 p-4 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300 animate-in fade-in slide-in-from-bottom-4"
                        title="Move to Top"
                        aria-label="Move to Top"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                        </svg>
                    </button>
                )}

                </div>
                
                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex items-center justify-around px-2 py-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <Link to="/user/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/user/dashboard' ? 'text-green-600' : 'text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span className="text-[10px] font-medium">Home</span>
                    </Link>
                    
                    <Link to="/user/marketplace?phase=SHOPPING" className={`flex flex-col items-center gap-1 ${(location.pathname === '/user/marketplace' && (!location.search || location.search.includes('SHOPPING'))) ? 'text-gray-900' : 'text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        <span className="text-[10px] font-medium">Shopping</span>
                    </Link>
                    
                    <Link to="/user/marketplace?phase=QUICK" className={`flex flex-col items-center gap-1 ${location.search.includes('QUICK') ? 'text-purple-600' : 'text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        <span className="text-[10px] font-medium">Quick</span>
                    </Link>
                    
                    <Link to="/user/marketplace?phase=FRESH" className={`flex flex-col items-center gap-1 ${location.search.includes('FRESH') ? 'text-green-600' : 'text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        <span className="text-[10px] font-medium">Fresh</span>
                    </Link>

                    <Link to="/user/cart" className={`flex flex-col items-center gap-1 relative ${location.pathname === '/user/cart' ? 'text-teal-600' : 'text-gray-500'}`}>
                        <div className="relative">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Cart</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserLayout;
