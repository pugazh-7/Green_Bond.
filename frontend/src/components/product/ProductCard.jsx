import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resolveIcon } from '../../utils/iconRegistry';
import ProductImage from './ProductImage';
import FreshOrderModal from '../marketplace/FreshOrderModal';

const ProductCard = ({ product, variant = 'shopping', onAddToCart, priority = false }) => {
    const navigate = useNavigate();
    
    if (!product) return null;

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderModalMode, setOrderModalMode] = useState('REGULAR');

    const discountStr = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : '';
    const safeRating = Number(product.rating);
    const rating = (!isNaN(safeRating) ? safeRating : 4.8).toFixed(1);
    
    // Extract ETA / Distance safely
    const safeDistance = Number(product.distanceKm);
    const distanceKm = (!isNaN(safeDistance) ? safeDistance : 1.2).toFixed(1);
    const eta = product.eta || (variant === 'quick' ? '10-15 min' : '2 days');
    
    // Parse numeric price to guarantee ₹40/kg format
    const rawPrice = product.price;
    const numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 0);
    const unitStr = product.unit || (variant === 'fresh' ? 'kg' : 'unit');
    const displayPrice = variant === 'fresh' 
        ? `₹${numericPrice}/${unitStr}` 
        : (product.mrp && String(product.mrp).includes('₹') ? product.mrp : `₹${numericPrice}`);

    const [quantity, setQuantity] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const updateQuantityFromCart = () => {
        try {
            const stored = localStorage.getItem('user_cart');
            const cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const item = cart.find(i => i._id === product._id || i.id === product.id || (i.cartId && i.cartId.startsWith(product._id)));
            setQuantity(item ? item.quantity : 0);
        } catch(e) {
            setQuantity(0);
        }
    };

    const checkWishlist = () => {
        try {
            const stored = localStorage.getItem('green_bond_wishlist');
            const list = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const exists = list.some(i => i._id === product._id || i.id === product.id);
            setIsWishlisted(exists);
        } catch(e) {
            setIsWishlisted(false);
        }
    };

    useEffect(() => {
        updateQuantityFromCart();
        checkWishlist();
        window.addEventListener('storage', updateQuantityFromCart);
        window.addEventListener('storage', checkWishlist);
        return () => {
            window.removeEventListener('storage', updateQuantityFromCart);
            window.removeEventListener('storage', checkWishlist);
        };
    }, [product._id, product.id]);

    const handleCardClick = () => {
        navigate(`/user/product/${product._id || product.id}`);
    };

    const toggleWishlist = (e) => {
        e.stopPropagation();
        try {
            const stored = localStorage.getItem('green_bond_wishlist');
            let list = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const index = list.findIndex(i => i._id === product._id || i.id === product.id);
            if (index > -1) {
                list.splice(index, 1);
                setIsWishlisted(false);
                toast.success('Removed from wishlist');
            } else {
                list.push(product);
                setIsWishlisted(true);
                toast.success('Added to wishlist');
            }
            localStorage.setItem('green_bond_wishlist', JSON.stringify(list));
            window.dispatchEvent(new Event('storage'));
        } catch(e) {
            console.error(e);
        }
    };

    const handleAddClick = (e, targetMode = 'REGULAR') => {
        e.stopPropagation();
        if (variant === 'fresh' || product.marketplaceType === 'FRESH' || product.sourceType === 'FARMER' || product.farmer) {
            setOrderModalMode(targetMode);
            setIsOrderModalOpen(true);
            return;
        }
        handleQuantityChange(e, 1);
    };

    const handleQuantityChange = (e, change) => {
        e.stopPropagation();
        try {
            const stored = localStorage.getItem('user_cart');
            let cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const itemIndex = cart.findIndex(i => i._id === product._id || i.id === product.id);
            
            if (itemIndex > -1) {
                cart[itemIndex].quantity += change;
                if (cart[itemIndex].quantity <= 0) {
                    cart.splice(itemIndex, 1);
                    toast.success('Removed from cart');
                }
            } else if (change > 0) {
                const newCartType = variant === 'shopping' ? 'SHOPPING' : variant === 'quick' ? 'QUICK' : 'FRESH';
                cart.push({ ...product, cartId: product._id || product.id, quantity: 1, cartType: newCartType });
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
        <>
            <div 
                onClick={handleCardClick}
                className="premium-card flex flex-col h-full cursor-pointer overflow-hidden group relative hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md"
            >
                {/* Image Container (Compact 1:1 Aspect Ratio) */}
                <div className="relative aspect-square w-full bg-gray-50/70 overflow-hidden group flex items-center justify-center p-2">
                    <ProductImage product={product} priority={priority} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />

                    {/* Wishlist Button with Black Border & Stroke */}
                    <button 
                        onClick={toggleWishlist}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/95 rounded-full flex items-center justify-center border border-black/25 shadow-xs hover:scale-110 transition-all z-20 active:scale-90"
                        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <svg className={`w-3 h-3 transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-600 stroke-2' : 'fill-none stroke-black stroke-[2.2]'}`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                    
                    {/* Variant Specific Badges */}
                    {variant === 'shopping' && discountStr && (
                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider z-10 shadow-xs">
                            {discountStr}
                        </div>
                    )}
                    {variant === 'quick' && (() => {
                        const QuickIcon = resolveIcon('quick');
                        return (
                            <div className="absolute bottom-1.5 right-1.5 bg-purple-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10 flex items-center gap-1 shadow-xs">
                                <QuickIcon className="w-2.5 h-2.5" /> {eta}
                            </div>
                        );
                    })()}
                    {variant === 'fresh' && (() => {
                        const FreshIcon = resolveIcon('fresh');
                        return (
                            <div className="absolute top-1.5 left-1.5 bg-green-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs z-10">
                                <FreshIcon className="w-2.5 h-2.5" /> Farm Direct
                            </div>
                        );
                    })()}
                </div>

                {/* Content Container */}
                <div className="p-2.5 flex flex-col flex-1 bg-white">
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="font-bold text-gray-900 text-[12px] leading-tight line-clamp-1 mb-0.5" title={product.name || product.title}>
                            {product.name || product.title || 'GreenBond Product'}
                        </h3>
                        
                        {/* Brand / Unit */}
                        <p className="text-[10px] text-gray-400 font-medium truncate mb-0.5">
                            {variant !== 'fresh' && product.brand && <span className="uppercase">{product.brand} • </span>}
                            {product.unit || '1 unit'}
                        </p>
                    </div>

                    {/* Footer section (Price & Add) */}
                    <div className="mt-1.5 pt-1.5 border-t border-gray-50 flex items-center justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-black text-gray-900 text-[13px] font-heading leading-tight">
                                    {displayPrice}
                                </span>
                            </div>
                            {variant === 'shopping' && (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                    <svg className="w-2.5 h-2.5 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    <span className="text-[9px] font-bold text-gray-500">{rating}</span>
                                </div>
                            )}
                            {variant === 'quick' && (
                                <span className="text-[9px] text-purple-700 font-bold block truncate">
                                    ⚡ {eta}
                                </span>
                            )}
                            {variant === 'fresh' && (
                                <span className="text-[9px] text-emerald-700 font-medium block truncate">
                                    🧑‍🌾 {product.farmer || 'Farmer'}
                                </span>
                            )}
                            {(product.isReturnable === true || product.category === 'Electronics' || product.category === 'Furniture') && (
                                <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/70 mt-0.5 inline-flex items-center gap-0.5 w-fit">
                                    🔄 7-Day Return
                                </span>
                            )}
                        </div>
                        
                        <div className="shrink-0">
                            {quantity > 0 && variant !== 'fresh' ? (
                                <div className="flex items-center justify-between bg-green-600 text-white rounded-lg shadow-xs border border-green-700 w-[68px] h-[28px] overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => handleQuantityChange(e, -1)} className="w-[22px] h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-xs leading-none">−</button>
                                    <span className="font-bold text-[11px] text-center flex-1">{quantity}</span>
                                    <button onClick={(e) => handleQuantityChange(e, 1)} className="w-[22px] h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-xs leading-none">+</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={(e) => handleAddClick(e, 'REGULAR')}
                                    className="bg-emerald-50 text-emerald-800 font-bold text-[11px] px-2.5 h-[28px] min-w-[48px] rounded-lg border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all hover:shadow-xs active:scale-95 flex items-center justify-center tracking-wide"
                                >
                                    {variant === 'fresh' && quantity > 0 ? `${quantity}` : 'ADD'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Fresh Order Selection Modal (Per Kg vs Bulk with custom decimal kg) */}
            <FreshOrderModal 
                product={product}
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                initialMode={orderModalMode}
            />
        </>
    );
};

export default ProductCard;
