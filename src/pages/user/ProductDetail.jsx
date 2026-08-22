import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductImage from '../../components/shared/ProductImage';

const ProductDetail = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    
    // Fallback if accessed directly without state (in a real app, fetch from backend)
    const product = state?.product;

    const [quantity, setQuantity] = useState(1);

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
                <span className="text-4xl mb-4">😕</span>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                <button onClick={() => navigate(-1)} className="bg-greenbond-600 text-white px-6 py-2 rounded-xl font-bold">Go Back</button>
            </div>
        );
    }

    const handleAddToCart = () => {
        const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
        const existing = cart.find(item => (item.id || item._id) === (product.id || product._id));
        if (existing) {
            existing.cartQuantity += quantity;
        } else {
            cart.push({ ...product, cartQuantity: quantity });
        }
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${quantity} to cart`);
        window.dispatchEvent(new Event('storage'));
        navigate(-1);
    };

    const isQuick = product.marketplaceType === 'QUICK' || product.eta;
    const isFresh = product.marketplaceType === 'FRESH' || product.farmer;

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans pb-24">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-start pt-safe-top">
                <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/80 backdrop-blur-md text-gray-800 rounded-full flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <button className="w-10 h-10 bg-white/80 backdrop-blur-md text-gray-800 rounded-full flex items-center justify-center shadow-sm">
                    ♡
                </button>
            </div>

            {/* Image */}
            <div className="w-full h-80 bg-gray-100 relative">
                <ProductImage product={product} className="w-full h-full object-contain" />
                {/* Badges */}
                <div className="absolute bottom-4 left-4 flex space-x-2 z-10">
                    {isQuick && <span className="bg-quick-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">⚡ 10-15 min</span>}
                    {isFresh && <span className="bg-fresh-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">🥬 Fresh Harvest</span>}
                    {product.discount && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">{product.discount}% OFF</span>}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 bg-white -mt-4 rounded-t-2xl relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        {product.brand && <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{product.brand}</p>}
                        <h1 className="text-xl font-bold font-display text-gray-900 leading-tight">{product.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">{product.unit || product.weight || '1 item'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₹{product.price}</p>
                        {product.originalPrice && <p className="text-sm text-gray-400 line-through">₹{product.originalPrice}</p>}
                    </div>
                </div>

                {/* Rating */}
                {product.rating && (
                    <div className="flex items-center space-x-1 mb-4">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm font-bold text-gray-700">{product.rating}</span>
                        <span className="text-xs text-gray-400">({product.reviews || Math.floor(Math.random() * 500)} reviews)</span>
                    </div>
                )}

                <div className="h-px bg-gray-100 my-4"></div>

                {/* Marketplace Specific Details */}
                {isFresh && product.farmer && (
                    <div className="bg-fresh-50 border border-fresh-100 p-4 rounded-xl mb-4 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-fresh-200 rounded-full flex items-center justify-center text-xl">👨‍🌾</div>
                        <div>
                            <p className="text-xs text-fresh-600 font-bold uppercase tracking-wide">Direct from Farmer</p>
                            <p className="font-bold text-gray-900">{product.farmer}</p>
                            <p className="text-xs text-gray-500">{product.village || 'Local Village'} • {product.distance || '12'} km away</p>
                        </div>
                    </div>
                )}

                {isQuick && product.shopName && (
                    <div className="bg-quick-50 border border-quick-100 p-4 rounded-xl mb-4 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-quick-200 rounded-full flex items-center justify-center text-xl">🏪</div>
                        <div>
                            <p className="text-xs text-quick-600 font-bold uppercase tracking-wide">Fulfilled by Shop</p>
                            <p className="font-bold text-gray-900">{product.shopName}</p>
                            <p className="text-xs text-gray-500">{product.distance || '2.5'} km away</p>
                        </div>
                    </div>
                )}

                <h3 className="font-bold text-gray-900 mb-2 font-display">Product Details</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {product.description || `Premium quality ${product.title} sourced and delivered directly to your doorstep. Guaranteed freshness and quality standard.`}
                </p>

                {/* Return Policy */}
                <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    <span className="text-xl">🛡️</span>
                    <div>
                        <p className="font-bold text-gray-900">GreenBond Guarantee</p>
                        <p className="text-xs">No questions asked return policy if quality is compromised.</p>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 flex items-center space-x-4">
                {/* Quantity Control */}
                <div className="flex items-center bg-gray-100 rounded-xl px-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-12 flex items-center justify-center text-gray-600 font-bold text-xl active:bg-gray-200 rounded-lg">-</button>
                    <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-12 flex items-center justify-center text-gray-600 font-bold text-xl active:bg-gray-200 rounded-lg">+</button>
                </div>
                
                {/* Add to Cart */}
                <button 
                    onClick={handleAddToCart}
                    className={`flex-1 text-white font-bold h-12 rounded-xl flex justify-center items-center px-4 active:scale-95 transition-transform shadow-lg ${isQuick ? 'bg-quick-600' : isFresh ? 'bg-fresh-600' : 'bg-greenbond-600'}`}
                >
                    Add {quantity > 1 ? `${quantity} items` : 'to Cart'} • ₹{product.price * quantity}
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;
