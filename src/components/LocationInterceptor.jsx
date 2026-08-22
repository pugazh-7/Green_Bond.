import React, { useState } from 'react';
import { useLocationContext } from '../context/LocationContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

let DefaultIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationInterceptor = ({ children }) => {
    const { location, permissionGranted, requestLocation, isFetching, manuallySetLocation } = useLocationContext();
    const [showManual, setShowManual] = useState(false);
    const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Default Chennai
    const [selectedAddress, setSelectedAddress] = useState('Chennai, Tamil Nadu');

    const LocationPicker = () => {
        useMapEvents({
            click: async (e) => {
                const { lat, lng } = e.latlng;
                setMapCenter([lat, lng]);
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                    const data = await response.json();
                    setSelectedAddress(data.display_name || 'Selected Location');
                } catch (err) {
                    setSelectedAddress('Selected Location');
                }
            },
        });
        return <Marker position={mapCenter} />;
    };

    if (location && permissionGranted) {
        return children;
    }

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
                <div className="w-24 h-24 bg-greenbond-100 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">📍</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">Where should we deliver?</h1>
                <p className="text-gray-500 mb-8 max-w-sm text-sm">
                    GreenBond offers blazing fast delivery and direct farmer produce based on your location.
                </p>

                <div className="w-full max-w-md space-y-4">
                    <button 
                        onClick={requestLocation}
                        disabled={isFetching}
                        className="w-full bg-greenbond-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-greenbond-700 transition flex items-center justify-center space-x-2"
                    >
                        {isFetching ? (
                            <span className="animate-pulse">Detecting...</span>
                        ) : (
                            <>
                                <span>🎯</span>
                                <span>Use Current Location</span>
                            </>
                        )}
                    </button>

                    <button 
                        onClick={() => setShowManual(true)}
                        className="w-full bg-white text-greenbond-600 border border-greenbond-200 font-bold py-4 px-6 rounded-xl hover:bg-greenbond-50 transition"
                    >
                        Search Location Manually
                    </button>
                </div>
            </div>

            {/* Bottom Sheet for Manual Location */}
            {showManual && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex items-end animate-in fade-in duration-300">
                    <div className="bg-white w-full h-[85vh] rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold font-display">Select Delivery Location</h2>
                            <button onClick={() => setShowManual(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 relative bg-gray-100">
                            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationPicker />
                            </MapContainer>
                        </div>
                        <div className="p-4 bg-white border-t safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                            <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Delivering to</p>
                            <p className="font-medium text-gray-900 mb-4 line-clamp-2 text-sm">{selectedAddress}</p>
                            <button 
                                onClick={() => manuallySetLocation(mapCenter[0], mapCenter[1], selectedAddress)}
                                className="w-full bg-greenbond-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationInterceptor;
