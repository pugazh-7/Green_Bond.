import React, { useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const DeliveryLayout = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [assignedCount, setAssignedCount] = React.useState(0);
    const processedOrdersRef = useRef(new Set());
    // Reverted to the First Sound (Standard Beep)
    const audioRef = useRef(new Audio('/notification.mp3'));

    useEffect(() => {
        // Configure audio to loop and set max volume
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;

        const checkPendingKey = () => {
            const currentOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            // Check if ANY order is in 'Accepted' state (waiting for pickup)
            const pickupOrders = currentOrders.filter(o => o.status === 'Accepted');
            setAssignedCount(pickupOrders.length);
            const hasPendingPickup = pickupOrders.length > 0;

            if (hasPendingPickup) {
                // If there are pending orders and audio is NOT playing, start it
                if (audioRef.current.paused) {
                    audioRef.current.play().catch(e => console.log('Audio autoplay prevented:', e));
                    toast("Orders waiting for Pickup! 🔔", {
                        icon: '🚛',
                        id: 'pickup-reminder', // Prevent duplicate toasts
                        duration: 4000
                    });
                }
            } else {
                // If NO pending orders, ensure audio is stopped
                if (!audioRef.current.paused) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0; // Reset
                }
            }
        };

        // Check immediately and then every 2 seconds
        checkPendingKey();
        const interval = setInterval(checkPendingKey, 2000);

        // Cleanup: stop audio when component unmounts
        return () => {
            clearInterval(interval);
            audioRef.current.pause();
        };
    }, []);

    const handleLogout = () => {
        // Clear specific delivery roles if any, currently sharing userRole concept or separate
        localStorage.removeItem('userRole');
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Toaster position="top-right" />
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-gray-900 text-white shadow-md overflow-y-auto flex flex-col`}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-blue-400">Delivery Panel</h1>
                </div>
                <nav className="mt-6">
                    <Link to="/delivery" className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">Dashboard</Link>
                    <Link to="/delivery/orders" className="px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white flex justify-between items-center group">
                        <span>Assigned Orders</span>
                        {assignedCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                {assignedCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/delivery/tracking" className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">Live Navigation</Link>
                    <Link to="/delivery/history" className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">History</Link>

                    <button
                        onClick={() => {
                            audioRef.current.play().catch(e => alert("Audio failed: " + e));
                            toast.success("Test Notification Working!", { icon: '🔔' });
                        }}
                        className="block w-full text-left px-6 py-3 text-yellow-500 hover:bg-gray-800 hover:text-yellow-400 mt-4 border-t border-gray-700"
                    >
                        🔔 Test Notification
                    </button>

                    <button onClick={handleLogout} className="w-full text-left block px-6 py-3 text-red-400 hover:bg-red-900/20 mt-2">Logout</button>
                </nav>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden w-full relative">
                <header className="md:hidden bg-gray-900 shadow-sm p-4 flex items-center justify-between z-20">
                    <h1 className="text-xl font-bold text-blue-400">Delivery Panel</h1>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white focus:outline-none focus:bg-gray-800 rounded-md">
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

export default DeliveryLayout;
