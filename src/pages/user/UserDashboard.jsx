import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import ProductCard from '../../components/cards/ProductCard';
import QuickCard from '../../components/cards/QuickCard';
import FreshCard from '../../components/cards/FreshCard';
import toast from 'react-hot-toast';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { location, requestLocation } = useLocationContext();
    const [activeMarket, setActiveMarket] = useState('SHOPPING'); // SHOPPING | QUICK | FRESH
    const [isLoading, setIsLoading] = useState(true);
    
    // Data states
    const [shoppingData, setShoppingData] = useState({ bestDeals: [], newArrivals: [], categoryProducts: {} });
    const [quickProducts, setQuickProducts] = useState([]);
    const [freshProducts, setFreshProducts] = useState([]);
    const [availability, setAvailability] = useState({ shoppingAvailable: true, quickAvailable: false, freshAvailable: false });

    useEffect(() => {
        fetchDashboardData();
    }, [location]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const lat = location?.lat;
            const lng = location?.lng;
            
            // 1. Check Availability
            const availRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/availability?lat=${lat}&lng=${lng}`);
            if (availRes.ok) setAvailability(await availRes.json());

            // 2. Fetch Shopping Meta
            const shopRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/shopping-meta`);
            if (shopRes.ok) setShoppingData(await shopRes.json());

            // 3. Fetch Quick & Fresh if location exists
            if (lat && lng) {
                const [quickRes, freshRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/quick?lat=${lat}&lng=${lng}&limit=10`),
                    fetch(`${import.meta.env.VITE_API_URL || ''}/api/fresh?lat=${lat}&lng=${lng}&limit=10`)
                ]);
                if (quickRes.ok) setQuickProducts((await quickRes.json()).products || []);
                if (freshRes.ok) setFreshProducts((await freshRes.json()).products || []);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.cartQuantity += 1;
        } else {
            cart.push({ ...product, cartQuantity: 1 });
        }
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.title} to cart`);
        // Trigger a custom event for layout to update count immediately
        window.dispatchEvent(new Event('storage'));
    };

    const renderSkeletons = () => (
        <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="w-40 h-56 bg-gray-200 animate-pulse rounded-2xl shrink-0"></div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-6">
            {/* 1. Location Bar & Search Header */}
            <div className="bg-white px-4 pt-safe-top pb-4 shadow-sm sticky top-0 z-40">
                <div className="flex items-center justify-between mb-3 pt-2">
                    <div className="flex items-center space-x-2" onClick={() => requestLocation()}>
                        <span className="text-xl">📍</span>
                        <div className="flex flex-col cursor-pointer">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Deliver to</span>
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                                {location ? location.address : 'Select Location'} ▾
                            </span>
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-greenbond-50 rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate('/user/profile')}>
                        <span className="text-lg">👤</span>
                    </div>
                </div>
                
                {/* Search Bar Trigger */}
                <div 
                    onClick={() => navigate('/user/search')}
                    className="w-full bg-gray-100 p-3 rounded-xl flex items-center space-x-2 cursor-text active:scale-95 transition-transform"
                >
                    <span className="text-gray-400">🔍</span>
                    <span className="text-gray-500 text-sm">Search products, brands & farmers</span>
                </div>
            </div>

            {/* 2. Premium Marketplace Switcher */}
            <div className="px-4 py-4">
                <div className="flex p-1 bg-gray-200/60 rounded-2xl">
                    <button 
                        onClick={() => setActiveMarket('SHOPPING')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeMarket === 'SHOPPING' ? 'bg-white shadow-sm text-greenbond-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🛍 Shopping
                    </button>
                    <button 
                        onClick={() => setActiveMarket('QUICK')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeMarket === 'QUICK' ? 'bg-gradient-to-r from-quick-500 to-quick-600 shadow-md text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ⚡ Quick
                    </button>
                    <button 
                        onClick={() => setActiveMarket('FRESH')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeMarket === 'FRESH' ? 'bg-fresh-600 shadow-md text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🥬 Fresh
                    </button>
                </div>
            </div>

            {/* 3. Marketplace Content */}
            <div className="px-4 space-y-8">
                {activeMarket === 'SHOPPING' && (
                    <>
                        <section>
                            <div className="flex justify-between items-end mb-3">
                                <h2 className="text-lg font-bold font-display text-gray-900">Deals Near You</h2>
                                <span className="text-xs font-semibold text-greenbond-600">See all →</span>
                            </div>
                            {isLoading ? renderSkeletons() : (
                                <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 snap-x">
                                    {shoppingData.bestDeals.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />)}
                                </div>
                            )}
                        </section>
                        
                        <section>
                            <div className="flex justify-between items-end mb-3">
                                <h2 className="text-lg font-bold font-display text-gray-900">Recommended For You</h2>
                                <span className="text-xs font-semibold text-greenbond-600">See all →</span>
                            </div>
                            {isLoading ? renderSkeletons() : (
                                <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 snap-x">
                                    {shoppingData.newArrivals.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />)}
                                </div>
                            )}
                        </section>
                        
                        {Object.entries(shoppingData.categoryProducts || {}).map(([cat, prods]) => (
                            <section key={cat}>
                                <div className="flex justify-between items-end mb-3">
                                    <h2 className="text-lg font-bold font-display text-gray-900">{cat}</h2>
                                    <span className="text-xs font-semibold text-greenbond-600">See all →</span>
                                </div>
                                <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 snap-x">
                                    {prods.map(p => <ProductCard key={p.id} product={p} onAdd={handleAddToCart} />)}
                                </div>
                            </section>
                        ))}
                    </>
                )}

                {activeMarket === 'QUICK' && (
                    <>
                        {!availability.quickAvailable && !isLoading ? (
                            <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl text-center mt-8">
                                <span className="text-4xl block mb-2">🛵</span>
                                <h3 className="font-bold text-orange-800 mb-1">Quick Delivery Unavailable</h3>
                                <p className="text-sm text-orange-600">There are no quick-commerce registered shops near your current location.</p>
                            </div>
                        ) : (
                            <section>
                                <div className="flex justify-between items-end mb-3">
                                    <h2 className="text-lg font-bold font-display text-gray-900">Nearby Essentials (10-15 min)</h2>
                                    <span className="text-xs font-semibold text-quick-600">See all →</span>
                                </div>
                                {isLoading ? renderSkeletons() : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {quickProducts.map(p => <QuickCard key={p.id} product={p} onAdd={handleAddToCart} />)}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}

                {activeMarket === 'FRESH' && (
                    <>
                        {!availability.freshAvailable && !isLoading ? (
                            <div className="bg-teal-50 border border-teal-200 p-6 rounded-2xl text-center mt-8">
                                <span className="text-4xl block mb-2">🌱</span>
                                <h3 className="font-bold text-teal-800 mb-1">No Farmers Nearby</h3>
                                <p className="text-sm text-teal-600">There are no verified farmers in your serviceable area right now.</p>
                            </div>
                        ) : (
                            <section>
                                <div className="flex justify-between items-end mb-3">
                                    <h2 className="text-lg font-bold font-display text-gray-900">Fresh Today</h2>
                                    <span className="text-xs font-semibold text-fresh-600">See all →</span>
                                </div>
                                {isLoading ? renderSkeletons() : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {freshProducts.map(p => <FreshCard key={p.id} product={p} onAdd={handleAddToCart} />)}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
