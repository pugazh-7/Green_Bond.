import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationContext } from '../context/LocationContext';
import LocationPicker from '../components/LocationPicker';

const LandingPage = () => {
    const { user } = useAuth();
    const { location, requestLocation, manuallySetLocation, isFetching } = useLocationContext();
    const navigate = useNavigate();
    const [showLocationModal, setShowLocationModal] = useState(false);

    // Prompt location on first visit if not present
    useEffect(() => {
        if (!location && !showLocationModal) {
            setShowLocationModal(true);
        }
    }, [location, showLocationModal]);

    const handleLocationSelect = (loc) => {
        manuallySetLocation(loc.lat, loc.lng, loc.address);
        setShowLocationModal(false);
    };

    const displayAddress = location 
        ? (location.address.length > 30 ? location.address.substring(0, 30) + '...' : location.address)
        : 'Select Location';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header (App-like for Landing) */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Logo handled by Layout usually, but let's show address selector here */}
                        <button 
                            onClick={() => setShowLocationModal(true)}
                            className="flex items-center text-sm font-medium text-gray-700 hover:text-green-600 transition-colors bg-gray-100 py-1.5 px-3 rounded-full"
                        >
                            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="truncate max-w-[150px] sm:max-w-[300px]">{displayAddress}</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="hidden sm:block relative">
                            <input 
                                type="text" 
                                placeholder="Search for products..." 
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-green-500 w-64 bg-gray-50"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        
                        <Link to={user ? "/user/cart" : "/login/user"} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </Link>
                        
                        {!user ? (
                            <Link to="/login/user" className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors">
                                Login
                            </Link>
                        ) : (
                            <Link to="/user" className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="flex-grow flex flex-col">
                <section className="relative w-full overflow-hidden min-h-[600px] flex items-center justify-center py-20 px-4">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                    
                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center mt-10">
                        <span className="px-4 py-1.5 glass-panel text-white text-sm font-semibold rounded-full mb-8 flex items-center gap-2 shadow-lg">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            {location ? `Delivering to: ${displayAddress}` : 'Set your location for accurate delivery times'}
                        </span>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-2xl font-heading leading-tight">
                            Fresh & Local.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-200">Delivered to You.</span>
                        </h1>
                        
                        <p className="text-lg md:text-2xl text-gray-200 max-w-3xl mb-12 font-medium drop-shadow-md leading-relaxed">
                            Shop nearby stores for instant essentials or buy fresh produce directly from verified local farmers.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto px-4">
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=shop' : '/login/user')}
                                className="w-full sm:w-auto px-10 py-5 bg-white text-green-800 font-bold rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] hover:-translate-y-1 transform transition-all duration-300 text-xl font-heading"
                            >
                                Shop Quick Essentials
                            </button>
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=fresh' : '/login/user')}
                                className="w-full sm:w-auto px-10 py-5 glass-panel text-white font-bold rounded-2xl hover:bg-white/20 hover:-translate-y-1 transform transition-all duration-300 text-xl font-heading"
                            >
                                Explore Farmer Market
                            </button>
                        </div>
                    </div>
                </section>

                {/* Modes Section */}
                <section className="py-24 px-4 max-w-7xl mx-auto w-full -mt-16 relative z-20">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Quick Shop Card */}
                        <div className="premium-card p-10 relative overflow-hidden group cursor-pointer" onClick={() => navigate(user ? '/user/marketplace?mode=shop' : '/login/user')}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <div className="flex items-center justify-between mb-8 relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 text-green-700 rounded-2xl flex items-center justify-center shadow-sm border border-green-100">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">10-15 Min</span>
                            </div>
                            
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading group-hover:text-green-700 transition-colors">Quick Shop</h2>
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed">Get milk, snacks, drinks, and household essentials from your neighborhood stores delivered in minutes.</p>
                            
                            <div className="flex items-center text-green-700 font-bold group-hover:translate-x-2 transition-transform">
                                Shop Nearby <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </div>
                        </div>

                        {/* Fresh Card */}
                        <div className="premium-card p-10 relative overflow-hidden group cursor-pointer" onClick={() => navigate(user ? '/user/marketplace?mode=fresh' : '/login/user')}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-green-600/20 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                            
                            <div className="flex items-center justify-between mb-8 relative">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 text-green-700 rounded-2xl flex items-center justify-center shadow-sm border border-green-100">
                                    <span className="text-3xl">🌱</span>
                                </div>
                                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Direct Source</span>
                            </div>
                            
                            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading group-hover:text-green-700 transition-colors">Fresh from Farmers</h2>
                            <p className="text-gray-600 mb-8 text-lg leading-relaxed">Buy seasonal vegetables, fruits, and greens directly from verified local farmers for maximum freshness.</p>
                            
                            <div className="flex items-center text-green-700 font-bold group-hover:translate-x-2 transition-transform">
                                Explore Farmers <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Premium Role Selection */}
                <section className="mt-auto py-20 bg-gray-50 border-t border-gray-200">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-gray-900 font-heading mb-4">Join the GreenBond Ecosystem</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto">Whether you want to shop fresh groceries or grow your own local business, we have a place for you.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Customer */}
                            <Link to="/login/user" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-green-200 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">Customer</h3>
                                <p className="text-sm text-gray-500 mb-4">Shop quick essentials and fresh local produce.</p>
                                <div className="text-green-600 font-semibold text-sm flex items-center">
                                    Sign In <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                            </Link>

                            {/* Farmer */}
                            <Link to="/login/farmer" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-green-200 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">Farmer</h3>
                                <p className="text-sm text-gray-500 mb-4">Sell directly to customers and maximize your profit.</p>
                                <div className="text-emerald-600 font-semibold text-sm flex items-center">
                                    Sell Produce <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                            </Link>

                            {/* Shop Owner */}
                            <Link to="/login/shop" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-yellow-200 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-700 transition-colors">Shop Owner</h3>
                                <p className="text-sm text-gray-500 mb-4">Digitize your local store and reach more nearby buyers.</p>
                                <div className="text-yellow-600 font-semibold text-sm flex items-center">
                                    Sell Locally <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                            </Link>

                            {/* Delivery */}
                            <Link to="/login/delivery" className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M15 6H3v6h12v-6zM15 6h2.5l2.5 3v3h-5V6z"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">Delivery</h3>
                                <p className="text-sm text-gray-500 mb-4">Earn flexibly by delivering orders in your area.</p>
                                <div className="text-blue-600 font-semibold text-sm flex items-center">
                                    Deliver & Earn <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Select Delivery Location</h3>
                            {location && (
                                <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            )}
                        </div>
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                            <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3">
                                <svg className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p>Your location helps us show nearby shops, verified farmers, and accurate delivery times.</p>
                            </div>
                            
                            <LocationPicker onLocationChange={handleLocationSelect} defaultLocation={location} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
