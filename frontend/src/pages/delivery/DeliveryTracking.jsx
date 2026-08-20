import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const bikeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
});

const homeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
};

const DeliveryTracking = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState(null);

    const [deliveryLoc, setDeliveryLoc] = useState({ lat: 13.0827, lng: 80.2707 });
    const [destination, setDestination] = useState({ lat: 13.0600, lng: 80.2400 }); 
    const [eta, setEta] = useState(15); 
    const [isNavigating, setIsNavigating] = useState(false);
    
    const [otpInput, setOtpInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setDeliveryLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const fetchOrder = async () => {
        if (!orderId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/delivery-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const found = data.find(o => o.id === orderId);
                if (found) {
                    setOrder(found);
                    if (found.deliveryLat && found.deliveryLng) {
                         setDestination({ lat: found.deliveryLat, lng: found.deliveryLng });
                    } else if (found.deliveryLocation?.lat) {
                         setDestination({ lat: found.deliveryLocation.lat, lng: found.deliveryLocation.lng });
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching order:', err);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // Live GPS
    useEffect(() => {
        if (!order || !isNavigating || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setDeliveryLoc(newLocation);
            },
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [order, isNavigating]);

    const handleVerifyOtp = async (type) => {
        if (!otpInput) {
            toast.error("Please enter the 6-digit OTP.");
            return;
        }

        setIsSubmitting(true);
        const endpoint = type === 'pickup' ? 'verify-pickup-otp' : 'verify-delivery-otp';
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${order.id}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ otp: otpInput })
            });

            if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
                setOtpInput('');
                
                if (type === 'pickup') {
                    toast.success("Pickup Verified! Order is now Out for Delivery.");
                    setIsNavigating(true);
                } else {
                    toast.success("Delivery Verified Successfully!");
                    setIsNavigating(false);
                    setTimeout(() => navigate('/delivery/orders'), 2000);
                }
            } else {
                const data = await res.json();
                toast.error(data.message || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('OTP Verification Error:', error);
            toast.error('Server error during OTP verification.');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (!order) return <div className="p-8 font-bold text-gray-500 text-center mt-20">Loading order tracking data...</div>;

    const isPickupPhase = order.status === 'DELIVERY_ASSIGNED' || order.status === 'READY_FOR_PICKUP';
    const isDeliveryPhase = order.status === 'OUT_FOR_DELIVERY';
    const isCompleted = order.status === 'DELIVERED';

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {!isCompleted && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                        {isCompleted ? 'Delivery Completed' : 'Live Navigation'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Order {order.id} • {order.customerName}</p>
                </div>
                <button
                    onClick={() => navigate('/delivery/orders')}
                    className="text-gray-500 hover:text-gray-900 font-medium px-4 py-2 hover:bg-gray-100 rounded-lg"
                >
                    Close
                </button>
            </header>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative">

                {/* Map */}
                <div className="h-[400px] w-full z-0">
                    <MapContainer
                        center={[deliveryLoc.lat, deliveryLoc.lng]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        />
                        <RecenterAutomatically lat={deliveryLoc.lat} lng={deliveryLoc.lng} />

                        <Marker position={[deliveryLoc.lat, deliveryLoc.lng]} icon={bikeIcon}>
                            <Popup className="font-bold">You</Popup>
                        </Marker>

                        <Marker position={[destination.lat, destination.lng]} icon={homeIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">{isPickupPhase ? 'Farmer Location' : 'Customer Location'}</p>
                                </div>
                            </Popup>
                        </Marker>

                        <Polyline
                            positions={[ [deliveryLoc.lat, deliveryLoc.lng], [destination.lat, destination.lng] ]}
                            pathOptions={{ color: 'blue', weight: 4, dashArray: '10, 10', opacity: 0.6 }}
                        />
                    </MapContainer>
                </div>

                {/* Info Card */}
                <div className="bg-white p-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] relative z-[1000] mt-[-20px]">
                    
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                            {isPickupPhase ? '🚜' : '🏠'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{isPickupPhase ? 'Head to Farmer' : `Deliver to ${order.customerName}`}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{isPickupPhase ? order.pickupAddress : order.deliveryAddress}</p>
                        </div>
                        <button className="ml-auto w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200">
                            📞
                        </button>
                    </div>

                    {/* OTP Workflows */}
                    <div className="space-y-4">
                        {isPickupPhase && (
                            <div className="border border-orange-200 bg-orange-50 p-4 rounded-xl">
                                <h4 className="font-bold text-orange-800 mb-2">Farmer Pickup OTP</h4>
                                <p className="text-sm text-orange-700 mb-4">Enter the 6-digit OTP provided by the Farmer to confirm pickup.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        maxLength={6} 
                                        placeholder="------"
                                        value={otpInput}
                                        onChange={e => setOtpInput(e.target.value)}
                                        className="flex-1 text-center font-mono text-2xl tracking-[0.5em] font-bold py-3 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                    />
                                    <button 
                                        disabled={isSubmitting}
                                        onClick={() => handleVerifyOtp('pickup')}
                                        className="px-6 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:bg-orange-400"
                                    >
                                        Verify
                                    </button>
                                </div>
                            </div>
                        )}

                        {isDeliveryPhase && (
                            <div className="border border-green-200 bg-green-50 p-4 rounded-xl">
                                <h4 className="font-bold text-green-800 mb-2">Customer Delivery OTP</h4>
                                <p className="text-sm text-green-700 mb-4">Enter the 6-digit OTP provided by the Customer to complete delivery.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        maxLength={6} 
                                        placeholder="------"
                                        value={otpInput}
                                        onChange={e => setOtpInput(e.target.value)}
                                        className="flex-1 text-center font-mono text-2xl tracking-[0.5em] font-bold py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    />
                                    <button 
                                        disabled={isSubmitting}
                                        onClick={() => handleVerifyOtp('delivery')}
                                        className="px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-400"
                                    >
                                        Deliver
                                    </button>
                                </div>
                            </div>
                        )}

                        {isCompleted && (
                            <div className="text-center py-4 bg-green-100 text-green-800 font-bold rounded-xl border border-green-200">
                                Delivery Verified & Completed!
                            </div>
                        )}

                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${deliveryLoc.lat},${deliveryLoc.lng}&destination=${destination.lat},${destination.lng}`, '_blank')}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13 21.414a1 1 0 01-1.414 0l-4.657-4.757a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Open in Google Maps
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTracking;
