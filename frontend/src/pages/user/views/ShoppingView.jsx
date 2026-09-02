import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../../../components/product/ProductCard';
import toast from 'react-hot-toast';
import { resolveCategoryIcon } from '../../../utils/iconRegistry';
import CategorySection from '../../../components/marketplace/CategorySection';
import CategoryNav from '../../../components/marketplace/CategoryNav';
import EmptyState from '../../../components/shared/EmptyState';

const CATEGORIES = [
    'All', 'Fashion', 'Men', 'Women', 'Kids', 
    'Footwear', 'Grocery', 'Snacks', 'Drinks', 'Beauty', 'Personal Care', 
    'Household'
];

const ShoppingView = ({ location, searchQuery, setIsSearching }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [isFallback, setIsFallback] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [meta, setMeta] = useState({ 
        bestDeals: [], 
        newArrivals: [], 
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
        }, { rootMargin: '200px' }); // Trigger a bit before they hit the absolute bottom
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/shopping-meta`);
                if (res.ok) {
                    const data = await res.json();
                    setMeta(data);
                }
            } catch (e) {
                console.error("Meta fetch error", e);
            }
        };
        fetchMeta();
    }, []);

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
        setIsFallback(false);
    }, [activeCategory]);

    useEffect(() => {
        if (!location?.lat) return;

        const fetchProducts = async () => {
            if (page === 1) setIsLoading(true);
            setIsSearching(true);
            setError(null);
            
            try {
                let url = `${import.meta.env.VITE_API_URL || ''}/api/marketplace/products?lat=${location.lat}&lng=${location.lng}&page=${page}&limit=20`;
                
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
                    let newProducts = data?.products || [];
                    let isLastPage = (data?.pagination?.page || 1) >= (data?.pagination?.totalPages || 1);
                    
                    // Search Fallback Logic
                    if (debouncedSearch && newProducts.length === 0 && page === 1) {
                        setIsFallback(true);
                        // Fetch popular products without search query
                        let fallbackUrl = `${import.meta.env.VITE_API_URL || ''}/api/marketplace/products?lat=${location.lat}&lng=${location.lng}&page=1&limit=12`;
                        if (location.pincode) {
                            fallbackUrl += `&pincode=${encodeURIComponent(location.pincode)}`;
                        }
                        if (activeCategory !== 'All') {
                            fallbackUrl += `&category=${encodeURIComponent(activeCategory)}`;
                        }
                        const fallbackRes = await fetch(fallbackUrl);
                        if (fallbackRes.ok) {
                            const fallbackData = await fallbackRes.json();
                            newProducts = fallbackData?.products || [];
                            isLastPage = true;
                        }
                    } else if (page === 1) {
                        setIsFallback(false);
                    }
                    
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
            // Tag item with marketplace type for cart rendering separation
            cart.push({ ...product, quantity: 1, cartType: 'SHOPPING' });
        }
        
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.name || product.title} to Cart`);
        // Dispatch custom event to update Layout instantly
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
            {/* Horizontal Category Rail */}
            <CategoryNav 
                categories={CATEGORIES} 
                activeCategory={activeCategory} 
                onSelectCategory={handleCategoryNavClick} 
            />

            {/* Banners Area */}
            {activeCategory === 'All' && !debouncedSearch && (
                <>
                    <div className="px-4 md:px-8 mb-8 mt-2">
                        <h1 className="text-xl md:text-3xl font-black text-gray-900 font-heading mb-4 leading-tight">
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋 <br />
                            <span className="text-gray-500 text-lg md:text-2xl font-semibold">What are you looking for today?</span>
                        </h1>
                        <div className="w-full h-40 md:h-64 rounded-3xl bg-gradient-to-br from-green-500 to-green-700 p-6 md:p-10 flex flex-col justify-center relative overflow-hidden shadow-lg">
                            <div className="relative z-10">
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest mb-2 inline-block">Mega Savings</span>
                                <h2 className="text-white text-2xl md:text-4xl font-heading font-black max-w-[60%] leading-tight">Up to 40% OFF<br/>Everyday Essentials</h2>
                            </div>
                            {/* Decorative Circle */}
                            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                        </div>
                    </div>

                    <CategorySection 
                        id="section-Trending Now"
                        category="Trending Now" 
                        subtitle="Biggest discounts on top products"
                        products={meta.bestDeals}
                        count={meta.bestDeals.length}
                        onSeeAll={() => handleSeeAll('All')}
                        onAddToCart={addToCart}
                        isPriority={true}
                    />

                    {CATEGORIES.filter(cat => cat !== 'All').map(cat => {
                        const catProducts = meta.categoryProducts?.[cat];
                        if (!catProducts || catProducts.length === 0) return null;
                        return (
                            <CategorySection 
                                key={cat}
                                id={`section-${cat}`}
                                category={cat}
                                subtitle="Curated picks just for you"
                                products={catProducts}
                                count={meta.categoryCounts?.[cat] || catProducts.length}
                                onSeeAll={handleSeeAll}
                                onAddToCart={addToCart}
                            />
                        );
                    })}
                    
                    <CategorySection 
                        id="section-New Arrivals"
                        category="New Arrivals" 
                        subtitle="Freshly added to the store"
                        products={meta.newArrivals}
                        count={meta.newArrivals.length}
                        onSeeAll={() => handleSeeAll('All')}
                        onAddToCart={addToCart}
                    />
                </>
            )}

            {/* Products Grid */}
            <div className="px-4 md:px-8 pb-12">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 font-heading mb-4">
                    {activeCategory !== 'All' ? activeCategory : debouncedSearch ? 'Search Results' : 'All Products'}
                </h2>
                
                {isLoading && page === 1 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                        {[...Array(12)].map((_, i) => (
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
                        <button onClick={() => setPage(1)} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : products.length > 0 ? (
                    <>
                        {isFallback && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3">
                                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <div>
                                    <h4 className="font-bold text-yellow-900">No exact match found</h4>
                                    <p className="text-sm text-yellow-800">You may also like these related products.</p>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-4">
                            {products.map(product => (
                                <ProductCard 
                                    key={product._id} 
                                    product={product} 
                                    variant="shopping" 
                                    onAddToCart={addToCart} 
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div ref={lastProductElementRef} className="h-20 mt-6 flex items-center justify-center">
                                {isLoading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>}
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState 
                        title="No products found"
                        message="We couldn't find anything matching your criteria."
                        icon="🛍️"
                    />
                )}
            </div>
        </div>
    );
};

export default ShoppingView;
