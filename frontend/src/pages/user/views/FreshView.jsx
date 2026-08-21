import React, { useState, useEffect } from 'react';
import ProductCard from '../../../components/product/ProductCard';
import toast from 'react-hot-toast';

const CATEGORIES = [
    'All', 'Vegetables', 'Fruits', 'Greens', 'Spices', 'Grains'
];

const FreshView = ({ location, searchQuery, setIsSearching }) => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const [debouncedSearch, setDebouncedSearch] = useState('');

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
                let url = `${import.meta.env.VITE_API_URL || ''}/api/marketplace/fresh?lat=${location.lat}&lng=${location.lng}&page=${page}&limit=20`;
                
                if (debouncedSearch) {
                    url += `&q=${encodeURIComponent(debouncedSearch)}`;
                }
                
                if (activeCategory !== 'All') {
                    url += `&category=${encodeURIComponent(activeCategory)}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const newProducts = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : Array.isArray(data?.data?.products) ? data.data.products : Array.isArray(data?.data) ? data.data : [];
                    const isLastPage = Array.isArray(data) ? true : (data?.currentPage >= data?.totalPages);
                    
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
            cart.push({ ...product, quantity: 1, cartType: 'FRESH' });
        }
        
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.name || product.title} to Cart`);
        window.dispatchEvent(new Event('storage')); 
    };

    return (
        <div className="animate-slide-up">
            {/* Farm Direct Banner */}
            <div className="px-4 md:px-8 mb-6">
                <div className="bg-green-100 border border-green-200 rounded-3xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-2xl">🚜</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-green-900 leading-tight">Farm Direct Produce</h3>
                            <p className="text-xs text-green-700 font-medium">Straight from the harvest to you</p>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-green-200/50 to-transparent"></div>
                </div>
            </div>

            {/* Horizontal Category Rail */}
            <div className="px-4 md:px-8 mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2.5 rounded-2xl whitespace-nowrap text-sm font-bold transition-all ${activeCategory === cat ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            <div className="px-4 md:px-8 pb-12">
                {isLoading && page === 1 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                        {[...Array(6)].map((_, i) => (
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
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                            {products.map(product => (
                                <ProductCard 
                                    key={product._id} 
                                    product={product} 
                                    variant="fresh" 
                                    onAddToCart={addToCart} 
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="mt-10 text-center">
                                <button 
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                        <span className="text-6xl mb-4 block">🌱</span>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No fresh produce found</h3>
                        <p className="text-gray-500 text-sm">Farmers in your area haven't listed these items yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreshView;
