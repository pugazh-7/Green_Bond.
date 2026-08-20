import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';

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
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressMode, setSelectedAddressMode] = useState('SAVED'); // 'SAVED' or 'NEW'
    const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);
    const [newDeliveryLocation, setNewDeliveryLocation] = useState(null);

    useEffect(() => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/user/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedAddresses(data);
                if (data.length > 0) {
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    setSelectedSavedAddress(defaultAddr);
                } else {
                    setSelectedAddressMode('NEW');
                }
            }
        } catch (error) {
            console.error("Failed to fetch addresses");
        }
    };

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
    
    const getFinalLocation = () => {
        if (selectedAddressMode === 'SAVED' && selectedSavedAddress) {
            return selectedSavedAddress;
        }
        return newDeliveryLocation;
    };

    const handleCheckoutClick = () => {
        if (cartItems.length === 0) return;
        const finalLoc = getFinalLocation();
        if (!finalLoc || !finalLoc.lat || !finalLoc.lng) {
            toast.error("Please provide a valid delivery location.");
            return;
        }
        setShowPaymentModal(true);
    };

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const checkServiceability = async (lat, lng) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/check-serviceability`, {
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
                deliveryAddress: finalLoc.address || "Location Provided",
                deliveryLocation: { lat: finalLoc.lat, lng: finalLoc.lng },
                pickupAddress: cartItems[0].location || "Multiple Locations",
                pickupLocation: cartItems[0].farmerLocationGeo ? { lat: cartItems[0].farmerLocationGeo.coordinates[1], lng: cartItems[0].farmerLocationGeo.coordinates[0] } : undefined
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
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

            const rzpRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-order`, {
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
                        const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify`, {
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
                <h1 className="text-3xl font-bold text-gray-900">My Cart</h1>
                <p className="text-gray-500 mt-1">Review your items and proceed to checkout.</p>
            </header>

            {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <button onClick={() => navigate('/user/marketplace')} className="mt-4 px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">
                        Go to Marketplace
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.cartId} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
                                <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-xl" />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-gray-900">{item.title}</h3>
                                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-500 text-sm">Remove</button>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateQuantity(item.cartId, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">-</button>
                                            <span className="font-bold text-gray-900">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.cartId, 1)} className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold">+</button>
                                        </div>
                                        <p className="font-bold text-green-700">₹{(parseInt(item.price.replace(/[^\d]/g, '')) * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary & Address */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Location</h3>
                            
                            <div className="flex gap-2 mb-4">
                                {savedAddresses.length > 0 && (
                                    <button 
                                        onClick={() => setSelectedAddressMode('SAVED')}
                                        className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${selectedAddressMode === 'SAVED' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Saved
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedAddressMode('NEW')}
                                    className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${selectedAddressMode === 'NEW' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    New Address
                                </button>
                            </div>

                            {selectedAddressMode === 'SAVED' && savedAddresses.length > 0 && (
                                <div className="space-y-3">
                                    {savedAddresses.map(addr => (
                                        <div 
                                            key={addr._id}
                                            onClick={() => setSelectedSavedAddress(addr)}
                                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedSavedAddress?._id === addr._id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm text-gray-900">{addr.label}</span>
                                                {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Default</span>}
                                            </div>
                                            <p className="text-xs text-gray-600 line-clamp-2">{addr.address}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedAddressMode === 'NEW' && (
                                <LocationPicker onLocationChange={(loc) => setNewDeliveryLocation(loc)} />
                            )}
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
                            <button
                                onClick={handleCheckoutClick}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg active:scale-95"
                            >
                                Checkout
                            </button>
                        </div>
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

