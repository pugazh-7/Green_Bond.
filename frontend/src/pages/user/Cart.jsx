import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLocationContext } from '../../context/LocationContext';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();
    const { location, setShowLocationModal } = useLocationContext();

    useEffect(() => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    const removeFromCart = (id) => {
        const updatedCart = cartItems.filter(item => item.cartId !== id);
        setCartItems(updatedCart);
        localStorage.setItem('user_cart', JSON.stringify(updatedCart));
    };

    const updateQuantity = (cartId, delta) => {
        const updatedCart = cartItems.map(item => {
            if (item.cartId === cartId) {
                const priceParts = item.price.split('/');
                const unit = priceParts.length > 1 ? priceParts[1].trim().toLowerCase() : '';
                let newQty = item.quantity + delta;

                if (delta > 0 && unit === 'kg' && item.quantity >= 5) {
                    toast.error("For orders over 5kg, please use the Bulk Order option");
                    return item;
                }
                newQty = Math.max(1, newQty);
                if (unit === 'kg') newQty = Math.min(5, newQty);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        setCartItems(updatedCart);
        localStorage.setItem('user_cart', JSON.stringify(updatedCart));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = parseInt(item.price.replace(/[^\d]/g, ''));
            return total + (price * item.quantity);
        }, 0);
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleCheckoutClick = () => {
        if (cartItems.length === 0) return;
        if (!location || !location.lat || !location.lng) {
            toast.error("Please provide a valid delivery location.");
            setShowLocationModal(true);
            return;
        }
        setShowPaymentModal(true);
    };

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const checkServiceability = async (lat, lng) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/check-serviceability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ lat, lng })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Location is out of service area.');
        }
        return true;
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || '{}');
        const token = localStorage.getItem('token');
        
        if (!token) {
            toast.error("Please log in to place an order");
            setIsProcessing(false);
            return;
        }

        const finalLoc = getFinalLocation();

        try {
            // 1. Serviceability Check
            await checkServiceability(finalLoc.lat, finalLoc.lng);

            // 2. Create Order Backend
            const orderData = {
                customerEmail: currentUser.email,
                customerName: currentUser.name || "Guest User",
                items: cartItems.map(i => ({
                    cartId: i.cartId,
                    productId: i.productId,
                    title: i.title,
                    price: i.price,
                    farmer: i.farmer,
                    farmerId: i.farmerId,
                    location: i.location,
                    image: i.image,
                    quantity: i.quantity
                })),
                qty: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                total: `₹${calculateTotal().toLocaleString()}`,
                totalAmount: calculateTotal(),
                paymentMethod: paymentMethod,
                paymentStatus: 'Pending',
                deliveryAddress: location.address || "Location Provided",
                deliveryLocation: { lat: location.lat, lng: location.lng },
                pickupAddress: cartItems[0].location || "Multiple Locations",
                pickupLocation: cartItems[0].farmerLocationGeo ? { lat: cartItems[0].farmerLocationGeo.coordinates[1], lng: cartItems[0].farmerLocationGeo.coordinates[0] } : undefined
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Error placing order');
            }

            const data = await response.json();
            const orderId = data.order.id;
            setPlacedOrderId(orderId);

            if (paymentMethod === 'COD') {
                handleSuccess();
                return;
            }

            // 3. Online Payment Flow (Razorpay)
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                throw new Error("Razorpay SDK failed to load. Are you online?");
            }

            const rzpRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ orderId: orderId })
            });

            if (!rzpRes.ok) throw new Error("Error initiating payment gateway.");
            
            const rzpData = await rzpRes.json();

            const options = {
                key: rzpData.key,
                amount: rzpData.amount,
                currency: rzpData.currency,
                name: "Green Bond",
                description: "Sustainable Produce",
                order_id: rzpData.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/payments/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });
                        
                        if (verifyRes.ok) {
                            handleSuccess();
                        } else {
                            toast.error("Payment verification failed. Please contact support.");
                            setIsProcessing(false);
                        }
                    } catch (err) {
                        toast.error("Error verifying payment.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: currentUser.name,
                    email: currentUser.email,
                    contact: currentUser.mobile
                },
                theme: { color: "#16a34a" },
                modal: {
                    ondismiss: function() {
                        toast.error("Payment cancelled.");
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                toast.error(`Payment Failed: ${response.error.description}`);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (error) {
            console.error('Order creation error:', error);
            toast.error(error.message || 'Server error. Please try again later.');
            setIsProcessing(false);
        }
    };

    const handleSuccess = () => {
        localStorage.removeItem('user_cart');
        setCartItems([]);
        setIsProcessing(false);
        setOrderSuccess(true);
        setTimeout(() => {
            setOrderSuccess(false);
            setShowPaymentModal(false);
            navigate('/user');
        }, 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black font-heading text-gray-900">My Cart</h1>
                <p className="text-gray-500 mt-1">Review your items and proceed to checkout.</p>
            </header>

            {(() => {
                const shoppingItems = cartItems.filter(i => i.cartType === 'SHOPPING' || !i.cartType);
                const quickItems = cartItems.filter(i => i.cartType === 'QUICK');
                const freshItems = cartItems.filter(i => i.cartType === 'FRESH');
                
                const renderItem = (item) => (
                    <div key={item.cartId} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                        <img src={item.image} alt={item.title || item.name} className="w-24 h-24 object-contain bg-gray-50 rounded-xl p-2" />
                        <div className="flex-1 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{item.title || item.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.brand || item.farmerName}</p>
                                </div>
                                <button onClick={() => removeFromCart(item.cartId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100">
                                    <button onClick={() => updateQuantity(item.cartId, -1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:text-green-600">-</button>
                                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.cartId, 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-600 hover:text-green-600">+</button>
                                </div>
                                <p className="font-black font-heading text-lg text-green-700">₹{(parseInt(String(item.price).replace(/[^\d]/g, '')) * item.quantity).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                );

                return cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <button onClick={() => navigate('/user/marketplace')} className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">
                        Go to Marketplace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-8">
                        {quickItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">⚡</span>
                                    <h2 className="text-lg font-black font-heading text-purple-900">Quick Delivery <span className="text-sm font-medium text-purple-600">(10-15 mins)</span></h2>
                                </div>
                                {quickItems.map(renderItem)}
                            </div>
                        )}
                        
                        {freshItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🥬</span>
                                    <h2 className="text-lg font-black font-heading text-green-900">Farm Direct <span className="text-sm font-medium text-green-600">(Sourced directly)</span></h2>
                                </div>
                                {freshItems.map(renderItem)}
                            </div>
                        )}
                        
                        {shoppingItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🛍️</span>
                                    <h2 className="text-lg font-black font-heading text-gray-900">Shopping <span className="text-sm font-medium text-gray-500">(Standard Delivery)</span></h2>
                                </div>
                                {shoppingItems.map(renderItem)}
                            </div>
                        )}
                    </div>

                    {/* Summary & Address */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Deliver to</h3>
                                <button 
                                    onClick={() => setShowLocationModal(true)}
                                    className="text-sm font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                            
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="p-2 bg-white rounded-full shadow-sm text-xl mt-0.5">
                                    {location?.label === 'Home' ? '🏠' : location?.label === 'Work' ? '💼' : '📍'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{location?.label || 'Delivery Location'}</p>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {location?.address || 'No location selected'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{calculateTotal().toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex justify-between text-xl font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>
                            {/* Desktop Checkout Button */}
                            <button
                                onClick={handleCheckoutClick}
                                className="hidden md:block w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg active:scale-95"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            );
            })()}
            
            {/* Sticky Mobile Checkout Bar */}
            {cartItems.length > 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe z-40 shadow-[0_-8px_30px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total</span>
                            <span className="text-xl font-black font-heading text-gray-900">₹{calculateTotal().toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleCheckoutClick}
                            className="bg-green-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-green-600/30 active-press flex items-center gap-2"
                        >
                            Place Order
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setShowPaymentModal(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {orderSuccess ? (
                            <div className="p-10 text-center">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-4xl">✅</span>
                                </div>
                                <h3 className="text-2xl font-bold text-green-700 mb-2">Order Successful!</h3>
                                <p className="text-gray-500">Order ID: <span className="font-mono font-bold">{placedOrderId}</span></p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900">Select Payment</h3>
                                    <button onClick={() => setShowPaymentModal(false)} disabled={isProcessing} className="text-gray-400 hover:text-gray-600">✖</button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'ONLINE' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <input type="radio" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className="font-bold text-gray-900 block">Pay Online</span>
                                            <span className="text-xs text-gray-500">UPI, QR, Cards, NetBanking</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className="font-bold text-gray-900 block">Cash on Delivery</span>
                                            <span className="text-xs text-gray-500">Pay when you receive</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="p-6 bg-gray-50 border-t border-gray-100">
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg disabled:opacity-70 flex justify-center items-center"
                                    >
                                        {isProcessing ? 'Processing...' : `Pay ₹${calculateTotal().toLocaleString()}`}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;



