import { useAuth } from '../../context/AuthContext';
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

let DefaultIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ position }) => {
    const { accessToken } = useAuth();
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 14);
        }
    }, [position, map]);
    return null;
};

const UserOrders = () => {
    const [latestOrder, setLatestOrder] = useState(null);
    const [previousOrders, setPreviousOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const pollTimerRef = useRef(null);

    const fetchOrders = async (isPolling = false) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/my-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setLatestOrder(data[0]);
                    setPreviousOrders(data.slice(1));
                } else {
                    setLatestOrder(null);
                    setPreviousOrders([]);
                }
            }
        } catch (error) {
            if (!isPolling) console.error('Failed to fetch orders:', error);
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        
        // Socket.IO for real-time updates
        const token = localStorage.getItem('token');
        let userId = null;
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                userId = payload.id;
            } catch (e) {}
        }
        
        const socket = io(import.meta.env.VITE_API_URL || '');
        if (userId) {
            socket.emit('join', userId);
            socket.on('order_update', () => {
                fetchOrders(true);
            });
        }
        
        pollTimerRef.current = setInterval(() => {
            fetchOrders(true);
        }, 60000); // 60s fallback sync

        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            socket.disconnect();
        };
    }, []);

    // Stop polling if delivered or cancelled
    useEffect(() => {
        if (latestOrder && ['DELIVERED', 'CANCELLED'].includes(latestOrder.status)) {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
        }
    }, [latestOrder]);

    const [trackingLoc, setTrackingLoc] = useState(null);

    useEffect(() => {
        if (!latestOrder) return;
        
        // Dynamic map location based on order status for simulation since we don't have real live driver GPS
        let lat = 13.0827, lng = 80.2707; 
        const status = latestOrder.status;
        if (['PLACED'].includes(status)) { lat = 13.1000; lng = 80.3000; } // Farm Location
        else if (['FARMER_ACCEPTED', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(status)) { lat = 13.0900; lng = 80.2800; } // Packing
        else if (['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(status)) { lat = 13.0850; lng = 80.2750; } // En route
        else if (['DELIVERED'].includes(status)) { lat = 13.0827; lng = 80.2707; } // Destination
        
        setTrackingLoc({ lat, lng });
    }, [latestOrder]);

    const handleCancelOrder = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[250px]">
                <p className="font-semibold text-gray-900">Cancel this order?</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        No, keep it
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmCancelOrder();
                        }}
                        className="px-3 py-1.5 text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                        Yes, cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: { borderRadius: '16px', padding: '16px', background: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid #f3f4f6' }
        });
    };

    const confirmCancelOrder = async () => {
        if (!latestOrder) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/${latestOrder.id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ status: 'CANCELLED' })
            });
            if (res.ok) {
                setLatestOrder({ ...latestOrder, status: 'CANCELLED' });
                toast.success("Order cancelled successfully.");
            } else {
                toast.error("Failed to cancel order.");
            }
        } catch (err) {
            toast.error("Network error.");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatShortTime = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const calculateETA = (createdAt) => {
        if (!createdAt) return "TBD";
        const createdTime = new Date(createdAt);
        createdTime.setHours(createdTime.getHours() + 4); // 4 hour delivery window
        
        const now = new Date();
        const isToday = createdTime.getDate() === now.getDate() && createdTime.getMonth() === now.getMonth() && createdTime.getFullYear() === now.getFullYear();
        const timeString = createdTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
        
        if (isToday) return `Today, ${timeString}`;
        
        now.setDate(now.getDate() + 1);
        const isTomorrow = createdTime.getDate() === now.getDate() && createdTime.getMonth() === now.getMonth() && createdTime.getFullYear() === now.getFullYear();
        
        if (isTomorrow) return `Tomorrow, ${timeString}`;
        
        return `${createdTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}, ${timeString}`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto text-center py-20 flex justify-center">
                <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!latestOrder) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto text-center py-20">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Orders</h2>
                    <p className="text-gray-500 mb-8">You haven't placed any orders yet. Visit the marketplace to get fresh produce.</p>
                    <a href="#/user/marketplace" className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                        Go to Marketplace
                    </a>
                </div>
            </div>
        );
    }

    const orderId = latestOrder.id;
    const orderDate = formatDate(latestOrder.createdAt);
    const eta = calculateETA(latestOrder.createdAt);
    const etaShortTime = calculateETA(latestOrder.createdAt).split(', ').pop();
    const items = latestOrder.items || [];
    const s = latestOrder.status;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Track Your Order</h1>
                <p className="text-gray-500 mt-1">Order {orderId} • Placed on {orderDate}</p>
            </header>

            {/* Main Tracking Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Map Section */}
                <div className="h-80 w-full relative z-0">
                    <MapContainer
                        center={[13.0827, 80.2707]}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {trackingLoc && <MapController position={trackingLoc} />}
                        <Marker position={[trackingLoc?.lat || 13.0827, trackingLoc?.lng || 80.2707]}>
                            <Popup className="custom-popup">
                                <div className="font-bold text-blue-700 underline mb-1">Live Delivery Partner</div>
                                <div className="text-xs text-gray-600">Arriving at your location soon.</div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                    <div className="absolute top-4 right-4 z-[400]">
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-green-800">Live Tracking</span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* ETA Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estimated Delivery</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-1">{eta}</h2>
                            <p className="text-green-600 font-medium mt-1">
                                {s === 'DELIVERED' ? 'Delivered successfully' : 'On Time'}
                            </p>
                        </div>
                        <div className="flex -space-x-4">
                            {items.map((item, i) => (
                                <img key={i} className="w-12 h-12 rounded-full border-4 border-white shadow-sm object-cover" src={item.image} alt={item.title} title={item.title} />
                            ))}
                        </div>
                    </div>

                    {s === 'OUT_FOR_DELIVERY' && latestOrder.deliveryOtp && (
                        <div className="mb-8 border border-green-200 bg-green-50 p-4 rounded-xl flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-green-800">Delivery Security PIN</h4>
                                <p className="text-sm text-green-700">Provide this to the partner to receive your order.</p>
                            </div>
                            <div className="bg-white border border-green-300 px-4 py-2 rounded-lg font-mono text-3xl font-black text-green-700 tracking-[0.2em] shadow-inner">
                                {latestOrder.deliveryOtp}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                        <div className="space-y-8 relative">
                            {/* Step 1: Order Placed */}
                            <div className="flex gap-6 relative">
                                <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm bg-green-100`}>
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Order Placed</h4>
                                    <p className="text-sm text-gray-500">{orderDate}</p>
                                </div>
                            </div>

                            {/* Step 2: Packed by Farmer (Accepted / Ready / Assigned) */}
                            <div className="flex gap-6 relative">
                                {['FARMER_ACCEPTED', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(s) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['FARMER_ACCEPTED', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(s) ? 'text-blue-600' : ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s) ? 'text-gray-900' : 'text-gray-400'}`}>
                                        Packed by Farmer
                                    </h4>
                                    <p className={`text-sm ${['FARMER_ACCEPTED', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(s) ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                        {['FARMER_ACCEPTED', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s) && latestOrder.acceptedAt
                                            ? `Packed at ${formatShortTime(latestOrder.acceptedAt)}`
                                            : 'Pending'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Out for Delivery */}
                            <div className="flex gap-6 relative">
                                {['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                    </div>
                                ) : ['DELIVERED'].includes(s) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s) ? 'text-blue-600' : ['DELIVERED'].includes(s) ? 'text-gray-900' : 'text-gray-400'}`}>
                                        Out for Delivery
                                    </h4>
                                    <p className={`text-sm ${['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(s) ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                        {['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(s) && latestOrder.shippedAt
                                            ? `Left at ${formatShortTime(latestOrder.shippedAt)}`
                                            : 'Estimated'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Step 4: Delivered */}
                            <div className="flex gap-6 relative">
                                {['DELIVERED'].includes(s) ? (
                                    <div className="z-10 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center border-4 border-green-100 shadow-xl ring-4 ring-green-50">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                ) : (
                                    <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                )}
                                <div>
                                    <h4 className={`font-bold ${['DELIVERED'].includes(s) ? 'text-green-600' : 'text-gray-400'}`}>Delivered</h4>
                                    <p className="text-sm text-gray-500">
                                        {['DELIVERED'].includes(s) && latestOrder.deliveredAt 
                                            ? formatDate(latestOrder.deliveredAt)
                                            : `Expected by ${etaShortTime}`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button className="text-gray-600 font-semibold hover:text-gray-900 text-sm">Need Help?</button>
                    <div className="flex gap-4">
                        {['PLACED'].includes(s) && (
                            <button
                                onClick={handleCancelOrder}
                                className="px-6 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                            >
                                Cancel Order
                            </button>
                        )}
                        <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                            Call Delivery Partner
                        </button>
                    </div>
                </div>
            </div>

            {/* Previous Orders History */}
            {previousOrders.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Orders</h2>
                    <div className="space-y-4">
                        {previousOrders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-900">Order {order.id}</p>
                                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)} • {order.items.length} Items</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full mb-1 ${
                                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-50 text-blue-700'
                                    }`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </span>
                                    <p className="text-sm font-semibold text-gray-900">{order.total}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserOrders;



