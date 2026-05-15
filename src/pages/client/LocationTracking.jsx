import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

let DefaultIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom hook to handle map recentering
const MapController = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { animate: true });
        }
    }, [position, map]);
    return null;
};

const LocationTracking = () => {
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock data for farmer view
    const activeDelivery = {
        id: "ORD-9876",
        customer: "Ramesh Hotel",
        vehicle: "Tata Ace (TN-59-AB-1234)",
        driver: "Muthu Kumar",
        status: "Out for Delivery",
        eta: "Today, 5:30 PM"
    };

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        const handleSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            setPosition([latitude, longitude]);
            setLoading(false);
        };

        const handleError = (err) => {
            setError("Unable to retrieve your location. Showing default location.");
            // Fallback to Chennai coordinates
            setPosition([13.0827, 80.2707]);
            setLoading(false);
            console.error("Geolocation Error:", err);
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });

        // Also track live position
        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Live Delivery Tracking</h1>
                <p className="text-gray-500 mt-1">Vehicle {activeDelivery.vehicle} • Driver {activeDelivery.driver}</p>
            </header>

            {/* Main Tracking Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
{/* Live Map View */}
<div className="h-80 w-full relative overflow-hidden rounded-t-3xl bg-gray-100">
    {loading ? (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-500 font-medium">Detecting your location...</span>
        </div>
    ) : position && (
            <MapContainer 
                center={position} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController position={position} />
                <Marker position={position}>
                    <Popup className="custom-popup">
                        <div className="font-bold text-green-700">You are here</div>
                        <div className="text-xs text-gray-500">Live tracking active</div>
                    </Popup>
                </Marker>
                
                {/* Control Buttons Overlay */}
                <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                    <button 
                        onClick={() => setPosition([...position])} // Trigger recenter
                        className="bg-white p-3 rounded-full shadow-2xl hover:bg-gray-50 transition-all border border-gray-100 flex items-center justify-center group"
                        title="Recenter Map"
                    >
                        <svg className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                {/* Real-time sync indicator */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-blue-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-700">
                        Live GPS Active
                    </span>
                </div>
            </MapContainer>
    )}

    {error && !loading && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-red-50 text-red-700 px-4 py-2 rounded-lg text-xs font-medium border border-red-100 shadow-sm">
            {error}
        </div>
    )}
</div>


                <div className="p-8">
                    {/* ETA Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Estimated Arrival</p>
                            <h2 className="text-4xl font-extrabold text-gray-900 mt-1">{activeDelivery.eta}</h2>
                            <p className="text-green-600 font-medium mt-1">On Time</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"></div>
                        <div className="space-y-8 relative">
                            {/* Step 1 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Order Dispatched</h4>
                                    <p className="text-sm text-gray-500">10:00 AM</p>
                                </div>
                            </div>
                            {/* Step 2 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">In Transit</h4>
                                    <p className="text-sm text-gray-500">Crossed Trichy Toll</p>
                                </div>
                            </div>
                            {/* Step 3 (Active) */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-xl ring-4 ring-blue-50">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-blue-600">Reaching Destination</h4>
                                    <p className="text-sm text-gray-600">Technopark, Madurai</p>
                                    <p className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block font-medium">Reaching in 15 mins</p>
                                </div>
                            </div>
                            {/* Step 4 */}
                            <div className="flex gap-6 relative">
                                <div className="z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-400">Delivered</h4>
                                    <p className="text-sm text-gray-300">Expected by 5:30 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button className="text-gray-600 font-semibold hover:text-gray-900 text-sm">Download Manifest</button>
                    <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg">
                        Call Driver
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationTracking;
