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
                <section className="relative w-full overflow-hidden bg-gradient-to-r from-green-800 to-green-600 py-20 px-4">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
                        <span className="px-3 py-1 bg-green-500/30 border border-green-400/30 text-green-100 text-sm font-semibold rounded-full mb-6 backdrop-blur-sm">
                            {location ? `Delivering to: ${displayAddress}` : 'Set your location to see availability'}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
                            Fresh & Local.<br />Delivered to You.
                        </h1>
                        <p className="text-lg md:text-xl text-green-50 max-w-2xl mb-10 font-medium drop-shadow-sm">
                            Shop nearby stores for instant delivery or buy fresh directly from verified local farmers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=shop' : '/login/user')}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all text-lg"
                            >
                                Shop Now
                            </button>
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=fresh' : '/login/user')}
                                className="w-full sm:w-auto px-8 py-4 bg-green-700/50 border-2 border-green-400 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors text-lg"
                            >
                                Explore Fresh
                            </button>
                        </div>
                    </div>
                </section>

                {/* Modes Section */}
                <section className="py-16 px-4 max-w-7xl mx-auto w-full">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Quick Shop Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-bl-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Quick Shop</h2>
                            <p className="text-gray-600 mb-6 line-clamp-2">Get everyday essentials, snacks, and groceries from your neighborhood shops delivered in minutes.</p>
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=shop' : '/login/user')}
                                className="text-yellow-600 font-bold inline-flex items-center hover:text-yellow-700"
                            >
                                Shop Nearby <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>

                        {/* Fresh Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-bl-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <span className="text-2xl">🌱</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Fresh from Farm</h2>
                            <p className="text-gray-600 mb-6 line-clamp-2">Buy seasonal produce and farm-fresh items directly from verified farmers in your region.</p>
                            <button 
                                onClick={() => navigate(user ? '/user/marketplace?mode=fresh' : '/login/user')}
                                className="text-green-600 font-bold inline-flex items-center hover:text-green-700"
                            >
                                Explore Farmers <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        </div>
                    </div>
                </section>
                
                {/* Partnership Banner */}
                <section className="mt-auto py-12 bg-gray-900 text-white text-center">
                    <p className="text-gray-400 mb-4">Want to sell on Green Bond?</p>
                    <div className="flex justify-center gap-4 text-sm font-medium">
                        <Link to="/signup/farmer" className="hover:text-green-400">Become a Farmer</Link>
                        <span>|</span>
                        <Link to="/signup/shop" className="hover:text-yellow-400">Register your Shop</Link>
                        <span>|</span>
                        <Link to="/signup/delivery" className="hover:text-blue-400">Join as Delivery Partner</Link>
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
