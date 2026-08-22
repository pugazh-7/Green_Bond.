import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import LocationInterceptor from '../../components/LocationInterceptor';

const UserLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = React.useState(0);

    React.useEffect(() => {
        const checkUpdates = () => {
            const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
            setCartCount(cart.length);
        };
        checkUpdates();
        const interval = setInterval(checkUpdates, 2000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { path: '/user', icon: '🏠', label: 'Home' },
        { path: '/user/search', icon: '🔍', label: 'Search' },
        { path: '/user/cart', icon: '🛒', label: 'Cart', count: cartCount },
        { path: '/user/orders', icon: '📦', label: 'Orders' },
        { path: '/user/profile', icon: '👤', label: 'Profile' }
    ];

    return (
        <LocationInterceptor>
            <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden font-sans">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto no-scrollbar relative pb-20">
                    <Outlet />
                </main>

            {/* Sticky Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path === '/user' && location.pathname === '/user/marketplace');
                        return (
                            <Link 
                                key={item.path} 
                                to={item.path} 
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-greenbond-600' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <div className="relative">
                                    <span className={`text-2xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                                        {item.icon}
                                    </span>
                                    {item.count > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {item.count}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
        </LocationInterceptor>
    );
};

export default UserLayout;
