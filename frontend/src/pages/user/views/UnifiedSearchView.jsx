import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '../../../components/product/ProductCard';
import EmptyState from '../../../components/shared/EmptyState';
import toast from 'react-hot-toast';

const UnifiedSearchView = ({ searchQuery, location, activePhase }) => {
    const [results, setResults] = useState({ shopping: [], quick: [], fresh: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Filter & Sort State
    const [sortBy, setSortBy] = useState('relevance');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        marketplace: 'All',
        category: 'All',
        maxPrice: 10000,
        minRating: 0
    });

    const fetchResults = async () => {
        setIsLoading(true);
        setHasError(false);
        const query = encodeURIComponent(searchQuery);
        let latlng = '';
        if (location?.lat) {
            latlng = `&lat=${location.lat}&lng=${location.lng}`;
        }

        try {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const limit = 50; // Increased limit for better client-side filtering/sorting
            const [shopRes, quickRes, freshRes] = await Promise.all([
                fetch(`${baseUrl}/api/marketplace/products?marketplaceType=SHOPPING&q=${query}&limit=${limit}${latlng}`).then(res => res.ok ? res.json() : null),
                fetch(`${baseUrl}/api/marketplace/quick?q=${query}&limit=${limit}${latlng}`).then(res => res.ok ? res.json() : null),
                fetch(`${baseUrl}/api/marketplace/fresh?q=${query}&limit=${limit}${latlng}`).then(res => res.ok ? res.json() : null)
            ]);

            if (shopRes === null && quickRes === null && freshRes === null) {
                throw new Error("API Failure");
            }

            setResults({
                shopping: shopRes?.products || [],
                quick: quickRes?.products || [],
                fresh: freshRes?.products || []
            });
        } catch (err) {
            console.error("Search fetch error:", err);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!searchQuery) return;
        const timer = setTimeout(() => {
            fetchResults();
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [searchQuery, location]);

    const addToCart = (product, cartType) => {
        let cart = [];
        try {
            const stored = localStorage.getItem('user_cart');
            cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
        } catch (e) {
            cart = [];
        }
        const existingItem = cart.find(item => item._id === product._id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1, cartType });
        }
        
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.name || product.title} to Cart`);
        window.dispatchEvent(new Event('storage')); 
    };

    // Aggregate and filter
    const filteredAndSortedProducts = useMemo(() => {
        let allProducts = [];
        // Apply marketplace-aware prioritization
        if (activePhase === 'QUICK') {
            allProducts = [...results.quick, ...results.fresh, ...results.shopping];
        } else if (activePhase === 'FRESH') {
            allProducts = [...results.fresh, ...results.quick, ...results.shopping];
        } else {
            allProducts = [...results.shopping, ...results.quick, ...results.fresh];
        }

        // Remove duplicates by ID in case products overlap across endpoints
        const uniqueProducts = [];
        const seenIds = new Set();
        for (const p of allProducts) {
            if (!seenIds.has(p._id)) {
                seenIds.add(p._id);
                // Assign a virtual property for filtering by marketplace
                let mType = 'SHOPPING';
                if (results.quick.some(q => q._id === p._id)) mType = 'QUICK';
                else if (results.fresh.some(f => f._id === p._id)) mType = 'FRESH';
                p._marketplace = mType;
                uniqueProducts.push(p);
            }
        }

        // Apply filters
        let filtered = uniqueProducts.filter(p => {
            if (filters.marketplace !== 'All' && p._marketplace !== filters.marketplace) return false;
            if (filters.category !== 'All' && p.category !== filters.category) return false;
            if (p.price > filters.maxPrice) return false;
            if (filters.minRating > 0 && (p.rating || 0) < filters.minRating) return false;
            return true;
        });

        // Apply sort
        filtered.sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'discount') return (b.discountPercentage || 0) - (a.discountPercentage || 0);
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            // Default to 'relevance' which is the order they came in from the API (already textScore sorted ideally)
            return 0;
        });

        return filtered;
    }, [results, filters, sortBy, activePhase]);

    // Extract available categories for the filter dropdown
    const availableCategories = useMemo(() => {
        const cats = new Set();
        [...results.shopping, ...results.quick, ...results.fresh].forEach(p => {
            if (p.category) cats.add(p.category);
        });
        return ['All', ...Array.from(cats)].sort();
    }, [results]);

    if (isLoading) {
        return (
            <div className="animate-slide-up px-4 md:px-8 pb-12 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="px-4 md:px-8 mt-8">
                <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Couldn't load products</h3>
                    <p className="text-gray-500 text-sm mb-6">Network or API failure occurred.</p>
                    <button onClick={fetchResults} className="px-6 py-2 bg-green-600 text-white rounded-xl font-medium active:scale-95 transition-transform">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (filteredAndSortedProducts.length === 0 && searchQuery) {
        return (
            <div className="px-4 md:px-8 mt-8">
                <EmptyState 
                    title="No exact match found"
                    message="Try searching for Milk, Rice, Tomato, Snacks, or Mobile Accessories."
                    icon="🔍"
                />
            </div>
        );
    }

    return (
        <div className="animate-slide-up px-4 md:px-8 pb-12 pt-2">
            
            {/* Filter & Sort Bar */}
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-medium">Sort by:</span>
                    <select 
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none appearance-none cursor-pointer pr-4"
                    >
                        <option value="relevance">Relevance</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating">Rating</option>
                        <option value="discount">Discount</option>
                        <option value="newest">Newest</option>
                    </select>
                </div>
                
                <button 
                    onClick={() => setShowFilters(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    <span className="text-sm font-bold text-gray-700">Filters</span>
                </button>
            </div>

            {/* Results Grid */}
            <div className="mb-8">
                <h2 className="text-xl font-black text-gray-900 font-heading mb-4">
                    Search Results <span className="text-sm text-gray-400 font-medium ml-2">({filteredAndSortedProducts.length} items)</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                    {filteredAndSortedProducts.map(product => {
                        // Pass appropriate variant to ProductCard based on its actual source or the active search
                        let variant = 'shopping';
                        if (product._marketplace === 'QUICK') variant = 'quick';
                        if (product._marketplace === 'FRESH') variant = 'fresh';
                        
                        return (
                            <ProductCard 
                                key={`res-${product._id}`} 
                                product={product} 
                                variant={variant} 
                                onAddToCart={(p) => addToCart(p, product._marketplace)} 
                            />
                        )
                    })}
                </div>
            </div>

            {/* Mobile Filter Bottom Sheet */}
            {showFilters && (
                <div className="fixed inset-0 z-50 flex justify-center items-end bg-black/40" onClick={() => setShowFilters(false)}>
                    <div 
                        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-safe animate-slide-up"
                        onClick={e => e.stopPropagation()} // Prevent close when clicking inside
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-heading">Filters</h3>
                            <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* Marketplace Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Marketplace</label>
                                <div className="flex gap-2">
                                    {['All', 'SHOPPING', 'QUICK', 'FRESH'].map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setFilters({...filters, marketplace: m})}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors flex-1 ${filters.marketplace === m ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'}`}
                                        >
                                            {m === 'All' ? 'All' : m === 'SHOPPING' ? 'Shopping' : m === 'QUICK' ? 'Quick' : 'Fresh'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                <select 
                                    value={filters.category}
                                    onChange={e => setFilters({...filters, category: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block p-3 outline-none"
                                >
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                                    <span>Max Price</span>
                                    <span className="text-green-600">₹{filters.maxPrice}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="10000" 
                                    step="10"
                                    value={filters.maxPrice}
                                    onChange={e => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                            </div>
                            
                            {/* Rating Filter */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Minimum Rating</label>
                                <div className="flex gap-2">
                                    {[0, 3, 4, 4.5].map(r => (
                                        <button 
                                            key={r}
                                            onClick={() => setFilters({...filters, minRating: r})}
                                            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors flex-1 ${filters.minRating === r ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                                        >
                                            {r === 0 ? 'Any' : `${r}★+`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-4">
                            <button 
                                onClick={() => setFilters({ marketplace: 'All', category: 'All', maxPrice: 10000, minRating: 0 })}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl flex-1 active:bg-gray-200"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={() => setShowFilters(false)}
                                className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl flex-1 shadow-md active:bg-green-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedSearchView;
