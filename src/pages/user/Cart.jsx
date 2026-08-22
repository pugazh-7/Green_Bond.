import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductImage from '../../components/shared/ProductImage';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) setCartItems(JSON.parse(savedCart));
    }, []);

    const updateQuantity = (id, delta) => {
        const updated = cartItems.map(item => {
            if ((item.id || item._id) === id) {
                const newQty = Math.max(1, (item.cartQuantity || 1) + delta);
                return { ...item, cartQuantity: newQty };
            }
            return item;
        });
        setCartItems(updated);
        localStorage.setItem('user_cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
    };

    const removeItem = (id) => {
        const updated = cartItems.filter(item => (item.id || item._id) !== id);
        setCartItems(updated);
        localStorage.setItem('user_cart', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
        toast.success('Item removed');
    };

    const groupedCart = {
        QUICK: cartItems.filter(i => i.marketplaceType === 'QUICK' || i.eta),
        FRESH: cartItems.filter(i => i.marketplaceType === 'FRESH' || i.farmer || (!i.eta && !i.brand && i.unit)),
        SHOPPING: cartItems.filter(i => i.marketplaceType === 'SHOPPING' || (i.marketplaceType !== 'QUICK' && i.marketplaceType !== 'FRESH' && !i.eta && !i.farmer && !i.unit))
    };

    const calculateSubtotal = () => cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * (item.cartQuantity || 1)), 0);
    const subtotal = calculateSubtotal();

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 font-sans">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🛒</span>
                </div>
                <h2 className="text-xl font-bold font-display text-gray-900 mb-2">Your cart is empty</h2>
                <p className="text-sm text-gray-500 mb-8 text-center max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                <button 
                    onClick={() => navigate('/user')}
                    className="w-full max-w-sm bg-greenbond-600 text-white font-bold py-4 rounded-xl hover:bg-greenbond-700 transition active:scale-95"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-white px-4 pt-safe-top pb-3 border-b border-gray-100 flex items-center shadow-sm sticky top-0 z-40">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 active:bg-gray-100 rounded-full mr-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-bold font-display text-gray-900">Cart</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* QUICK SECTION */}
                {groupedCart.QUICK.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-quick-100">
                        <div className="flex items-center space-x-2 mb-3 border-b border-gray-50 pb-2">
                            <span className="text-lg">⚡</span>
                            <h2 className="font-bold text-gray-900">Quick Delivery</h2>
                            <span className="text-xs bg-quick-50 text-quick-600 px-2 py-0.5 rounded font-bold ml-auto">10-15 min</span>
                        </div>
                        <div className="space-y-4">
                            {groupedCart.QUICK.map(item => (
                                <CartItem key={item.id || item._id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
                            ))}
                        </div>
                    </div>
                )}

                {/* FRESH SECTION */}
                {groupedCart.FRESH.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-fresh-100">
                        <div className="flex items-center space-x-2 mb-3 border-b border-gray-50 pb-2">
                            <span className="text-lg">🥬</span>
                            <h2 className="font-bold text-gray-900">Fresh Produce</h2>
                            <span className="text-xs bg-fresh-50 text-fresh-600 px-2 py-0.5 rounded font-bold ml-auto">Direct Farmer</span>
                        </div>
                        <div className="space-y-4">
                            {groupedCart.FRESH.map(item => (
                                <CartItem key={item.id || item._id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
                            ))}
                        </div>
                    </div>
                )}

                {/* SHOPPING SECTION */}
                {groupedCart.SHOPPING.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 mb-3 border-b border-gray-50 pb-2">
                            <span className="text-lg">🛍</span>
                            <h2 className="font-bold text-gray-900">Marketplace</h2>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold ml-auto">Standard Delivery</span>
                        </div>
                        <div className="space-y-4">
                            {groupedCart.SHOPPING.map(item => (
                                <CartItem key={item.id || item._id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-500 font-medium text-sm">To Pay</span>
                        <span className="text-xl font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={() => navigate('/user/checkout')}
                        className="w-full bg-greenbond-600 text-white font-bold py-4 rounded-xl flex justify-between items-center px-6 active:scale-95 transition-transform shadow-lg"
                    >
                        <span>Proceed to Checkout</span>
                        <span>→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const CartItem = ({ item, onUpdate, onRemove }) => {
    return (
        <div className="flex space-x-3 items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 relative">
                <ProductImage product={item} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-1">{item.unit || item.weight || '1 item'}</p>
                <p className="font-bold text-gray-900 text-sm">₹{item.price}</p>
            </div>
            <div className="flex items-center bg-greenbond-50 border border-greenbond-100 rounded-lg">
                <button onClick={() => { if(item.cartQuantity === 1) onRemove(item.id || item._id); else onUpdate(item.id || item._id, -1); }} className="px-3 py-1 text-greenbond-700 font-bold hover:bg-greenbond-100 rounded-l-lg transition">
                    {item.cartQuantity === 1 ? <span className="text-xs">🗑️</span> : '-'}
                </button>
                <span className="w-6 text-center text-sm font-bold text-greenbond-900">{item.cartQuantity || 1}</span>
                <button onClick={() => onUpdate(item.id || item._id, 1)} className="px-3 py-1 text-greenbond-700 font-bold hover:bg-greenbond-100 rounded-r-lg transition">+</button>
            </div>
        </div>
    );
};

export default Cart;
