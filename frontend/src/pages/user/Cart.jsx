import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

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
                // Determine unit
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
    const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Card, NetBanking, COD
    const [isProcessing, setIsProcessing] = useState(false);
    const [upiId, setUpiId] = useState('');
    const [isUpiVerified, setIsUpiVerified] = useState(false);
    const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) return;
        setShowPaymentModal(true);
    };

    const [orderSuccess, setOrderSuccess] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    const checkPaymentStatus = (method) => {
        if (method === 'COD') return 'Pending';
        return 'Paid';
    };

    const verifyUpi = () => {
        if (!upiId.includes('@')) {
            toast.error("Please enter a valid UPI ID (e.g., name@okaxis)");
            return;
        }
        setIsVerifyingUpi(true);
        setTimeout(() => {
            setIsVerifyingUpi(false);
            setIsUpiVerified(true);
            toast.success("UPI ID Verified!");
        }, 1500);
    };

    const confirmOrder = () => {
        setIsProcessing(true);

        // Simulate Payment Processing
        setTimeout(() => {
            const orderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
            const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || '{}');
            const status = paymentMethod === 'COD' ? 'Pending' : 'Paid';

            const newOrder = {
                id: orderId,
                customer: currentUser.name || "Guest User",
                item: cartItems[0].title + (cartItems.length > 1 ? ` +${cartItems.length - 1} more` : ""),
                items: cartItems,
                qty: cartItems.reduce((sum, item) => sum + item.quantity, 0),
                total: `₹${calculateTotal().toLocaleString()}`,
                totalAmount: calculateTotal(),
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                status: 'Placed',
                paymentMethod: paymentMethod,
                paymentStatus: status,
                deliveryAddress: "123, Green Street, Chennai",
                pickupAddress: cartItems[0].location || "Multiple Locations"
            };

            const savedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
            localStorage.setItem('green_bond_orders', JSON.stringify([newOrder, ...savedOrders]));
            localStorage.setItem('user_cart', JSON.stringify([]));

            setPlacedOrderId(orderId);
            setIsProcessing(false);
            setOrderSuccess(true);

            // Auto redirect after showing success
            setTimeout(() => {
                setCartItems([]);
                setOrderSuccess(false);
                setShowPaymentModal(false);
                navigate('/user');
            }, 3000);

        }, 2000);
    };

    return (

        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">My Cart</h1>
                <p className="text-gray-500 mt-1">Review your items and proceed to checkout.</p>
            </header>

            {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't added any fresh produce yet.</p>
                    <button
                        onClick={() => navigate('/user/marketplace')}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors"
                    >
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
                                        <button onClick={() => removeFromCart(item.cartId)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500">{item.farmer} • {item.location}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => updateQuantity(item.cartId, -1)}
                                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                            </button>
                                            <span className="font-bold text-gray-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartId, 1)}
                                                className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 hover:bg-green-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            </button>
                                        </div>
                                        <p className="font-bold text-green-700">₹{(parseInt(item.price.replace(/[^\d]/g, '')) * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
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
                                onClick={handlePlaceOrder}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                            >
                                Place Order
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4">
                                By placing an order, you agree to our Terms of Service.
                            </p>
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
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h3>
                                <p className="text-gray-500">Order ID: <span className="font-mono font-bold text-gray-800">{placedOrderId}</span></p>
                                <p className="text-sm text-gray-400 mt-4">Redirecting you to dashboard...</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-gray-900">Select Payment Method</h3>
                                    <button onClick={() => setShowPaymentModal(false)} disabled={isProcessing} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>

                                <div className="p-6 space-y-3">
                                    {/* UPI Option */}
                                    <div className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'UPI' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <label className="flex items-center gap-4 cursor-pointer">
                                            <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={(e) => { setPaymentMethod(e.target.value); setIsUpiVerified(false); }} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-900 block">UPI</span>
                                                <span className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</span>
                                            </div>
                                            <span className="text-2xl">📱</span>
                                        </label>
                                        
                                        {paymentMethod === 'UPI' && (
                                            <div className="mt-4 flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter UPI ID (e.g. name@okaxis)" 
                                                    value={upiId}
                                                    onChange={(e) => { setUpiId(e.target.value); setIsUpiVerified(false); }}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                                <button 
                                                    onClick={verifyUpi}
                                                    disabled={isVerifyingUpi || isUpiVerified}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isUpiVerified ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'}`}
                                                >
                                                    {isVerifyingUpi ? 'Verifying...' : isUpiVerified ? '✓ Verified' : 'Verify'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* QR Option */}
                                    <div className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'QR' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <label className="flex items-center gap-4 cursor-pointer">
                                            <input type="radio" name="payment" value="QR" checked={paymentMethod === 'QR'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                            <div className="flex-1">
                                                <span className="font-bold text-gray-900 block">Scan QR Code</span>
                                                <span className="text-xs text-gray-500">Instant payment via any app</span>
                                            </div>
                                            <span className="text-2xl">🔳</span>
                                        </label>
                                        
                                        {paymentMethod === 'QR' && (
                                            <div className="mt-4 flex flex-col items-center p-4 bg-white rounded-xl border border-dashed border-gray-200">
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=greenbond@bank&pn=GreenBond%20Marketplace&am=${calculateTotal()}&cu=INR`} 
                                                    alt="Payment QR" 
                                                    className="w-32 h-32 mb-2"
                                                />
                                                <p className="text-[10px] text-gray-400 font-medium">Scan with any UPI App to Pay ₹{calculateTotal().toLocaleString()}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Option */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'Card' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className="font-bold text-gray-900 block">Credit / Debit Card</span>
                                            <span className="text-xs text-gray-500">Visa, Mastercard, Rupay</span>
                                        </div>
                                        <span className="text-2xl">💳</span>
                                    </label>

                                    {/* Net Banking */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'NetBanking' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <input type="radio" name="payment" value="NetBanking" checked={paymentMethod === 'NetBanking'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className="font-bold text-gray-900 block">Net Banking</span>
                                            <span className="text-xs text-gray-500">All Indian Banks</span>
                                        </div>
                                        <span className="text-2xl">🏦</span>
                                    </label>

                                    {/* COD */}
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                        <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className="font-bold text-gray-900 block">Cash on Delivery</span>
                                            <span className="text-xs text-gray-500">Pay when you receive</span>
                                        </div>
                                        <span className="text-2xl">💵</span>
                                    </label>
                                </div>

                                <div className="p-6 bg-gray-50 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-600">Total Amount</span>
                                        <span className="text-xl font-bold text-green-700">₹{calculateTotal().toLocaleString()}</span>
                                    </div>
                                    <button
                                        onClick={confirmOrder}
                                        disabled={isProcessing || (paymentMethod === 'UPI' && !isUpiVerified)}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {paymentMethod === 'QR' ? 'Verifying Payment...' : 'Processing...'}
                                            </>
                                        ) : (
                                            (paymentMethod === 'UPI' && !isUpiVerified) ? 'Please Verify UPI ID' : 'Pay & Confirm Order'
                                        )}
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
