import React, { useState, useEffect } from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LocationSelectorModal = () => {
    const { 
        showLocationModal, 
        setShowLocationModal, 
        requestLocation, 
        manuallySetLocation, 
        isFetching 
    } = useLocationContext();
    
    const { user } = useAuth();
    
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (showLocationModal && user) {
            fetchSavedAddresses();
        }
    }, [showLocationModal, user]);

    const fetchSavedAddresses = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/user/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSavedAddresses(data);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            toast.error("Failed to search location");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchedLocation = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        const address = place.display_name;
        const area = place.address?.suburb || place.address?.neighbourhood || place.address?.village || '';
        const city = place.address?.city || place.address?.town || place.address?.county || '';
        const pincode = place.address?.postcode || '';
        const state = place.address?.state || '';

        manuallySetLocation({
            lat, lng, address, area, city, pincode, state, label: 'Selected Location'
        });
    };

    const handleSelectSavedAddress = (addr) => {
        manuallySetLocation({
            lat: addr.location?.coordinates?.[1] || 0,
            lng: addr.location?.coordinates?.[0] || 0,
            address: addr.addressLine,
            area: addr.area || '',
            city: addr.city || '',
            pincode: addr.pincode || '',
            state: addr.state || '',
            label: addr.label || 'Saved Address'
        });
    };

    if (!showLocationModal) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setShowLocationModal(false)}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up sm:animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Select delivery location</h2>
                    <button 
                        onClick={() => setShowLocationModal(false)}
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {/* GPS Option */}
                    <button 
                        onClick={requestLocation}
                        disabled={isFetching}
                        className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 border border-green-100 rounded-xl transition-colors mb-6 text-left group"
                    >
                        <div className="p-2 bg-green-100 text-green-700 rounded-full group-hover:bg-green-200 transition-colors">
                            {isFetching ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-green-800">Use current location</p>
                            <p className="text-xs text-green-600">Using GPS</p>
                        </div>
                    </button>

                    {/* Search */}
                    <div className="mb-6">
                        <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">Search area or pincode</p>
                        <form onSubmit={handleSearch} className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
                                placeholder="e.g. Ambattur, Chennai"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <span className="text-sm font-semibold text-green-600 hover:text-green-700">Search</span>
                            </button>
                        </form>

                        {/* Search Results */}
                        {isSearching && <p className="text-sm text-gray-500 mt-3 text-center">Searching...</p>}
                        {searchResults.length > 0 && (
                            <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden bg-white">
                                {searchResults.map((place, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSearchedLocation(place)}
                                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                    >
                                        <p className="font-medium text-gray-800 text-sm truncate">{place.display_name.split(',')[0]}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{place.display_name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && (
                        <div>
                            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">Saved Addresses</p>
                            <div className="space-y-2">
                                {savedAddresses.map((addr) => (
                                    <button
                                        key={addr._id}
                                        onClick={() => handleSelectSavedAddress(addr)}
                                        className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 border border-gray-100 rounded-xl text-left transition-colors"
                                    >
                                        <span className="text-xl mt-0.5">
                                            {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">{addr.label || 'Address'}</p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                {addr.addressLine}, {addr.area && `${addr.area}, `}{addr.city}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationSelectorModal;
