import React, { useState, useEffect } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';
import { resolveIcon, resolveCategoryIcon } from '../../utils/iconRegistry';
import React from 'react';

const CATEGORIES = [
    'All', 'Grocery', 'Fruits & Vegetables', 'Milk & Dairy', 'Snacks', 
    'Drinks', 'Electronics', 'Fashion', 'Beauty & Personal Care', 'Household', 
    'Home & Kitchen', 'Baby Care', 'Books & Stationery', 'Sports & Fitness', 
    'Travel', 'Pet Care'
];

const TRENDING_SEARCHES = ['Milk', 'Rice', 'Chips', 'Biscuits', 'Phone', 'Shampoo', 'Shirt', 'Headphones'];

const Marketplace = () => {
    const { location, requestLocation, isFetching } = useLocationContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    const urlLocation = useLocation();
    const searchParams = new URLSearchParams(urlLocation.search);
    const initialPhase = searchParams.get('phase') || 'SHOPPING';

    const [activePhase, setActivePhase] = useState(initialPhase);
    const [products, setProducts] = useState([]);
    
    // Core Unified Catalogue State
    const [activeCategory, setActiveCategory] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [metaData, setMetaData] = useState({ categoryCounts: {}, bestDeals: [], newArrivals: [] });
    
    // Suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [queryCompleted, setQueryCompleted] = useState(false);
    
    // Quick Marketplace specific states
    const [quickMeta, setQuickMeta] = useState(null);
    const [quickShops, setQuickShops] = useState([]);

    useEffect(() => {
        const phase = searchParams.get('phase') || 'SHOPPING';
        setActivePhase(phase);
        setPage(1); 
        setProducts([]); 
        if (phase !== 'SHOPPING') {
            setActiveCategory('All');
        }
    }, [urlLocation.search]);

    // Fetch Meta Data
    useEffect(() => {
        const fetchShoppingMeta = async () => {
            if (activePhase !== 'SHOPPING') return;
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/shopping-meta`);
                if (res.ok) {
                    const data = await res.json();
                    setMetaData(data);
                }
            } catch (err) {
                console.error("Meta fetch failed", err);
            }
        };
        fetchShoppingMeta();
    }, [activePhase]);

    useEffect(() => {
        const fetchQuickData = async () => {
            if (activePhase !== 'QUICK' || !location?.lat || !location?.lng) return;
            try {
                const metaRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/quick-meta?lat=${location.lat}&lng=${location.lng}`);
                if (metaRes.ok) setQuickMeta(await metaRes.json());

                const shopsRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/quick-shops?lat=${location.lat}&lng=${location.lng}`);
                if (shopsRes.ok) setQuickShops(await shopsRes.json());
            } catch (err) {
                console.error("Quick data fetch failed", err);
            }
        };
        fetchQuickData();
    }, [activePhase, location]);

    // Debounce search query
    useEffect(() => {
        setIsSearching(true);
        setQueryCompleted(false);
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
            setProducts([]);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory]); // Trigger fetch on category change too

    // Fetch Suggestions while typing
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const fetchSuggestions = async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/suggestions?q=${encodeURIComponent(searchQuery)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.error("Suggestion fetch failed", err);
                }
            };
            fetchSuggestions();
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        if (location?.lat && location?.lng) {
            fetchProducts();
        } else {
            setIsLoading(false);
        }
    }, [location, activePhase, debouncedSearch, activeCategory, page]);

    const fetchProducts = async () => {
        if (page === 1) setIsLoading(true);
        setIsSearching(true);
        try {
            let endpoint = '/api/marketplace/products';
            if (activePhase === 'QUICK') endpoint = '/api/marketplace/quick';
            if (activePhase === 'FRESH') endpoint = '/api/marketplace/fresh';

            let url = `${import.meta.env.VITE_API_URL || ''}${endpoint}?lat=${location.lat}&lng=${location.lng}&page=${page}&limit=20`;
            
            if (debouncedSearch) {
                url += `&q=${encodeURIComponent(debouncedSearch)}`;
            }
            
            // Apply category filter if it's SHOPPING phase
            if (activePhase === 'SHOPPING' && activeCategory !== 'All') {
                url += `&category=${encodeURIComponent(activeCategory)}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const newProducts = data?.products || [];
                const isLastPage = (data?.pagination?.page || 1) >= (data?.pagination?.totalPages || 1);
                
                if (page === 1) {
                    setProducts(newProducts);
                } else {
                    setProducts(prev => [...prev, ...newProducts]);
                }
                setHasMore(!isLastPage);
            } else {
                toast.error("Failed to fetch products");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Network error");
        } finally {
            setIsLoading(false);
            setIsSearching(false);
            setQueryCompleted(true);
        }
    };

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            setPage(prev => prev + 1);
        }
    };

    const handleCategoryClick = (cat) => {
        setActiveCategory(cat);
    };

    const handleSearchClick = (term) => {
        setSearchQuery(term);
    };

    const addToCart = (e, product) => {
        // Now handled inside ProductCard
    };

    const goToProductDetails = (productId) => {
        navigate(`/user/product/${productId}`);
    };

    if (!location) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Set Your Delivery Location</h1>
                <p className="text-gray-500 max-w-md mb-8">We need your location to show available products and accurate delivery times.</p>
                <button 
                    onClick={requestLocation}
                    disabled={isFetching}
                    className="bg-green-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isFetching ? 'Detecting...' : 'Use Current Location'}
                </button>
            </div>
        );
    }

    const renderProductCards = (items) => (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {items.map(product => (
                <div key={`${product._id}-${Math.random()}`} className="h-full">
                    <ProductCard 
                        product={product} 
                        variant={activePhase.toLowerCase()} 
                        priority={true} 
                    />
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen pb-24 md:pb-8">
            {/* Header Structure */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                            <div className={`hidden md:flex items-center justify-center w-10 h-10 rounded-xl font-black text-xl cursor-pointer ${activePhase === 'QUICK' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`} onClick={() => navigate('/user/marketplace')}>
                                {activePhase === 'QUICK' ? '⚡' : 'G'}
                            </div>
                            <button onClick={requestLocation} className="flex flex-col items-start hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors flex-1">
                                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${activePhase === 'QUICK' ? 'text-purple-600' : 'text-gray-400'}`}>
                                    {activePhase === 'QUICK' && <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                                    {!activePhase === 'QUICK' && <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>}
                                    {activePhase === 'QUICK' ? 'Delivering in 10-15m to' : 'Deliver To'}
                                </span>
                                <span className="text-sm font-bold text-gray-900 truncate w-[200px] text-left">{location.address}</span>
                            </button>
                            
                            {/* Mobile User Icons */}
                            <div className="flex md:hidden items-center gap-2">
                                <button onClick={() => navigate('/user/profile')} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </button>
                                <button onClick={() => navigate('/user/cart')} className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </button>
                            </div>
                        </div>
                        
                        {/* Search Bar - Unified */}
                        <div className="flex-1 w-full max-w-2xl relative">
                            <input 
                                type="text"
                                placeholder={activePhase === 'QUICK' ? "Search 10-15m essentials..." : `Search ${metaData.categoryCounts['All'] || '1000+'} products...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                className="w-full bg-gray-100 border-none rounded-2xl py-3 px-12 text-gray-900 focus:ring-2 focus:ring-green-500 transition-shadow"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            
                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                    {suggestions.map(sug => (
                                        <button 
                                            key={sug.id}
                                            onClick={() => { setSearchQuery(sug.title); setShowSuggestions(false); }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{sug.title}</div>
                                                <div className="text-xs text-gray-400">{sug.category}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Desktop User Icons */}
                        <div className="hidden md:flex items-center gap-3">
                            <button onClick={() => navigate('/user/profile')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </button>
                            <button onClick={() => navigate('/user/cart')} className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 relative">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex gap-2 md:gap-4 overflow-x-auto py-3 hide-scrollbar">
                            <button onClick={() => setActivePhase('SHOPPING')} className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 ${activePhase === 'SHOPPING' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {React.createElement(resolveIcon('shopping'), { className: "w-5 h-5" })} Shopping
                            </button>
                            <button onClick={() => setActivePhase('QUICK')} className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 ${activePhase === 'QUICK' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {React.createElement(resolveIcon('quick'), { className: "w-5 h-5" })} Quick <span className="font-normal text-xs">(10-15m)</span>
                            </button>
                            <button onClick={() => setActivePhase('FRESH')} className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 ${activePhase === 'FRESH' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {React.createElement(resolveIcon('fresh'), { className: "w-5 h-5" })} Fresh <span className="font-normal text-xs">(Farmer)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                
                {/* Unified Discovery UI - Only shown in SHOPPING phase */}
                {activePhase === 'SHOPPING' && (
                    <div className="mb-8">
                        {/* Trending Searches */}
                        <div className="mb-6">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Trending Searches</span>
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                                {TRENDING_SEARCHES.map(term => (
                                    <button 
                                        key={term}
                                        onClick={() => handleSearchClick(term)}
                                        className="flex-shrink-0 px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
                                    >
                                        <svg className="w-3 h-3 inline-block mr-1.5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filters (Scrollable) */}
                        <div className="mb-10">
                            <h3 className="text-xl font-black text-gray-900 mb-4">Categories</h3>
                            <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                                {CATEGORIES.map((cat, idx) => {
                                    const count = metaData.categoryCounts[cat] || (cat === 'All' ? metaData.categoryCounts['All'] : 0);
                                    const isActive = activeCategory === cat;
                                    
                                    // Don't show categories with 0 count unless it's "All" or loading
                                    if (count === 0 && cat !== 'All' && metaData.categoryCounts['All']) return null;

                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`flex-shrink-0 px-6 py-4 rounded-2xl flex flex-col items-start gap-1 min-w-[120px] transition-all duration-300 ${isActive ? 'bg-gray-900 text-white shadow-xl scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-900 shadow-sm'}`}
                                        >
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 mb-1 group-hover:bg-white transition-colors">
                                                {React.createElement(resolveCategoryIcon(cat), { className: "w-6 h-6" })}
                                            </div>
                                            <span className="font-bold text-sm leading-tight text-left">{cat}</span>
                                            {count > 0 && <span className={`text-[10px] font-semibold ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>({count})</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Best Deals & New Arrivals (Only show if on 'All' and not searching) */}
                        {activeCategory === 'All' && !searchQuery && !isLoading && (
                            <div className="space-y-10 mb-12">
                                {metaData.bestDeals?.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            {React.createElement(resolveCategoryIcon('personal care'), { className: "w-6 h-6 text-pink-500" })} 
                                            GreenBond Picks
                                        </h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(metaData.bestDeals)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {metaData.newArrivals?.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                            {React.createElement(resolveCategoryIcon('electronics'), { className: "w-6 h-6 text-blue-500" })} 
                                            New Arrivals
                                        </h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(metaData.newArrivals)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Unified Discovery UI - QUICK Phase */}
                {activePhase === 'QUICK' && !searchQuery && (
                    <div className="mb-8">
                        {/* Quick Categories */}
                        <div className="mb-10">
                            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-purple-600">⚡</span> Quick Essentials
                            </h3>
                            <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                                {['All', 'Milk', 'Bread & Butter', 'Eggs', 'Snacks', 'Cold Drinks', 'Ice Cream'].map((cat, idx) => {
                                    const isActive = activeCategory === cat;
                                    return (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleCategoryClick(cat)}
                                            className={`flex-shrink-0 px-6 py-4 rounded-2xl flex flex-col items-start gap-1 min-w-[120px] transition-all duration-300 ${isActive ? 'bg-purple-900 text-white shadow-xl scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-900 shadow-sm'}`}
                                        >
                                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-1 group-hover:bg-white transition-colors">
                                                {React.createElement(resolveCategoryIcon(cat), { className: "w-6 h-6" })}
                                            </div>
                                            <span className="font-bold text-sm leading-tight text-left">{cat}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nearby Shops Rail */}
                        {activeCategory === 'All' && quickShops.length > 0 && (
                            <div className="mb-10">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Shops Serving You</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                    {quickShops.map(shop => (
                                        <div key={shop.id} className="flex-shrink-0 w-64 bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                            <img src={shop.image} alt={shop.name} className="w-16 h-16 rounded-xl object-cover" />
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{shop.name}</h4>
                                                <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                                                    <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                                    {shop.eta} • {shop.distanceKm} km
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Product Rails */}
                        {activeCategory === 'All' && quickMeta && (
                            <div className="space-y-10 mb-12">
                                {quickMeta.milk?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Milk</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.milk)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quickMeta.breadAndButter?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Bread & Butter</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.breadAndButter)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quickMeta.eggs?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Eggs</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.eggs)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quickMeta.snacks?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Snacks</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.snacks)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quickMeta.coldDrinks?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cold Drinks</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.coldDrinks)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quickMeta.iceCream?.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Ice Cream</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                                            <div className="flex gap-4 min-w-max">
                                                {renderProductCards(quickMeta.iceCream)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Product Grid / Loading State */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900">
                        {activePhase === 'SHOPPING' 
                            ? (activeCategory === 'All' ? (searchQuery ? `Search Results` : `All Products`) : `${activeCategory} Products`) 
                            : `${activePhase === 'QUICK' ? 'Quick Delivery' : 'Fresh Farm'} Products`}
                    </h2>
                    {activePhase === 'SHOPPING' && metaData.categoryCounts[activeCategory] && !searchQuery && (
                        <span className="text-gray-500 font-semibold">{metaData.categoryCounts[activeCategory]} items</span>
                    )}
                </div>

                {isLoading || (isSearching && searchQuery.length > 0) ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl h-72 border border-gray-100 animate-pulse overflow-hidden">
                                <div className="h-40 bg-gray-200 w-full mb-4"></div>
                                <div className="px-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 && queryCompleted ? (
                    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto mt-6">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">No products found</h3>
                        <p className="text-gray-500 mb-8">Try adjusting your search or switching to "All" categories.</p>
                        <button 
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); setPage(1); }} 
                            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Reset Search & Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {renderProductCards(products)}
                        {hasMore && products.length > 0 && !isSearching && (
                            <div className="flex justify-center mt-12 mb-8">
                                <button 
                                    onClick={handleLoadMore}
                                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
                                >
                                    Load More Products
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Marketplace;
