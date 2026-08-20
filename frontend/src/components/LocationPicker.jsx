import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);
    return null;
}

const LocationPicker = ({ onLocationChange, defaultLocation = null }) => {
    const [position, setPosition] = useState(defaultLocation);
    const [address, setAddress] = useState(defaultLocation?.address || '');
    const [isDetecting, setIsDetecting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initial position if none
    useEffect(() => {
        if (!position) {
            // Default to Tiruvannamalai center
            setPosition({ lat: 12.2253, lng: 79.0747 });
        }
    }, [position]);

    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
                onLocationChange({ lat, lng, address: data.display_name });
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.length > 3) {
            setIsSearching(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectResult = (result) => {
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setPosition(newPos);
        setAddress(result.display_name);
        setSearchQuery('');
        setSearchResults([]);
        onLocationChange({ lat: newPos.lat, lng: newPos.lng, address: result.display_name });
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setIsDetecting(true);
        toast.loading('Detecting location...', { id: 'loc-detect' });

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                toast.success('Location detected', { id: 'loc-detect' });
                setIsDetecting(false);
                reverseGeocode(newPos.lat, newPos.lng);
            },
            (err) => {
                setIsDetecting(false);
                toast.error('Location permission denied or unavailable', { id: 'loc-detect' });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const markerRef = useRef(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const newPos = marker.getLatLng();
                setPosition(newPos);
                reverseGeocode(newPos.lat, newPos.lng);
            }
        },
    };

    return (
        <div className="space-y-5 w-full bg-white p-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-gray-900 font-heading tracking-tight">Delivery Address</h3>
                <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-all active:scale-95"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {isDetecting ? 'Detecting...' : 'Use Current Location'}
                </button>
            </div>
            
            <div className="relative z-20">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for area, street, city or PIN code"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-green-500 focus:ring-0 bg-gray-50 text-gray-800 transition-colors shadow-sm"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                {searchResults.length > 0 && (
                    <ul className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-h-64 overflow-y-auto overflow-hidden divide-y divide-gray-50">
                        {searchResults.map((result, idx) => (
                            <li 
                                key={idx} 
                                onClick={() => handleSelectResult(result)}
                                className="px-5 py-4 hover:bg-green-50 cursor-pointer text-sm text-gray-700 transition-colors flex items-start gap-3"
                            >
                                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                <span>{result.display_name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-[280px] w-full rounded-3xl overflow-hidden border-2 border-green-50 shadow-inner relative z-10">
                {position && (
                    <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker 
                            draggable={true}
                            eventHandlers={eventHandlers}
                            position={position}
                            ref={markerRef}
                        />
                        <MapUpdater position={position} />
                    </MapContainer>
                )}
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white z-[400] text-sm text-center font-medium text-gray-700">
                    Drag marker to adjust exact location
                </div>
            </div>

            {address && (
                <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100 flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-xl text-green-600 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Selected Location</p>
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">{address}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
