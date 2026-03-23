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

// Custom icons
const bikeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png', // Vibrant 3D Delivery Scooter
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
});

const homeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', // Home icon
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Component to recenter map
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

    // Initial coordinates (Chennai fallback)
    const [deliveryLoc, setDeliveryLoc] = useState({ lat: 13.0827, lng: 80.2707 });
    const [destination, setDestination] = useState({ lat: 13.0600, lng: 80.2400 }); 
    const [eta, setEta] = useState(15); 
    const [isNavigating, setIsNavigating] = useState(false);

    // Get initial real location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setDeliveryLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    useEffect(() => {
        const allOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]');
        let foundOrder = null;

        if (orderId) {
            foundOrder = allOrders.find(o => o.id === orderId);
        } else {
            // Default active order
            foundOrder = allOrders.find(o => ['Accepted', 'Shipped'].includes(o.status));
            if (!foundOrder) {
                foundOrder = {
                    id: "ORD-DEMO",
                    customer: "Demo Customer",
                    address: "Anna Nagar, Chennai",
                    mobile: "9988776655",
                    status: "Shipped"
                };
            }
        }
        setOrder(foundOrder);

        // Mocking destination based on order (in valid app, geocode address)
        // For demo, we keep the static destination above or randomize slightly
        // setDestination({ lat: 13.0600 + Math.random() * 0.01, lng: 80.2400 + Math.random() * 0.01 });

    }, [orderId]);

    // Live Location Tracking (Real GPS)
    useEffect(() => {
        if (!order || !isNavigating || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const newLocation = { lat: latitude, lng: longitude };
                setDeliveryLoc(newLocation);

                // Update LocalStorage for "User" to see
                localStorage.setItem(`tracking_${order.id}`, JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                    lastUpdated: new Date().toISOString()
                }));

                // Update ETA (Simple approximation: distance / speed)
                // For demo, we just decrease it slightly or keep it dynamic
            },
            (err) => {
                console.error("GPS Error:", err);
                toast.error("GPS Signal Lost");
            },
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [order, isNavigating]);


    if (!order) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Live Navigation
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Order #{order.id} • {order.customer}</p>
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
                <div className="h-[500px] w-full z-0">
                    <MapContainer
                        center={[deliveryLoc.lat, deliveryLoc.lng]}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                        />
                        <RecenterAutomatically lat={deliveryLoc.lat} lng={deliveryLoc.lng} />

                        {/* Delivery Boy Marker */}
                        <Marker position={[deliveryLoc.lat, deliveryLoc.lng]} icon={bikeIcon}>
                            <Popup className="font-bold">You (Delivery Partner)</Popup>
                        </Marker>

                        {/* Customer Marker */}
                        <Marker position={[destination.lat, destination.lng]} icon={homeIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-bold">{order.customer}</p>
                                    <p>{order.address}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Route Line */}
                        <Polyline
                            positions={[
                                [deliveryLoc.lat, deliveryLoc.lng],
                                [destination.lat, destination.lng]
                            ]}
                            pathOptions={{ color: 'blue', weight: 4, dashArray: '10, 10', opacity: 0.6 }}
                        />
                    </MapContainer>
                </div>

                {/* Floating Info Card (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[1000]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Estimated Arrival</p>
                            <h2 className="text-3xl font-extrabold text-gray-900">{Math.ceil(eta)} mins</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Distance</p>
                            <h2 className="text-xl font-bold text-gray-700">2.4 km</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                            🏠
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{order.customer}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{order.address || "123, Green Street, Chennai"}</p>
                        </div>
                        <button className="ml-auto w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200">
                            📞
                        </button>
                    </div>

                    <div className="flex gap-3">
                        {order.status === 'Accepted' && (
                            <button
                                onClick={() => {
                                    const updatedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]').map(o =>
                                        o.id === order.id ? { ...o, status: 'Shipped' } : o
                                    );
                                    localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));
                                    setOrder({ ...order, status: 'Shipped' });
                                    setIsNavigating(true);
                                    window.open(`https://www.google.com/maps/dir/?api=1&origin=${deliveryLoc.lat},${deliveryLoc.lng}&destination=${destination.lat},${destination.lng}`, '_blank');
                                    toast.success("Trip Started! Status: Out for Delivery");
                                }}
                                className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-green-200 shadow-xl hover:bg-green-700 transition-all"
                            >
                                Start Trip (Pickup)
                            </button>
                        )}

                        {order.status === 'Shipped' && (
                            <button
                                onClick={() => {
                                    const updatedOrders = JSON.parse(localStorage.getItem('green_bond_orders') || '[]').map(o =>
                                        o.id === order.id ? { ...o, status: 'Delivered' } : o
                                    );
                                    localStorage.setItem('green_bond_orders', JSON.stringify(updatedOrders));
                                    setOrder({ ...order, status: 'Delivered' });
                                    setIsNavigating(false);
                                    toast.success("Order Delivered Successfully!");
                                    setTimeout(() => navigate('/delivery'), 2000);
                                }}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-blue-200 shadow-xl hover:bg-blue-700 transition-all"
                            >
                                Mark Delivered
                            </button>
                        )}

                        {order.status === 'Delivered' && (
                            <button
                                disabled
                                className="flex-1 py-4 bg-gray-400 text-white rounded-xl font-bold text-lg cursor-not-allowed"
                            >
                                Delivery Completed
                            </button>
                        )}

                        <button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${deliveryLoc.lat},${deliveryLoc.lng}&destination=${destination.lat},${destination.lng}`, '_blank')}
                            className="w-16 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13 21.414a1 1 0 01-1.414 0l-4.657-4.757a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryTracking;
