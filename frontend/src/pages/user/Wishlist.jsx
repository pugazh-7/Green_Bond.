import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/product/ProductCard';

const Wishlist = () => {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState([]);

    const loadWishlist = () => {
        try {
            const stored = localStorage.getItem('green_bond_wishlist');
            const items = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            setWishlistItems(Array.isArray(items) ? items : []);
        } catch (e) {
            setWishlistItems([]);
        }
    };

    useEffect(() => {
        loadWishlist();
        window.addEventListener('storage', loadWishlist);
        return () => window.removeEventListener('storage', loadWishlist);
    }, []);

    const clearWishlist = () => {
        if (window.confirm("Are you sure you want to clear your wishlist?")) {
            localStorage.setItem('green_bond_wishlist', JSON.stringify([]));
            window.dispatchEvent(new Event('storage'));
            setWishlistItems([]);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">❤️</span>
                        <h1 className="text-2xl md:text-3xl font-black font-heading text-gray-900">
                            My Wishlist
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'saved item' : 'saved items'} ready to order
                    </p>
                </div>

                {wishlistItems.length > 0 && (
                    <button
                        type="button"
                        onClick={clearWishlist}
                        className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-4 py-2.5 rounded-xl transition-all self-start sm:self-center"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Content */}
            {wishlistItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 max-w-lg mx-auto mt-8">
                    <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-inner">
                        🤍
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 font-heading">Your wishlist is empty</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Explore fresh farm produce, quick delivery items, and shopping deals to save your favorites!
                    </p>
                    <button
                        onClick={() => navigate('/user')}
                        className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                    >
                        Explore Marketplace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
                    {wishlistItems.map((product) => {
                        const isFresh = product.marketplaceType === 'FRESH' || product.sourceType === 'FARMER' || product.farmer;
                        const isQuick = product.marketplaceType === 'QUICK' || product.sourceType === 'SHOP';
                        const variant = isFresh ? 'fresh' : isQuick ? 'quick' : 'shopping';
                        
                        return (
                            <ProductCard
                                key={product._id || product.id}
                                product={product}
                                variant={variant}
                            />
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default Wishlist;
