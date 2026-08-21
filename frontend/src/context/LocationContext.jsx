import React, { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null); // { lat, lng, address, area, city, pincode, label }
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [hasResolvedInitialLocation, setHasResolvedInitialLocation] = useState(false);

    useEffect(() => {
        const resolveInitialLocation = () => {
            const savedLocation = localStorage.getItem('green_bond_location');
            if (savedLocation && savedLocation !== 'undefined') {
                try {
                    setLocation(JSON.parse(savedLocation));
                    setPermissionGranted(true);
                    setHasResolvedInitialLocation(true);
                    return;
                } catch(e) {
                    console.error("Error parsing location", e);
                }
            }
            
            // If no valid saved location, we must show the modal to get one.
            setShowLocationModal(true);
            setHasResolvedInitialLocation(true); // We resolved that we NEED a location
        };

        resolveInitialLocation();
    }, []);

    const requestLocation = () => {
        setIsFetching(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    try {
                        // Enhanced Reverse Geocoding
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                        const data = await response.json();
                        
                        const address = data.display_name || 'Unknown Location';
                        const area = data.address?.suburb || data.address?.neighbourhood || data.address?.village || '';
                        const city = data.address?.city || data.address?.town || data.address?.county || '';
                        const pincode = data.address?.postcode || '';
                        const state = data.address?.state || '';
                        
                        const newLoc = { 
                            lat, 
                            lng, 
                            address, 
                            area, 
                            city, 
                            pincode,
                            state,
                            label: 'Current Location' 
                        };
                        
                        setLocation(newLoc);
                        localStorage.setItem('green_bond_location', JSON.stringify(newLoc));
                        setPermissionGranted(true);
                        setShowLocationModal(false);
                    } catch (error) {
                        console.error('Error reverse geocoding:', error);
                        // Fallback
                        const newLoc = { lat, lng, address: 'Location detected', label: 'Current Location' };
                        setLocation(newLoc);
                        localStorage.setItem('green_bond_location', JSON.stringify(newLoc));
                        setPermissionGranted(true);
                        setShowLocationModal(false);
                    } finally {
                        setIsFetching(false);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setIsFetching(false);
                    setPermissionGranted(false);
                }
            );
        } else {
            console.error('Geolocation is not supported by this browser.');
            setIsFetching(false);
        }
    };

    const manuallySetLocation = (locData) => {
        // Expected locData format: { lat, lng, address, area, city, pincode, label }
        setLocation(locData);
        localStorage.setItem('green_bond_location', JSON.stringify(locData));
        setPermissionGranted(true);
        setShowLocationModal(false);
    };

    return (
        <LocationContext.Provider value={{ 
            location, 
            permissionGranted, 
            requestLocation, 
            manuallySetLocation, 
            isFetching,
            showLocationModal,
            setShowLocationModal,
            hasResolvedInitialLocation
        }}>
            {children}
        </LocationContext.Provider>
    );
};
