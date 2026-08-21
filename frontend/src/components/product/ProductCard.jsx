import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductCard = ({ product, variant = 'shopping', onAddToCart }) => {
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
                cart.push({ ...product, quantity: 1, cartType: variant === 'shopping' ? 'SHOPPING' : variant === 'quick' ? 'QUICK' : 'FRESH' });
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
            <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden p-4 flex items-center justify-center">
                <img 
                    src={product.image || fallbackImage} 
                    alt={product.name || product.title || 'Product'} 
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                />

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
                {variant === 'quick' && (
                    <div className="absolute bottom-2 right-2 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                        <span className="text-yellow-300">⚡</span> {eta}
                    </div>
                )}
                {variant === 'fresh' && (
                    <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                        <span className="text-white">🥬</span> Farm Direct
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="p-3.5 flex flex-col flex-1 bg-white">
                <div className="flex-1">
                    {/* Brand / Farmer Name */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 line-clamp-1">
                        {variant === 'fresh' ? `Farmer: ${product.farmerName || 'Kumar'}` : product.brand}
                    </p>
                    
                    {/* Title */}
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
                        {product.name || product.title || 'GreenBond Product'}
                    </h3>
                    
                    {/* Weight / Unit */}
                    <p className="text-xs text-gray-500 font-medium">
                        {product.unit || '1 unit'}
                    </p>
                    
                    {/* Stock Indicator */}
                    {product.availableQuantity > 0 && product.availableQuantity <= 5 && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">
                            Only {product.availableQuantity} left!
                        </p>
                    )}
                </div>

                {/* Footer section (Price & Add) */}
                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-gray-900 text-base font-heading">
                                ₹{product.price}
                            </span>
                            {product.originalPrice > product.price && (
                                <span className="text-xs text-gray-400 line-through font-medium">
                                    ₹{product.originalPrice}
                                </span>
                            )}
                        </div>
                        {/* Extra Context */}
                        {variant === 'shopping' && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                <span className="text-[10px] font-bold text-gray-600">{rating}</span>
                            </div>
                        )}
                        {variant === 'fresh' && (
                            <p className="text-[10px] text-green-700 font-semibold mt-0.5 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {distanceKm} km away
                            </p>
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
