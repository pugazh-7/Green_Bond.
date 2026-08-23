import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resolveIcon } from '../../utils/iconRegistry';
import ProductImage from './ProductImage';

const ProductCard = ({ product, variant = 'shopping', onAddToCart, priority = false }) => {
    const navigate = useNavigate();
    
    // Safety check
    if (!product) return null;

    const discountStr = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : '';
    const safeRating = Number(product.rating);
    const rating = (!isNaN(safeRating) ? safeRating : 4.0).toFixed(1);
    
    // Extract ETA / Distance safely
    const safeDistance = Number(product.distanceKm);
    const distanceKm = (!isNaN(safeDistance) ? safeDistance : 1.2).toFixed(1);
    const eta = product.eta || (variant === 'quick' ? '10-15 min' : '2 days');
    const fallbackImage = 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=500&auto=format&fit=crop';
    
    // Parse numeric price to avoid ₹₹40/kg when DB already has string formats
    const rawPrice = product.price;
    const numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 0);
    const displayPrice = product.mrp || `₹${numericPrice}/${product.unit || 'kg'}`;

    const [quantity, setQuantity] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const updateQuantityFromCart = () => {
        try {
            const stored = localStorage.getItem('user_cart');
            const cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const item = cart.find(i => i._id === product._id);
            setQuantity(item ? item.quantity : 0);
        } catch(e) {
            setQuantity(0);
        }
    };

    useEffect(() => {
        updateQuantityFromCart();
        window.addEventListener('storage', updateQuantityFromCart);
        return () => window.removeEventListener('storage', updateQuantityFromCart);
    }, [product._id]);

    const handleCardClick = () => {
        navigate(`/user/product/${product._id}`);
    };

    const toggleWishlist = (e) => {
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    };

    const handleQuantityChange = (e, change) => {
        e.stopPropagation();
        try {
            const stored = localStorage.getItem('user_cart');
            let cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const itemIndex = cart.findIndex(i => i._id === product._id);
            
            if (itemIndex > -1) {
                cart[itemIndex].quantity += change;
                if (cart[itemIndex].quantity <= 0) {
                    cart.splice(itemIndex, 1);
                    toast.success('Removed from cart');
                }
            } else if (change > 0) {
                const newCartType = variant === 'shopping' ? 'SHOPPING' : variant === 'quick' ? 'QUICK' : 'FRESH';
                const hasOtherType = cart.some(i => i.cartType && i.cartType !== newCartType);
                
                if (hasOtherType) {
                    if (!window.confirm(`This item is from the ${newCartType} delivery source, but your cart has items from other sources. Continue adding?`)) {
                        return;
                    }
                }
                
                cart.push({ ...product, quantity: 1, cartType: newCartType });
                toast.success('Added to cart');
            }
            
            localStorage.setItem('user_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
            updateQuantityFromCart();
        } catch(err) {
            console.error(err);
        }
    };

    return (
        <div 
            onClick={handleCardClick}
            className="premium-card flex flex-col h-full cursor-pointer overflow-hidden group relative hover:-translate-y-1 transition-transform duration-300"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden group">
                {/* Reusable Image Component */}
                <ProductImage product={product} priority={priority} />

                {/* Wishlist Button */}
                <button 
                    onClick={toggleWishlist}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm z-20 active:scale-90"
                >
                    <svg className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'fill-none stroke-currentColor'}`} viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>
                
                {/* Variant Specific Badges */}
                {variant === 'shopping' && discountStr && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg tracking-wider z-10 shadow-md">
                        {discountStr}
                    </div>
                )}
                {variant === 'quick' && (() => {
                    const QuickIcon = resolveIcon('quick');
                    return (
                        <div className="absolute bottom-2 right-2 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                            <QuickIcon className="w-3 h-3" /> {eta}
                        </div>
                    );
                })()}
                {variant === 'fresh' && (() => {
                    const FreshIcon = resolveIcon('fresh');
                    return (
                        <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                            <FreshIcon className="w-3 h-3" /> Farm Direct
                        </div>
                    );
                })()}
            </div>

            {/* Content Container */}
            <div className="p-3.5 flex flex-col flex-1 bg-white">
                <div className="flex-1">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2 mb-0.5">
                        {product.name || product.title || 'GreenBond Product'}
                    </h3>
                    
                    {/* Brand / Unit - don't show brand for Fresh if not needed */}
                    <p className="text-[11px] text-gray-500 font-medium mb-1">
                        {variant !== 'fresh' && product.brand && <span className="uppercase">{product.brand} • </span>}
                        {product.unit || '1 unit'}
                    </p>
                    
                    {/* Stock Indicator */}
                    {(product.stock > 0 || product.availableQuantity > 0) && (product.stock <= 5 || product.availableQuantity <= 5) && (
                        <p className="text-[10px] text-red-500 font-bold mb-1">
                            Only {product.stock !== undefined ? product.stock : (product.availableQuantity || 0)} left!
                        </p>
                    )}
                </div>

                {/* Footer section (Price & Add) */}
                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-gray-900 text-sm font-heading">
                                {displayPrice}
                            </span>
                            {product.mrp > numericPrice && (
                                <span className="text-[10px] text-gray-400 line-through font-medium">
                                    MRP ₹{product.mrp}
                                </span>
                            )}
                        </div>
                        {variant === 'shopping' && (
                            <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                <span className="text-[10px] font-bold text-gray-600">{rating}</span>
                            </div>
                        )}
                        {variant === 'quick' && (
                            <p className="text-[10px] text-purple-700 font-bold mt-1 flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded w-fit">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                {eta}
                            </p>
                        )}
                        {variant === 'fresh' && (
                            <div className="mt-1 flex flex-col gap-0.5">
                                <span className="text-[10px] text-green-700 font-bold flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded w-fit">
                                    <span className="text-xs">🥬</span> Fresh from Farmer
                                </span>
                                <span className="text-[9px] text-gray-500 font-medium">
                                    {product.farmer || 'Local Farmer'} • {product.location || 'Nearby'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-green-600 text-white rounded-xl shadow-md border border-green-700 w-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={(e) => handleQuantityChange(e, -1)} className="px-2 py-1.5 hover:bg-green-700 active:bg-green-800 transition-colors flex-1 flex justify-center font-bold text-lg leading-none">−</button>
                            <span className="font-bold text-sm px-1 min-w-[20px] text-center">{quantity}</span>
                            <button onClick={(e) => handleQuantityChange(e, 1)} className="px-2 py-1.5 hover:bg-green-700 active:bg-green-800 transition-colors flex-1 flex justify-center font-bold text-lg leading-none">+</button>
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => handleQuantityChange(e, 1)}
                            className="bg-green-50 text-green-700 font-bold text-sm px-4 py-1.5 rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-colors hover:shadow-md active:scale-95"
                        >
                            ADD
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
