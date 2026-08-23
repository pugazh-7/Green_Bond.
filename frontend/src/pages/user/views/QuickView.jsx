import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../../../components/product/ProductCard';
import toast from 'react-hot-toast';
import { resolveIcon, resolveCategoryIcon } from '../../../utils/iconRegistry';

import CategorySection from '../../../components/marketplace/CategorySection';
import CategoryNav from '../../../components/marketplace/CategoryNav';

const CATEGORIES = [
    'All', 'Daily Essentials', 'Milk & Dairy', 'Bakery', 'Snacks', 
    'Drinks', 'Grocery', 'Personal Care', 'Household', 
    'Mobile Accessories', 'Electronics', 'Gifts', 'Mobiles', 'Fashion Essentials'
];

const QuickView = ({ location, searchQuery, setIsSearching }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [meta, setMeta] = useState({ 
        categoryProducts: {},
        categoryCounts: {}
    });

    const observer = useRef();
    const lastProductElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, { rootMargin: '200px' });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                // Ensure meta gets correct location parameters if available
                let url = `${import.meta.env.VITE_API_URL || ''}/api/marketplace/quick-meta?`;
                if (location?.lat) {
                    url += `lat=${location.lat}&lng=${location.lng}`;
                }
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setMeta(data);
                }
            } catch (e) {
                console.error("Meta fetch error", e);
            }
        };
        fetchMeta();
    }, [location]);

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
            setProducts([]);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, setIsSearching]);

    useEffect(() => {
        setPage(1);
        setProducts([]);
        setError(null);
    }, [activeCategory]);

    useEffect(() => {
        if (!location?.lat) return;

        const fetchProducts = async () => {
            if (page === 1) setIsLoading(true);
            setIsSearching(true);
            setError(null);
            try {
                let url = `${import.meta.env.VITE_API_URL || ''}/api/marketplace/quick?lat=${location.lat}&lng=${location.lng}&page=${page}&limit=20`;
                
                if (location.pincode) {
                    url += `&pincode=${encodeURIComponent(location.pincode)}`;
                }

                if (debouncedSearch) {
                    url += `&q=${encodeURIComponent(debouncedSearch)}`;
                }
                
                if (activeCategory !== 'All') {
                    url += `&category=${encodeURIComponent(activeCategory)}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const newProducts = data?.products || [];
                    const isLastPage = (data?.pagination?.page || 1) >= (data?.pagination?.totalPages || 1);
                    
                    setProducts(prev => page === 1 ? newProducts : [...prev, ...newProducts]);
                    setHasMore(!isLastPage);
                } else {
                    setError('Unable to load products. Server returned ' + res.status);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError('Network error. Unable to load products.');
            } finally {
                setIsLoading(false);
                setIsSearching(false);
            }
        };

        fetchProducts();
    }, [location, page, debouncedSearch, activeCategory, setIsSearching]);

    const addToCart = (product) => {
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
            cart.push({ ...product, quantity: 1, cartType: 'QUICK' });
        }
        
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.name || product.title} to Cart`);
        window.dispatchEvent(new Event('storage')); 
    };

    const handleCategoryNavClick = (cat) => {
        if (activeCategory === 'All' && !debouncedSearch) {
            if (cat === 'All') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const el = document.getElementById(`section-${cat}`);
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
            } else {
                setActiveCategory(cat);
            }
        } else {
            setActiveCategory(cat);
        }
    };

    const handleSeeAll = (cat) => {
        setActiveCategory(cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="animate-slide-up">
            {/* Quick Delivery Banner */}
            <div className="px-4 md:px-8 mb-6">
                <div className="bg-purple-100 border border-purple-200 rounded-3xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden text-purple-500">
                            {React.createElement(resolveIcon('quick'), { className: "w-8 h-8" })}
                        </div>
                        <div>
                            <h3 className="font-bold text-purple-900 leading-tight">Delivery in 10-15 mins</h3>
                            <p className="text-xs text-purple-700 font-medium">From nearby registered shops</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Category Rail */}
            <CategoryNav 
                categories={CATEGORIES} 
                activeCategory={activeCategory} 
                onSelectCategory={handleCategoryNavClick} 
            />

            {/* Banners & Rails Area */}
            {activeCategory === 'All' && !debouncedSearch && (
                <>
                    {CATEGORIES.filter(cat => cat !== 'All').map(cat => {
                        const catProducts = meta.categoryProducts?.[cat];
                        if (!catProducts || catProducts.length === 0) return null;
                        return (
                            <CategorySection 
                                key={cat}
                                id={`section-${cat}`}
                                category={cat}
                                subtitle="In 10-15 minutes"
                                products={catProducts}
                                count={meta.categoryCounts?.[cat] || catProducts.length}
                                onSeeAll={handleSeeAll}
                                onAddToCart={addToCart}
                                isQuick={true} // Add visual distinction if necessary
                            />
                        );
                    })}
                </>
            )}

            {/* Products Grid */}
            <div className="px-4 md:px-8 pb-12">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 font-heading mb-4">
                    {activeCategory !== 'All' ? activeCategory : debouncedSearch ? 'Search Results' : 'All Products'}
                </h2>
                {isLoading && page === 1 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to load products</h3>
                        <p className="text-gray-500 text-sm mb-6">{error}</p>
                        <button onClick={() => setPage(1)} className="px-6 py-2.5 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                            {products.map(product => (
                                <ProductCard 
                                    key={product._id} 
                                    product={product} 
                                    variant="quick" 
                                    onAddToCart={addToCart} 
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div ref={lastProductElementRef} className="h-20 mt-6 flex items-center justify-center">
                                {isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <span className="text-6xl mb-4 block">🏬</span>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No quick items found</h3>
                        <p className="text-gray-500 text-sm">We couldn't find items for immediate delivery.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickView;
