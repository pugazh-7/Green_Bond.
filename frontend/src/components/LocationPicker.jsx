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
        <div className="space-y-4 w-full bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">Delivery Address</h3>
                <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {isDetecting ? 'Detecting...' : 'Use Current Location'}
                </button>
            </div>
            
            <div className="relative z-20">
                <input
                    type="text"
                    placeholder="Search for area, street, city or PIN code"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                />
                {searchResults.length > 0 && (
                    <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                            <li 
                                key={idx} 
                                onClick={() => handleSelectResult(result)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-gray-700"
                            >
                                {result.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-10">
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
            </div>

            {address && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Selected Location</p>
                    <p className="text-sm text-gray-800">{address}</p>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
