import React, { useState, useEffect } from 'react';
import ProductCard from '../../../components/product/ProductCard';
import toast from 'react-hot-toast';

const UnifiedSearchView = ({ searchQuery, location }) => {
    const [results, setResults] = useState({ shopping: [], quick: [], fresh: [] });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!searchQuery) return;

        const fetchResults = async () => {
            setIsLoading(true);
            const query = encodeURIComponent(searchQuery);
            let latlng = '';
            if (location?.lat) {
                latlng = `&lat=${location.lat}&lng=${location.lng}`;
            }

            try {
                const baseUrl = import.meta.env.VITE_API_URL || '';
                const [shopRes, quickRes, freshRes] = await Promise.all([
                    fetch(`${baseUrl}/api/marketplace/products?marketplaceType=SHOPPING&q=${query}&limit=6${latlng}`).then(res => res.ok ? res.json() : null).catch(() => null),
                    fetch(`${baseUrl}/api/marketplace/quick?q=${query}&limit=6${latlng}`).then(res => res.ok ? res.json() : null).catch(() => null),
                    fetch(`${baseUrl}/api/marketplace/fresh?q=${query}&limit=6${latlng}`).then(res => res.ok ? res.json() : null).catch(() => null)
                ]);

                setResults({
                    shopping: shopRes?.products || [],
                    quick: quickRes?.products || [],
                    fresh: freshRes?.products || []
                });
            } catch (err) {
                console.error("Search fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

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

    const { shopping, quick, fresh } = results;
    const hasResults = shopping.length > 0 || quick.length > 0 || fresh.length > 0;

    if (!hasResults && searchQuery) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 mx-4 md:mx-8 mt-4">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
                <p className="text-gray-500 text-sm">We couldn't find anything matching "{searchQuery}".</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up px-4 md:px-8 pb-12 pt-2">
            {quick.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-black text-purple-900 font-heading mb-4 flex items-center gap-2">
                        <span className="bg-purple-100 p-1 rounded-md">⚡</span> Quick <span className="text-sm text-gray-400 font-medium ml-2">in 10-15 mins</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                        {quick.map(product => (
                            <ProductCard key={`quick-${product._id}`} product={product} variant="quick" onAddToCart={(p) => addToCart(p, 'QUICK')} />
                        ))}
                    </div>
                </div>
            )}

            {shopping.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-black text-gray-900 font-heading mb-4 flex items-center gap-2">
                        <span className="bg-gray-100 p-1 rounded-md">🛒</span> Shopping <span className="text-sm text-gray-400 font-medium ml-2">Best deals</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                        {shopping.map(product => (
                            <ProductCard key={`shop-${product._id}`} product={product} variant="shopping" onAddToCart={(p) => addToCart(p, 'SHOPPING')} />
                        ))}
                    </div>
                </div>
            )}

            {fresh.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-black text-green-900 font-heading mb-4 flex items-center gap-2">
                        <span className="bg-green-100 p-1 rounded-md">🥬</span> Fresh <span className="text-sm text-gray-400 font-medium ml-2">Direct from farmers</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                        {fresh.map(product => (
                            <ProductCard key={`fresh-${product._id}`} product={product} variant="fresh" onAddToCart={(p) => addToCart(p, 'FRESH')} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedSearchView;
