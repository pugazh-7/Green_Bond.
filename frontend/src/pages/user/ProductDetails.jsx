import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ProductImage from '../../components/shared/ProductImage';
import { resolveIcon } from '../../utils/iconRegistry';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBulkOrdering, setIsBulkOrdering] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Assuming generic fetch for now, we find the product
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/products`);
                if (res.ok) {
                    const data = await res.json();
                    const products = data?.products || [];
                    const found = products.find(p => p.id === id || p._id === id);
                    if (found) {
                        setProduct(found);
                    } else {
                        toast.error("Product not found");
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const [quantity, setQuantity] = useState(0);

    const updateQuantityFromCart = () => {
        if (!product) return;
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
    }, [product]);

    const handleQuantityChange = (change) => {
        if (!product) return;
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
                let cartType = 'SHOPPING';
                if (product.sourceType === 'SHOP') cartType = 'QUICK';
                if (product.sourceType === 'FARMER') cartType = 'FRESH';
                cart.push({ ...product, quantity: 1, cartType });
                toast.success(`Added ${product.title || product.name} to cart`);
            }
            
            localStorage.setItem('user_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
            updateQuantityFromCart();
        } catch(err) {
            console.error(err);
        }
    };

    const handleBulkOrder = async () => {
        if (!product) return;
        setIsBulkOrdering(true);
        try {
            const requestedQuantity = parseInt(product.minOrder) || 10;
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('green_bond_token')}`
                },
                body: JSON.stringify({ productId: product._id, requestedQuantity })
            });
            if (res.ok) {
                toast.success('Bulk order inquiry sent to farmer!');
                navigate('/user/bulk-orders');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to submit bulk order.');
            }
        } catch (err) {
            toast.error('Network error submitting bulk order.');
        } finally {
            setIsBulkOrdering(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-6xl mb-4">🔍</span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">Product Not Found</h2>
                <p className="text-gray-500 mb-6">This product might be out of stock or removed.</p>
                <button onClick={() => navigate('/user')} className="bg-gray-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-gray-800 transition-colors">Return Home</button>
            </div>
        );
    }

    const cartType = product.sourceType === 'SHOP' ? 'QUICK' : product.sourceType === 'FARMER' ? 'FRESH' : 'SHOPPING';
    const safeRating = Number(product.rating);
    const rating = (!isNaN(safeRating) ? safeRating : 4.0).toFixed(1);
    
    // Parse numeric price for calculation display
    const rawPrice = product.price;
    const numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 0);
    const subtotal = numericPrice * (quantity > 0 ? quantity : 1);
    
    // Format Display string
    const displayPrice = product.mrp || `₹${numericPrice}/${product.unit || 'kg'}`;

    return (
        <div className="min-h-screen bg-white md:bg-gray-50 pb-24 md:pb-8 animate-slide-up">
            {/* Mobile Header (Hidden on Desktop usually, but good for back nav) */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <button onClick={() => navigate('/user/cart')} className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700 hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </button>
            </header>

            <main className="max-w-5xl mx-auto md:mt-8">
                <div className="bg-white md:rounded-3xl md:shadow-sm md:border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Image Section */}
                    <div className="w-full md:w-1/2 bg-gray-50/80 p-8 flex items-center justify-center relative min-h-[350px] md:min-h-[500px]">
                        {product.discountPercentage > 0 && cartType === 'SHOPPING' && (
                            <div className="absolute top-6 left-6 z-10 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm tracking-wider">
                                {product.discountPercentage}% OFF
                            </div>
                        )}
                        <ProductImage 
                            product={product} 
                            className="max-w-[80%] max-h-[400px] object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" 
                        />
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
                        
                        {/* Context Badge */}
                        <div className="mb-4 flex flex-wrap gap-2">
                            {cartType === 'QUICK' && (
                                <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full">
                                    {React.createElement(resolveIcon('quick'), { className: "w-4 h-4 rounded-full" })} Delivery in 10-15 mins
                                </span>
                            )}
                            {cartType === 'FRESH' && (
                                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
                                    {React.createElement(resolveIcon('fresh'), { className: "w-4 h-4 rounded-full" })} Farm Direct Produce
                                </span>
                            )}
                            {cartType === 'SHOPPING' && (
                                <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                                    {React.createElement(resolveIcon('shopping'), { className: "w-4 h-4 rounded-full" })} Standard Delivery
                                </span>
                            )}
                        </div>

                        {/* Title & Brand */}
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                            {cartType === 'FRESH' ? `Farmer: ${product.farmerName || 'Local Farmer'}` : product.brand}
                        </p>
                        <h1 className="text-2xl md:text-3xl font-black font-heading text-gray-900 leading-tight mb-2">
                            {product.title || product.name}
                        </h1>
                        <p className="text-gray-500 font-medium mb-4">{product.unit || '1 Unit'}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-yellow-400 px-2 py-0.5 rounded flex items-center gap-1">
                                <span className="text-xs font-bold text-yellow-900">{rating}</span>
                                <svg className="w-3 h-3 text-yellow-900 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">(24 reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-end gap-3 mb-8">
                            <span className="text-4xl font-black font-heading text-gray-900">
                                {displayPrice}
                            </span>
                            {product.originalPrice > numericPrice && (
                                <span className="text-lg text-gray-400 line-through font-semibold mb-1">
                                    ₹{product.originalPrice}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 mb-2">Product Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {product.description || "Premium quality product carefully sourced for you. High quality standards maintained."}
                            </p>
                        </div>

                        {/* Seller Context */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-xl shadow-sm">
                                {cartType === 'FRESH' ? '🧑‍🌾' : cartType === 'QUICK' ? '🏬' : '📦'}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-sm">
                                    {cartType === 'FRESH' ? `Sourced from ${product.farmer || 'a local farmer'}` : 
                                     cartType === 'QUICK' ? 'Sold by Nearby Partner Shop' : 
                                     'Fulfilled by GreenBond'}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    {cartType === 'FRESH' ? `Harvested in ${product.location || 'Local Village'}, checked for quality.` : 
                                     cartType === 'QUICK' ? 'Packed instantly upon order.' : 
                                     'Standard quality checks applied.'}
                                </p>
                            </div>
                        </div>

                        {/* Add to Cart Area */}
                        <div className="mt-auto pt-6 border-t border-gray-100 flex gap-4 hidden md:flex flex-col md:flex-row">
                            {quantity > 0 ? (
                                <div className="flex-1 flex items-center justify-between bg-green-600 text-white rounded-2xl shadow-lg border border-green-700 h-14 overflow-hidden">
                                    <button onClick={() => handleQuantityChange(-1)} className="px-6 h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-2xl">−</button>
                                    <span className="font-bold text-xl">{quantity} {product.unit || 'kg'} (₹{subtotal})</span>
                                    <button onClick={() => handleQuantityChange(1)} className="px-6 h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-2xl">+</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleQuantityChange(1)}
                                    className="flex-1 bg-green-600 text-white font-bold text-lg rounded-2xl hover:bg-green-700 transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 h-14"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Add to Cart
                                </button>
                            )}
                            
                            {cartType === 'FRESH' && product.orderType === 'bulk' && (
                                <button 
                                    onClick={handleBulkOrder}
                                    disabled={isBulkOrdering}
                                    className="flex-1 bg-white text-green-700 border-2 border-green-600 font-bold text-lg rounded-2xl hover:bg-green-50 transition-all active:scale-95 flex items-center justify-center gap-2 h-14"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    {isBulkOrdering ? 'Sending...' : 'Bulk Order'}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </main>

            {/* Mobile Sticky Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden z-50 flex items-center gap-4">
                <div className="flex-1">
                    <span className="text-2xl font-black font-heading text-gray-900 block">₹{subtotal}</span>
                    <span className="text-xs text-green-600 font-bold">Free Delivery</span>
                </div>
                {cartType === 'FRESH' && product.orderType === 'bulk' && quantity === 0 && (
                    <button 
                        onClick={handleBulkOrder}
                        disabled={isBulkOrdering}
                        className="px-3 bg-white text-green-700 border border-green-600 font-bold text-xs h-12 rounded-xl hover:bg-green-50 flex items-center justify-center whitespace-nowrap"
                    >
                        Bulk Order
                    </button>
                )}
                {quantity > 0 ? (
                    <div className="flex-1 flex items-center justify-between bg-green-600 text-white rounded-xl shadow-md border border-green-700 h-12 overflow-hidden">
                        <button onClick={() => handleQuantityChange(-1)} className="px-4 h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-xl">−</button>
                        <span className="font-bold text-sm whitespace-nowrap px-1">{quantity} {product.unit || 'kg'}</span>
                        <button onClick={() => handleQuantityChange(1)} className="px-4 h-full hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center font-bold text-xl">+</button>
                    </div>
                ) : (
                    <button 
                        onClick={() => handleQuantityChange(1)}
                        className="flex-1 bg-green-600 text-white font-bold text-sm h-12 rounded-xl hover:bg-green-700 transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                        ADD
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductDetails;
