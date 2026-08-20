import React, { createContext, useState, useEffect, useContext } from 'react';

const LocationContext = createContext();

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null); // { lat, lng, address }
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        // Load saved location on mount
        const savedLocation = localStorage.getItem('green_bond_location');
        if (savedLocation) {
            setLocation(JSON.parse(savedLocation));
            setPermissionGranted(true);
        }
    }, []);

    const requestLocation = () => {
        setIsFetching(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    try {
                        // Reverse geocoding using Nominatim (OpenStreetMap)
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                        const data = await response.json();
                        
                        const address = data.display_name || 'Unknown Location';
                        const newLoc = { lat, lng, address };
                        setLocation(newLoc);
                        localStorage.setItem('green_bond_location', JSON.stringify(newLoc));
                        setPermissionGranted(true);
                    } catch (error) {
                        console.error('Error reverse geocoding:', error);
                        // Fallback
                        const newLoc = { lat, lng, address: 'Location detected' };
                        setLocation(newLoc);
                        localStorage.setItem('green_bond_location', JSON.stringify(newLoc));
                        setPermissionGranted(true);
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

    const manuallySetLocation = (lat, lng, address) => {
        const newLoc = { lat, lng, address };
        setLocation(newLoc);
        localStorage.setItem('green_bond_location', JSON.stringify(newLoc));
        setPermissionGranted(true);
    };

    return (
        <LocationContext.Provider value={{ location, permissionGranted, requestLocation, manuallySetLocation, isFetching }}>
            {children}
        </LocationContext.Provider>
    );
};
