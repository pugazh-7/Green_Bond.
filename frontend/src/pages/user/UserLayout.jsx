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

    React.useEffect(() => {
        const checkUpdates = () => {
            try {
                const cartData = JSON.parse(localStorage.getItem('user_cart') || '[]');
                const cart = Array.isArray(cartData) ? cartData : [];
                setCartCount(cart.length);
            } catch(e) {
                setCartCount(0);
            }

            try {
                const ordersData = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
                const orders = Array.isArray(ordersData) ? ordersData : [];
                const activeOrders = orders.filter(o => ['Accepted', 'Shipped'].includes(o?.status));
                setOrderCount(activeOrders.length);
            } catch(e) {
                setOrderCount(0);
            }
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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Desktop Sidebar */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white shadow-xl overflow-y-auto flex flex-col`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={logo} alt="Green Bond" className="w-16 h-16 object-contain rounded-xl shadow-sm" />
                        <h1 className="text-2xl font-black tracking-tight text-green-800 font-heading">GreenBond</h1>
                    </div>
                    <p className="text-xs text-gray-400 font-medium ml-1">Quick Commerce</p>
                </div>
                <nav className="mt-6 flex flex-col gap-1 px-3">
                    <Link to="/user" className={`px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors ${location.pathname === '/user' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        <span>Marketplace</span>
                    </Link>
                    <Link to="/user/orders" className={`px-4 py-3 rounded-2xl flex items-center justify-between transition-colors ${location.pathname.startsWith('/user/orders') ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            <span>Orders</span>
                        </div>
                        {orderCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                {orderCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/user/cart" className={`px-4 py-3 rounded-2xl flex items-center justify-between transition-colors ${location.pathname === '/user/cart' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span>Cart</span>
                        </div>
                        {cartCount > 0 && (
                            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/user/profile" className={`px-4 py-3 rounded-2xl flex items-center gap-3 transition-colors ${location.pathname === '/user/profile' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span>Account</span>
                    </Link>
                </nav>
                <div className="mt-auto p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full py-3 px-4 rounded-xl text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden relative bg-gray-50/50">
                <div
                    ref={scrollRef}
                    onScroll={(e) => setShowScrollButton(e.target.scrollTop > 300)}
                    className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar"
                >
                    <Outlet />

                    {/* Scroll to Top */}
                    {showScrollButton && (
                        <button
                            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 p-3 bg-green-600 text-white rounded-2xl shadow-xl hover:bg-green-700 transition-all duration-300 hover:scale-105 active:scale-95 animate-slide-up"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                            </svg>
                        </button>
                    )}
                    
                    {/* Extra padding at bottom for mobile nav */}
                    <div className="h-20 md:h-0"></div>
                </div>
                
                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50 flex items-center justify-around px-2 py-3 pb-safe shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.08)]">
                    <Link to="/user" className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/user' ? 'text-green-700 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
                        <div className={`p-1.5 rounded-xl ${location.pathname === '/user' ? 'bg-green-50' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={location.pathname === '/user' ? "2.5" : "2"} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </div>
                        <span className="text-[10px] font-bold">Home</span>
                    </Link>
                    
                    <Link to="/user/orders" className={`flex flex-col items-center gap-1 transition-all ${location.pathname.startsWith('/user/orders') ? 'text-green-700 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
                        <div className={`p-1.5 rounded-xl relative ${location.pathname.startsWith('/user/orders') ? 'bg-green-50' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={location.pathname.startsWith('/user/orders') ? "2.5" : "2"} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            {orderCount > 0 && (
                                <span className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-bold h-3 w-3 rounded-full flex items-center justify-center ring-2 ring-white">
                                    {orderCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Orders</span>
                    </Link>

                    <Link to="/user/cart" className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/user/cart' ? 'text-green-700 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
                        <div className={`p-1.5 rounded-xl relative ${location.pathname === '/user/cart' ? 'bg-green-50' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={location.pathname === '/user/cart' ? "2.5" : "2"} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white animate-scale-in">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Cart</span>
                    </Link>

                    <Link to="/user/profile" className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/user/profile' ? 'text-green-700 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
                        <div className={`p-1.5 rounded-xl ${location.pathname === '/user/profile' ? 'bg-green-50' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={location.pathname === '/user/profile' ? "2.5" : "2"} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <span className="text-[10px] font-bold">Account</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserLayout;
