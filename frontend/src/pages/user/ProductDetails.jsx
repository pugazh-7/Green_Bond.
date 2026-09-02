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

    const [selectedBulkQty, setSelectedBulkQty] = useState('5 kg');

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/product/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.product) {
                        setProduct(data.product);
                        if (data.product.minOrder) {
                            setSelectedBulkQty(data.product.minOrder);
                        }
                    } else {
                        toast.error("Product not found");
                    }
                } else {
                    toast.error("Unable to load product");
                }
            } catch (err) {
                console.error(err);
                toast.error("Network error loading product");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    const [quantity, setQuantity] = useState(0);

    const updateQuantityFromCart = () => {
        if (!product) return;
        try {
            const stored = localStorage.getItem('user_cart');
            const cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
            const item = cart.find(i => i._id === product._id || i.id === product.id);
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
            const itemIndex = cart.findIndex(i => i._id === product._id || i.id === product.id);
            
            if (itemIndex > -1) {
                cart[itemIndex].quantity += change;
                if (cart[itemIndex].quantity <= 0) {
                    cart.splice(itemIndex, 1);
                    toast.success('Removed from cart');
                }
            } else if (change > 0) {
                let cartType = 'SHOPPING';
                if (product.sourceType === 'SHOP' || product.marketplaceType === 'QUICK') cartType = 'QUICK';
                if (product.sourceType === 'FARMER' || product.marketplaceType === 'FRESH') cartType = 'FRESH';
                cart.push({ ...product, cartId: product._id || product.id, quantity: 1, cartType });
                toast.success(`Added ${product.title || product.name} to cart`);
            }
            
            localStorage.setItem('user_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
            updateQuantityFromCart();
        } catch(err) {
            console.error(err);
        }
    };

    const handleBulkOrder = async (customQty) => {
        if (!product) return;
        setIsBulkOrdering(true);
        try {
            const qtyStr = customQty || selectedBulkQty || product.minOrder || '10';
            const requestedQuantity = parseInt(qtyStr.toString().replace(/[^0-9]/g, '')) || 10;
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('green_bond_token') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({ productId: product._id || product.id, requestedQuantity })
            });
            if (res.ok) {
                toast.success(`Bulk inquiry for ${qtyStr} sent to ${product.farmer || 'farmer'}!`);
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

    const cartType = (product.marketplaceType === 'FRESH' || product.sourceType === 'FARMER' || product.farmer) 
        ? 'FRESH' 
        : (product.marketplaceType === 'QUICK' || product.sourceType === 'SHOP') 
        ? 'QUICK' 
        : 'SHOPPING';

    const safeRating = Number(product.rating);
    const rating = (!isNaN(safeRating) ? safeRating : 4.8).toFixed(1);
    
    // Parse numeric price for calculation display
    const rawPrice = product.price;
    const numericPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 0);
    const subtotal = numericPrice * (quantity > 0 ? quantity : 1);
    
    // Format Display string
    const unitStr = product.unit || (cartType === 'FRESH' ? 'kg' : 'unit');
    const displayPrice = cartType === 'FRESH' 
        ? `₹${numericPrice}/${unitStr}` 
        : (product.mrp && product.mrp.includes('₹') ? product.mrp : `₹${numericPrice}`);

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
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4 flex items-start gap-4">
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

                        {/* Return & Warranty Policy */}
                        <div className="bg-white rounded-2xl p-3.5 border border-gray-100 mb-6 flex items-center gap-3 shadow-xs">
                            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm shrink-0">
                                {(product.isReturnable === true || product.category === 'Electronics' || product.category === 'Furniture') ? '🔄' : '🛡️'}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-xs">
                                    {(product.isReturnable === true || product.category === 'Electronics' || product.category === 'Furniture') 
                                        ? '7-Day Easy Return & Replacement' 
                                        : 'Non-Returnable Product'}
                                </h4>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {(product.isReturnable === true || product.category === 'Electronics' || product.category === 'Furniture') 
                                        ? 'Eligible for return or replacement within 7 days of delivery.' 
                                        : 'For safety & hygiene, this item cannot be returned.'}
                                </p>
                            </div>
                        </div>

                        {/* Order Mode & Custom Weight Selector for Farm Produce */}
                        {cartType === 'FRESH' && (
                            <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-100 mb-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🧑‍🌾</span>
                                        <h4 className="font-black text-emerald-950 text-base">Direct Farm Weight Selection</h4>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                                        ₹{numericPrice}/{product.unit || 'kg'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 block">
                                        Popular Weights / Sacks:
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {['0.5 kg', '1 kg', '1.5 kg', '5 kg', '10 kg', '25 kg', '50 kg'].map(qty => (
                                            <button
                                                key={qty}
                                                type="button"
                                                onClick={() => setSelectedBulkQty(qty)}
                                                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all border text-center ${
                                                    selectedBulkQty === qty 
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50'
                                                }`}
                                            >
                                                {qty}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Weight Input Field */}
                                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200">
                                    <label className="text-xs font-bold text-emerald-900 block mb-1.5">
                                        Custom Weight (e.g. 1.5, 2.5, 15 kg):
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            value={parseFloat(String(selectedBulkQty).replace(/[^0-9.]/g, '')) || 1}
                                            onChange={(e) => setSelectedBulkQty(`${e.target.value || 1} kg`)}
                                            className="font-black text-lg text-gray-900 w-full bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 focus:outline-emerald-500"
                                        />
                                        <span className="font-bold text-emerald-800 text-sm px-2">
                                            {product.unit || 'kg'}
                                        </span>
                                    </div>
                                </div>

                                {/* Live Subtotal */}
                                <div className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-emerald-100">
                                    <span className="text-xs text-gray-600 font-medium">
                                        {parseFloat(String(selectedBulkQty).replace(/[^0-9.]/g, '')) || 1} {product.unit || 'kg'} × ₹{numericPrice}
                                    </span>
                                    <span className="text-lg font-black text-emerald-900">
                                        Total: ₹{Math.round(((parseFloat(String(selectedBulkQty).replace(/[^0-9.]/g, '')) || 1) * numericPrice)).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const weightNum = parseFloat(String(selectedBulkQty).replace(/[^0-9.]/g, '')) || 1;
                                            try {
                                                const stored = localStorage.getItem('user_cart');
                                                let cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];
                                                cart.push({
                                                    ...product,
                                                    cartId: `${product._id || product.id}-${weightNum}kg`,
                                                    quantity: 1,
                                                    selectedWeight: `${weightNum} ${product.unit || 'kg'}`,
                                                    weightMultiplier: weightNum,
                                                    price: Math.round(weightNum * numericPrice),
                                                    unitPrice: numericPrice,
                                                    cartType: 'FRESH'
                                                });
                                                localStorage.setItem('user_cart', JSON.stringify(cart));
                                                window.dispatchEvent(new Event('storage'));
                                                toast.success(`Added ${weightNum} ${product.unit || 'kg'} to cart!`);
                                                updateQuantityFromCart();
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                                    >
                                        <span>🛒</span> Add Custom Weight to Cart
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkOrder(selectedBulkQty)}
                                        disabled={isBulkOrdering}
                                        className="px-4 bg-white border border-emerald-300 text-emerald-800 font-bold text-xs rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center whitespace-nowrap"
                                    >
                                        <span>📨</span> {isBulkOrdering ? 'Sending...' : 'Bulk Inquiry'}
                                    </button>
                                </div>
                            </div>
                        )}

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
                        </div>

                    </div>
                </div>
            </main>

            {/* Mobile Sticky Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden z-50 flex items-center gap-4">
                <div className="flex-1">
                    <span className="text-2xl font-black font-heading text-gray-900 block">₹{subtotal}</span>
                    <span className="text-xs text-green-600 font-bold">
                        {cartType === 'FRESH' ? 'Farm Direct Freshness' : 'Free Delivery'}
                    </span>
                </div>
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
                        ADD TO CART
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductDetails;
