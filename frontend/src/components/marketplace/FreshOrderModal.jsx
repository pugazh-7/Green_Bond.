import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../shared/ProductImage';

const REGULAR_PRESETS = [
    { label: '0.5 kg (500g)', val: 0.5 },
    { label: '1 kg', val: 1 },
    { label: '1.5 kg', val: 1.5 },
    { label: '2 kg', val: 2 },
    { label: '3 kg', val: 3 },
    { label: '5 kg', val: 5 }
];

const BULK_PRESETS = [
    { label: '5 kg', val: 5 },
    { label: '10 kg', val: 10 },
    { label: '20 kg', val: 20 },
    { label: '25 kg', val: 25 },
    { label: '50 kg', val: 50 },
    { label: '100 kg', val: 100 }
];

const FreshOrderModal = ({ product, isOpen, onClose, initialMode = 'REGULAR' }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState(initialMode); // 'REGULAR' | 'BULK'
    const [regularWeight, setRegularWeight] = useState(1);
    const [bulkWeight, setBulkWeight] = useState(5);
    const [customInput, setCustomInput] = useState('1');
    const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

    useEffect(() => {
        if (product) {
            setMode(initialMode || 'REGULAR');
            if (initialMode === 'BULK') {
                const min = parseFloat(String(product.minOrder).replace(/[^0-9.]/g, '')) || 5;
                setBulkWeight(min);
                setCustomInput(String(min));
            } else {
                setRegularWeight(1);
                setCustomInput('1');
            }
        }
    }, [product, initialMode, isOpen]);

    if (!isOpen || !product) return null;

    const rawPrice = product.price;
    const pricePerKg = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : (rawPrice || 40);
    const unit = product.unit || 'kg';

    const currentWeight = mode === 'REGULAR' ? regularWeight : bulkWeight;
    const calculatedTotal = Math.round(currentWeight * pricePerKg);

    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        if (newMode === 'BULK') {
            const min = parseFloat(String(product.minOrder).replace(/[^0-9.]/g, '')) || 5;
            setBulkWeight(min);
            setCustomInput(String(min));
        } else {
            setRegularWeight(1);
            setCustomInput('1');
        }
    };

    const handlePresetClick = (val) => {
        if (mode === 'REGULAR') {
            setRegularWeight(val);
            setCustomInput(String(val));
        } else {
            setBulkWeight(val);
            setCustomInput(String(val));
        }
    };

    const handleCustomInputChange = (e) => {
        const valStr = e.target.value;
        setCustomInput(valStr);
        const parsed = parseFloat(valStr);
        if (!isNaN(parsed) && parsed > 0) {
            if (mode === 'REGULAR') {
                setRegularWeight(parsed);
            } else {
                setBulkWeight(parsed);
            }
        }
    };

    const handleStepChange = (delta) => {
        const step = mode === 'REGULAR' ? 0.5 : 5;
        const current = mode === 'REGULAR' ? regularWeight : bulkWeight;
        const minAllowed = mode === 'REGULAR' ? 0.25 : (parseFloat(String(product.minOrder).replace(/[^0-9.]/g, '')) || 5);
        const next = Math.max(minAllowed, Math.round((current + delta * step) * 100) / 100);
        
        if (mode === 'REGULAR') {
            setRegularWeight(next);
            setCustomInput(String(next));
        } else {
            setBulkWeight(next);
            setCustomInput(String(next));
        }
    };

    const handleAddToCart = () => {
        try {
            const stored = localStorage.getItem('user_cart');
            let cart = stored && stored !== 'undefined' ? JSON.parse(stored) : [];

            // Check if cart has items from different marketplace type
            const existingNonFresh = cart.find(i => i.cartType && i.cartType !== 'FRESH');
            if (existingNonFresh) {
                if (window.confirm("Your cart contains non-Fresh items. Would you like to clear the cart for Fresh Farmer Produce?")) {
                    cart = [];
                } else {
                    return;
                }
            }

            const itemCartId = `${product._id || product.id}-${mode}-${currentWeight}kg`;
            const existingIndex = cart.findIndex(i => i.cartId === itemCartId || (i._id === product._id && i.orderType === mode && i.selectedWeight === `${currentWeight} ${unit}`));

            if (existingIndex > -1) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({
                    ...product,
                    cartId: itemCartId,
                    quantity: 1,
                    selectedWeight: `${currentWeight} ${unit}`,
                    weightMultiplier: currentWeight,
                    price: calculatedTotal,
                    unitPrice: pricePerKg,
                    orderType: mode,
                    cartType: 'FRESH'
                });
            }

            localStorage.setItem('user_cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('storage'));
            toast.success(`Added ${currentWeight} ${unit} of ${product.name || product.title} to cart!`);
            onClose();
        } catch (err) {
            console.error("Cart error:", err);
            toast.error("Failed to add to cart");
        }
    };

    const handleSendBulkInquiry = async () => {
        setIsSubmittingInquiry(true);
        try {
            const token = localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bulk-orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product._id || product.id,
                    requestedQuantity: Math.round(bulkWeight)
                })
            });

            if (res.ok) {
                toast.success(`Bulk inquiry for ${bulkWeight} ${unit} sent directly to ${product.farmer || 'the farmer'}!`);
                onClose();
                navigate('/user/bulk-orders');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to submit bulk order inquiry.');
            }
        } catch (err) {
            console.error("Bulk inquiry error:", err);
            toast.error("Network error submitting bulk inquiry.");
        } finally {
            setIsSubmittingInquiry(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="fixed inset-0" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-slide-up max-h-[92vh] flex flex-col">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl p-1.5 flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
                            <ProductImage product={product} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg leading-tight text-white line-clamp-1">
                                {product.name || product.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-emerald-200">
                                <span>🧑‍🌾 {product.farmer || 'Verified Farmer'}</span>
                                <span>•</span>
                                <span className="font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded-md">
                                    ₹{pricePerKg}/{unit}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
                    
                    {/* Mode Selector (Regular vs Bulk) */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                            Select Order Type
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('REGULAR')}
                                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                                    mode === 'REGULAR'
                                        ? 'bg-white text-emerald-900 shadow-md scale-[1.02]'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <span className="text-base">🥬</span>
                                <span>Per Kg / Daily Pack</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('BULK')}
                                className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                                    mode === 'BULK'
                                        ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <span className="text-base">📦</span>
                                <span>Bulk Farm Order</span>
                            </button>
                        </div>
                    </div>

                    {/* Weight Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                {mode === 'REGULAR' ? 'Popular Daily Quantities' : 'Standard Bulk Farm Sacks'}
                            </label>
                            {mode === 'BULK' && product.minOrder && (
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Min: {product.minOrder}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {(mode === 'REGULAR' ? REGULAR_PRESETS : BULK_PRESETS).map(preset => {
                                const isSelected = currentWeight === preset.val;
                                return (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => handlePresetClick(preset.val)}
                                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all text-center ${
                                            isSelected 
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200' 
                                                : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-emerald-50/50 hover:border-emerald-300'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Weight Input Box */}
                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                        <label className="text-xs font-bold text-emerald-900 block mb-2">
                            Custom Weight Input (Enter any kg like 1.5, 2.5, 15 kg):
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white rounded-xl border border-emerald-300 shadow-xs flex-1 px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500">
                                <input
                                    type="number"
                                    step={mode === 'REGULAR' ? '0.1' : '1'}
                                    min={mode === 'REGULAR' ? '0.1' : '5'}
                                    value={customInput}
                                    onChange={handleCustomInputChange}
                                    placeholder="Enter kg"
                                    className="w-full font-black text-lg text-gray-900 bg-transparent outline-hidden focus:outline-none"
                                />
                                <span className="text-sm font-bold text-emerald-800 ml-1">
                                    {unit}
                                </span>
                            </div>

                            {/* Stepper Buttons (+ / -) */}
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleStepChange(-1)}
                                    className="w-10 h-10 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-lg hover:bg-emerald-100 flex items-center justify-center transition-colors shadow-xs"
                                >
                                    −
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStepChange(1)}
                                    className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-bold text-lg hover:bg-emerald-800 flex items-center justify-center transition-colors shadow-xs"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Live Calculation Summary */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-gray-500 block">Total Rate Calculation</span>
                            <span className="text-xs font-bold text-gray-700">
                                {currentWeight} {unit} × ₹{pricePerKg}/{unit}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block font-medium">Estimated Subtotal</span>
                            <span className="text-2xl font-black font-heading text-emerald-800">
                                ₹{calculatedTotal.toLocaleString()}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-2.5">
                    {mode === 'BULK' ? (
                        <>
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="flex-1 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base rounded-2xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                            >
                                <span>🛒</span>
                                <span>Add {currentWeight} {unit} Bulk to Cart (₹{calculatedTotal})</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSendBulkInquiry}
                                disabled={isSubmittingInquiry}
                                className="py-3.5 px-5 bg-white border-2 border-emerald-600 text-emerald-800 font-bold text-sm rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 active:scale-98"
                            >
                                <span>📨</span>
                                <span>{isSubmittingInquiry ? 'Sending...' : 'Direct Inquiry'}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
                        >
                            <span>🛒</span>
                            <span>Add {currentWeight} {unit} to Cart • ₹{calculatedTotal}</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FreshOrderModal;
