import React from 'react';
import { useLocationContext } from '../../context/LocationContext';

const LocationHeader = () => {
    const { location, hasResolvedInitialLocation, setShowLocationModal } = useLocationContext();

    const getDisplayLocation = () => {
        if (!location) return 'Select Location';
        if (location.area && location.city) return `${location.area}, ${location.city}`;
        if (location.city) return location.city;
        
        // Truncate long addresses
        if (location.address) {
            const parts = location.address.split(',');
            if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
            return location.address.substring(0, 25) + (location.address.length > 25 ? '...' : '');
        }
        
        return 'Select Location';
    };

    if (!hasResolvedInitialLocation) {
        return (
            <div className="flex items-center gap-1.5 animate-pulse cursor-pointer p-1">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
        );
    }

    return (
        <button 
            onClick={() => setShowLocationModal(true)}
            className="flex flex-col items-start group hover:bg-gray-100/50 p-1.5 rounded-xl transition-colors active-press"
        >
            <div className="flex items-center gap-1 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <span>📍</span>
                <span>Deliver to</span>
                <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            <span className="font-bold text-gray-900 text-sm truncate max-w-[180px] md:max-w-[200px] mt-0.5 font-heading">
                {getDisplayLocation()}
            </span>
        </button>
    );
};

export default LocationHeader;
