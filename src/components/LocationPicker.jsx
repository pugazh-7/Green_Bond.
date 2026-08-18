import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

const LocationPicker = ({ onLocationChange, defaultLocation = null }) => {
    const [position, setPosition] = useState(defaultLocation);
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
        if (position) {
            onLocationChange({ lat: position.lat, lng: position.lng, address });
        }
    }, [position, address]);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            setStatus('Geolocation is not supported by your browser');
            return;
        }

        setIsDetecting(true);
        setStatus('Requesting location...');

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setPosition(newPos);
                setStatus('Location detected');
                setIsDetecting(false);
            },
            (err) => {
                setIsDetecting(false);
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        setStatus("Location permission denied");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setStatus("Location information is unavailable");
                        break;
                    case err.TIMEOUT:
                        setStatus("The request to get user location timed out");
                        break;
                    default:
                        setStatus("An unknown error occurred");
                        break;
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="space-y-3 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-sm font-medium text-gray-700">Service Location</label>
                <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                    {isDetecting ? 'Detecting...' : 'Use Current Location'}
                </button>
            </div>
            
            {status && (
                <p className={`text-xs ${status.includes('denied') || status.includes('error') || status.includes('timed out') || status.includes('unavailable') ? 'text-red-500' : 'text-green-600'}`}>
                    {status}
                </p>
            )}

            <input
                type="text"
                placeholder="Enter Address, Area or Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />

            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative z-0">
                {position ? (
                    <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 text-sm">
                        Map will appear here once location is detected
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationPicker;
