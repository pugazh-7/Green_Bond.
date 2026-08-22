import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import toast from 'react-hot-toast';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const navigate = useNavigate();
    const { location } = useLocationContext();
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // ONLINE | COD
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem('user_cart');
        if (savedCart) setCartItems(JSON.parse(savedCart));
        if (!location) {
            toast.error("Delivery location is missing");
            navigate('/user/cart');
        }
    }, []);

    const calculateSubtotal = () => cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * (item.cartQuantity || 1)), 0);
    const subtotal = calculateSubtotal();
    const deliveryFee = subtotal > 500 ? 0 : 49;
    const total = subtotal + deliveryFee;

    const handlePlaceOrder = async () => {
        if (!location) return;
        setIsProcessing(true);
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to place an order");
            navigate('/login/user');
            return;
        }

        try {
            const formattedProducts = cartItems.map(item => ({
                product: item.id || item._id,
                quantity: item.cartQuantity || 1,
                price: parseFloat(item.price)
            }));

            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    products: formattedProducts,
                    totalAmount: total,
                    paymentMethod,
                    shippingAddress: location
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create order');
            }

            const data = await res.json();

            if (paymentMethod === 'ONLINE') {
                const resRazorpay = await loadRazorpay();
                if (!resRazorpay) {
                    toast.error("Failed to load Razorpay SDK. Check your connection.");
                    setIsProcessing(false);
                    return;
                }

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourKeyId",
                    amount: data.amount,
                    currency: data.currency,
                    name: "GreenBond",
                    description: "Order Payment",
                    order_id: data.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/verify-payment`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                })
                            });
                            if (verifyRes.ok) {
                                toast.success("Payment Successful!");
                                localStorage.removeItem('user_cart');
                                window.dispatchEvent(new Event('storage'));
                                navigate('/user/orders');
                            }
                        } catch (err) {
                            toast.error("Payment verification failed");
                        }
                    },
                    prefill: {
                        name: "User",
                        email: "user@example.com",
                        contact: "9999999999"
                    },
                    theme: { color: "#16a34a" }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.open();
                setIsProcessing(false);
            } else {
                toast.success("Order Placed Successfully!");
                localStorage.removeItem('user_cart');
                window.dispatchEvent(new Event('storage'));
                navigate('/user/orders');
            }
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-white px-4 pt-safe-top pb-3 border-b border-gray-100 flex items-center shadow-sm sticky top-0 z-40">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 active:bg-gray-100 rounded-full mr-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h1 className="text-xl font-bold font-display text-gray-900">Checkout</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Delivery Location Section */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="text-xl">📍</span>
                        <h2 className="font-bold text-gray-900 font-display">Delivery Address</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="font-semibold text-gray-800 text-sm mb-1">{location?.address}</p>
                    </div>
                </section>

                {/* Payment Method Section */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="text-xl">💳</span>
                        <h2 className="font-bold text-gray-900 font-display">Payment Method</h2>
                    </div>
                    <div className="space-y-3">
                        <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'ONLINE' ? 'border-greenbond-500 bg-greenbond-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">📱</div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">UPI / QR Code</p>
                                    <p className="text-xs text-greenbond-600 font-medium">Recommended</p>
                                </div>
                            </div>
                            <input 
                                type="radio" 
                                name="payment" 
                                checked={paymentMethod === 'ONLINE'} 
                                onChange={() => setPaymentMethod('ONLINE')}
                                className="w-5 h-5 text-greenbond-600"
                            />
                        </label>
                        <label className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-greenbond-500 bg-greenbond-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">💵</div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Cash on Delivery</p>
                                    <p className="text-xs text-gray-400">Pay when you receive</p>
                                </div>
                            </div>
                            <input 
                                type="radio" 
                                name="payment" 
                                checked={paymentMethod === 'COD'} 
                                onChange={() => setPaymentMethod('COD')}
                                className="w-5 h-5 text-greenbond-600"
                            />
                        </label>
                    </div>
                </section>

                {/* Bill Details */}
                <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-900 font-display mb-4">Bill Details</h2>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                            <span>Item Total</span>
                            <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span className={deliveryFee === 0 ? "font-bold text-greenbond-600" : "font-semibold text-gray-900"}>
                                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                            </span>
                        </div>
                        {deliveryFee > 0 && (
                            <p className="text-[10px] text-gray-400">Add ₹{(500 - subtotal).toFixed(2)} more for free delivery</p>
                        )}
                    </div>
                    <div className="pt-3 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Grand Total</span>
                        <span className="text-xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
                    </div>
                </section>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
                <div className="max-w-md mx-auto">
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className={`w-full text-white font-bold py-4 rounded-xl flex justify-center items-center px-6 transition-transform shadow-lg ${isProcessing ? 'bg-gray-400' : 'bg-greenbond-600 hover:bg-greenbond-700 active:scale-95'}`}
                    >
                        {isProcessing ? (
                            <span className="animate-pulse">Processing...</span>
                        ) : (
                            <>
                                <span>Pay ₹{total.toFixed(2)}</span>
                                <span className="ml-2">→</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
