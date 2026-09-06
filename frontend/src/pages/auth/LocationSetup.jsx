import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { apiFetch } from '../../utils/apiFetch';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const GREEN_PIN_URL = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';

const CURATED_INDIAN_LOCATIONS = [
    {
        name: 'Vignesh Hospital',
        lat: 12.2312,
        lon: 79.0688,
        display_name: 'Vignesh Hospital, Polur Road, Thiruvannamalai, Tamil Nadu, 606601, India',
        address: { hospital: 'Vignesh Hospital', road: 'Polur Road', town: 'Thiruvannamalai', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Vignesh Hospital Thiruvannamalai',
        lat: 12.2312,
        lon: 79.0688,
        display_name: 'Vignesh Hospital, Polur Road, Thiruvannamalai, Tamil Nadu, 606601, India',
        address: { hospital: 'Vignesh Hospital', road: 'Polur Road', town: 'Thiruvannamalai', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Thiruvannamalai',
        lat: 12.2253,
        lon: 79.0747,
        display_name: 'Thiruvannamalai, Tamil Nadu, 606601, India',
        address: { town: 'Thiruvannamalai', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Tiruvannamalai',
        lat: 12.2253,
        lon: 79.0747,
        display_name: 'Tiruvannamalai, Tamil Nadu, 606601, India',
        address: { town: 'Tiruvannamalai', city: 'Tiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Arunachaleswarar Temple',
        lat: 12.2251,
        lon: 79.0674,
        display_name: 'Arunachaleswarar Temple, Sannathi Street, Thiruvannamalai, Tamil Nadu, 606601, India',
        address: { place: 'Arunachaleswarar Temple', road: 'Sannathi Street', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Ramana Ashram',
        lat: 12.2132,
        lon: 79.0558,
        display_name: 'Sri Ramanasramam, Chengam Road, Thiruvannamalai, Tamil Nadu, 606603, India',
        address: { place: 'Sri Ramanasramam', road: 'Chengam Road', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606603', country: 'India' }
    },
    {
        name: 'Thiruvannamalai Bus Stand',
        lat: 12.2305,
        lon: 79.0715,
        display_name: 'Central Bus Stand, Tindivanam Road, Thiruvannamalai, Tamil Nadu, 606601, India',
        address: { place: 'Central Bus Stand', road: 'Tindivanam Road', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606601', country: 'India' }
    },
    {
        name: 'Vengikkal',
        lat: 12.2470,
        lon: 79.0820,
        display_name: 'Vengikkal, Thiruvannamalai, Tamil Nadu, 606604, India',
        address: { suburb: 'Vengikkal', city: 'Thiruvannamalai', state: 'Tamil Nadu', postcode: '606604', country: 'India' }
    },
    {
        name: 'Ambattur',
        lat: 13.1143,
        lon: 80.1548,
        display_name: 'Ambattur, Chennai, Tiruvallur, Tamil Nadu, 600053, India',
        address: { suburb: 'Ambattur', city: 'Chennai', state: 'Tamil Nadu', postcode: '600053', country: 'India' }
    },
    {
        name: 'Chennai',
        lat: 13.0827,
        lon: 80.2707,
        display_name: 'Chennai, Tamil Nadu, 600001, India',
        address: { city: 'Chennai', state: 'Tamil Nadu', postcode: '600001', country: 'India' }
    },
    {
        name: 'KK Nagar',
        lat: 13.0373,
        lon: 80.1972,
        display_name: 'Kalaignar Karunanidhi Nagar (KK Nagar), Chennai, Tamil Nadu, 600078, India',
        address: { suburb: 'KK Nagar', city: 'Chennai', state: 'Tamil Nadu', postcode: '600078', country: 'India' }
    },
    {
        name: 'Coimbatore',
        lat: 11.0168,
        lon: 76.9558,
        display_name: 'Coimbatore, Tamil Nadu, 641001, India',
        address: { city: 'Coimbatore', state: 'Tamil Nadu', postcode: '641001', country: 'India' }
    },
    {
        name: 'Madurai',
        lat: 9.9252,
        lon: 78.1198,
        display_name: 'Madurai, Tamil Nadu, 625001, India',
        address: { city: 'Madurai', state: 'Tamil Nadu', postcode: '625001', country: 'India' }
    },
    {
        name: 'Anna Nagar',
        lat: 13.0850,
        lon: 80.2101,
        display_name: 'Anna Nagar, Chennai, Tamil Nadu, 600040, India',
        address: { suburb: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', postcode: '600040', country: 'India' }
    },
    {
        name: 'T Nagar',
        lat: 13.0418,
        lon: 80.2341,
        display_name: 'Thyagaraya Nagar (T Nagar), Chennai, Tamil Nadu, 600017, India',
        address: { suburb: 'T Nagar', city: 'Chennai', state: 'Tamil Nadu', postcode: '600017', country: 'India' }
    }
];

// Helper: Find nearest curated landmark to provide immediate feedback
const findNearestLandmark = (lat, lng) => {
    let nearest = null;
    let minDistance = Infinity;
    for (const item of CURATED_INDIAN_LOCATIONS) {
        const dLat = (item.lat - lat) * (Math.PI / 180);
        const dLng = (item.lon - lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat * (Math.PI / 180)) * Math.cos(item.lat * (Math.PI / 180)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distKm = 6371 * c;
        if (distKm < minDistance) {
            minDistance = distKm;
            nearest = item;
        }
    }
    return { nearest, distKm: minDistance };
};

const LocationSetup = () => {
    const navigate = useNavigate();
    const { user, authStatus, updateUser } = useAuth();
    const { manuallySetLocation, location: contextLocation } = useLocationContext();

    const [googleMapsReady, setGoogleMapsReady] = useState(false);
    const [googleAuthFailed, setGoogleAuthFailed] = useState(false);
    const [googleApiNotice, setGoogleApiNotice] = useState('');
    const [detectingGps, setDetectingGps] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    
    // Default initial location: context location or Thiruvannamalai
    const [selectedLocation, setSelectedLocation] = useState(() => {
        if (contextLocation?.lat && contextLocation?.lng) {
            return {
                ...contextLocation,
                latitude: contextLocation.lat,
                longitude: contextLocation.lng
            };
        }
        return {
            placeId: 'curated-0',
            address: 'Thiruvannamalai, Tamil Nadu, 606601, India',
            latitude: 12.2253,
            longitude: 79.0747,
            lat: 12.2253,
            lng: 79.0747,
            city: 'Thiruvannamalai',
            state: 'Tamil Nadu',
            pincode: '606601',
            country: 'India',
            area: 'Thiruvannamalai',
            label: 'Selected Location'
        };
    });

    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Pin & Map interaction states
    const [isMapMoving, setIsMapMoving] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const mapContainerRef = useRef(null);
    const googleMapInstanceRef = useRef(null);
    const leafletMapInstanceRef = useRef(null);
    
    // Flag to differentiate programmatic center movements vs user dragging
    const isProgrammaticMoveRef = useRef(false);
    const reverseGeocodeTimerRef = useRef(null);

    // Authentication Guard
    useEffect(() => {
        if (authStatus === 'UNAUTHENTICATED') {
            navigate('/login/user', { replace: true });
        }
    }, [authStatus, navigate]);

    // Google Maps Script Loader with Auth Failure Detection
    useEffect(() => {
        window.gm_authFailure = () => {
            console.warn('[LOCATION] Google Maps auth notice. Leaflet map active.');
            setGoogleAuthFailed(true);
            setGoogleApiNotice('Standard geocoding & mapping service active.');
        };

        if (window.google?.maps) {
            setGoogleMapsReady(true);
            return;
        }

        if (!GOOGLE_MAPS_API_KEY) {
            return;
        }

        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
            existingScript.addEventListener('load', () => setGoogleMapsReady(true));
            return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => setGoogleMapsReady(true);
        script.onerror = () => {
            setGoogleAuthFailed(true);
            setGoogleApiNotice('Interactive map active.');
        };

        document.head.appendChild(script);

        return () => {
            if (window.gm_authFailure) {
                window.gm_authFailure = null;
            }
        };
    }, []);

    // Structured address parser from Google address_components
    const parseGoogleAddressComponents = (components, formattedAddress, geometry, placeId) => {
        let streetNumber = '';
        let route = '';
        let sublocality = '';
        let locality = '';
        let district = '';
        let state = '';
        let country = 'India';
        let pincode = '';

        if (Array.isArray(components)) {
            for (const c of components) {
                const types = c.types || [];
                if (types.includes('street_number')) streetNumber = c.long_name;
                if (types.includes('route')) route = c.long_name;
                if (types.includes('sublocality') || types.includes('sublocality_level_1')) sublocality = c.long_name;
                if (types.includes('locality')) locality = c.long_name;
                if (types.includes('administrative_area_level_2')) district = c.long_name;
                if (types.includes('administrative_area_level_1')) state = c.long_name;
                if (types.includes('country')) country = c.long_name;
                if (types.includes('postal_code')) pincode = c.long_name;
            }
        }

        const city = locality || district || sublocality || 'Thiruvannamalai';
        const area = sublocality || route || locality || '';

        const lat = typeof geometry?.location?.lat === 'function' 
            ? geometry.location.lat() 
            : (Number(geometry?.location?.lat) || 0);
        const lng = typeof geometry?.location?.lng === 'function' 
            ? geometry.location.lng() 
            : (Number(geometry?.location?.lng) || 0);

        return {
            placeId: placeId || `loc-${lat.toFixed(5)}-${lng.toFixed(5)}`,
            address: formattedAddress || [route, sublocality, city, state, pincode].filter(Boolean).join(', '),
            latitude: lat,
            longitude: lng,
            lat,
            lng,
            street: route || streetNumber ? `${streetNumber} ${route}`.trim() : '',
            area,
            city,
            district,
            state: state || 'Tamil Nadu',
            country,
            pincode: pincode || '606601',
            label: formattedAddress ? formattedAddress.split(',')[0] : 'Selected Location'
        };
    };

    // Structured address parser from Fallback OpenStreetMap / Nominatim
    const parseFallbackAddress = (place) => {
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon || place.lng);
        const addr = place.address || {};

        const area = addr.suburb || addr.neighbourhood || addr.subdistrict || addr.residential || addr.road || addr.quarter || '';
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || place.name || 'Thiruvannamalai';
        const state = addr.state || 'Tamil Nadu';
        const pincode = addr.postcode || '606601';
        const country = addr.country || 'India';
        const display = place.display_name || `${place.name || city}, Tamil Nadu, India`;

        return {
            placeId: place.place_id ? String(place.place_id) : `loc-${lat.toFixed(5)}-${lng.toFixed(5)}`,
            address: display,
            latitude: lat,
            longitude: lng,
            lat,
            lng,
            street: addr.road || '',
            area,
            city,
            district: addr.state_district || addr.county || city,
            state,
            country,
            pincode,
            label: place.name || area || city || 'Selected Location'
        };
    };

    // Reverse Geocode Handler: Updates the address card when the pin settles on a new position
    const performReverseGeocode = useCallback(async (lat, lng) => {
        setIsGeocoding(true);

        // 1. Google Geocoder (if available)
        if (!googleAuthFailed && window.google?.maps?.Geocoder) {
            try {
                const googleResult = await new Promise((resolve) => {
                    const timer = setTimeout(() => resolve(null), 2000);
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        clearTimeout(timer);
                        if (status === 'OK' && results?.[0]) resolve(results[0]);
                        else resolve(null);
                    });
                });

                if (googleResult) {
                    const parsed = parseGoogleAddressComponents(
                        googleResult.address_components,
                        googleResult.formatted_address,
                        googleResult.geometry,
                        googleResult.place_id
                    );
                    setSelectedLocation(prev => ({
                        ...parsed,
                        lat,
                        lng,
                        latitude: lat,
                        longitude: lng,
                        label: parsed.label || 'Selected Location'
                    }));
                    setIsGeocoding(false);
                    return;
                }
            } catch (gErr) {
                console.warn('[LOCATION] Google reverse geocode notice:', gErr);
            }
        }

        // 2. OpenStreetMap / Nominatim Reverse Geocoding
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && (data.display_name || data.address)) {
                    const parsed = parseFallbackAddress(data);
                    setSelectedLocation(prev => ({
                        ...parsed,
                        lat,
                        lng,
                        latitude: lat,
                        longitude: lng,
                        label: parsed.label || 'Selected Location'
                    }));
                    setIsGeocoding(false);
                    return;
                }
            }
        } catch (err) {
            console.warn('[LOCATION] Nominatim reverse geocode notice:', err.message);
        }

        // 3. Fallback: Proximity Landmark Resolution
        const { nearest, distKm } = findNearestLandmark(lat, lng);
        if (nearest && distKm < 0.6) {
            const label = distKm < 0.1 ? nearest.name : `Near ${nearest.name}`;
            setSelectedLocation(prev => ({
                placeId: `loc-${lat.toFixed(5)}-${lng.toFixed(5)}`,
                address: `${label}, ${nearest.address.road || nearest.name}, ${nearest.address.town || nearest.address.city}, Tamil Nadu, ${nearest.address.postcode || '606601'}, India`,
                latitude: lat,
                longitude: lng,
                lat,
                lng,
                area: nearest.address.hospital || nearest.address.suburb || nearest.name,
                city: nearest.address.town || nearest.address.city || 'Thiruvannamalai',
                state: nearest.address.state || 'Tamil Nadu',
                pincode: nearest.address.postcode || '606601',
                country: 'India',
                label
            }));
        } else {
            setSelectedLocation(prev => ({
                placeId: `loc-${lat.toFixed(5)}-${lng.toFixed(5)}`,
                address: prev?.address || `Selected Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
                latitude: lat,
                longitude: lng,
                lat,
                lng,
                area: prev?.area || '',
                city: prev?.city || 'Thiruvannamalai',
                state: prev?.state || 'Tamil Nadu',
                pincode: prev?.pincode || '606601',
                country: 'India',
                label: 'Selected Location'
            }));
        }

        setIsGeocoding(false);
    }, [googleAuthFailed]);

    // Handle Map Center Movement (Triggered when user stops dragging the map)
    const handleMapMovementComplete = useCallback((lat, lng) => {
        if (isProgrammaticMoveRef.current) {
            isProgrammaticMoveRef.current = false;
            return;
        }

        // Immediately update coordinates in state
        setSelectedLocation(prev => ({
            ...(prev || {}),
            lat,
            lng,
            latitude: lat,
            longitude: lng,
            placeId: `loc-${lat.toFixed(5)}-${lng.toFixed(5)}`
        }));

        // Debounce reverse geocoding request so repeated pans don't flood the network
        if (reverseGeocodeTimerRef.current) {
            clearTimeout(reverseGeocodeTimerRef.current);
        }
        reverseGeocodeTimerRef.current = setTimeout(() => {
            performReverseGeocode(lat, lng);
        }, 350);
    }, [performReverseGeocode]);

    // Initialize or Move Map
    const renderOrMoveMap = useCallback((lat, lng) => {
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || !mapContainerRef.current) return;

        // Method A: Google Maps (if available and not failed)
        if (!googleAuthFailed && window.google?.maps?.Map) {
            try {
                if (!googleMapInstanceRef.current) {
                    const gMap = new window.google.maps.Map(mapContainerRef.current, {
                        center: { lat, lng },
                        zoom: 16,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        zoomControl: true,
                        gestureHandling: 'greedy' // Smooth mobile touch interaction
                    });

                    gMap.addListener('dragstart', () => setIsMapMoving(true));
                    gMap.addListener('idle', () => {
                        setIsMapMoving(false);
                        const center = gMap.getCenter();
                        if (center) {
                            handleMapMovementComplete(center.lat(), center.lng());
                        }
                    });
                    gMap.addListener('click', (e) => {
                        if (e.latLng) {
                            gMap.panTo(e.latLng);
                        }
                    });

                    googleMapInstanceRef.current = gMap;
                } else {
                    isProgrammaticMoveRef.current = true;
                    googleMapInstanceRef.current.panTo({ lat, lng });
                    googleMapInstanceRef.current.setZoom(16);
                }
                return;
            } catch (err) {
                console.warn('[LOCATION] Google Map rendering notice:', err.message);
            }
        }

        // Method B: Leaflet Map
        try {
            if (!leafletMapInstanceRef.current) {
                // Ensure fresh container
                const map = L.map(mapContainerRef.current, {
                    center: [lat, lng],
                    zoom: 16,
                    zoomControl: true,
                    touchZoom: true,
                    dragging: true,
                    tap: false
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(map);

                // Movement event listeners
                map.on('movestart', () => {
                    setIsMapMoving(true);
                });

                map.on('moveend', () => {
                    setIsMapMoving(false);
                    const center = map.getCenter();
                    handleMapMovementComplete(center.lat, center.lng);
                });

                // Tapping or clicking anywhere on the map centers that exact spot
                map.on('click', (e) => {
                    map.panTo(e.latlng, { animate: true });
                });

                leafletMapInstanceRef.current = map;

                // Fix container dimensions on initial render
                setTimeout(() => {
                    map.invalidateSize();
                }, 200);
            } else {
                isProgrammaticMoveRef.current = true;
                leafletMapInstanceRef.current.setView([lat, lng], 16, { animate: true });
            }
        } catch (lErr) {
            console.warn('[LOCATION] Leaflet initialization notice:', lErr.message);
        }
    }, [googleAuthFailed, handleMapMovementComplete]);

    // Mount Map Effect
    useEffect(() => {
        if (selectedLocation?.lat && selectedLocation?.lng) {
            const timer = setTimeout(() => {
                renderOrMoveMap(selectedLocation.lat, selectedLocation.lng);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [renderOrMoveMap]);

    // Resilient Fallback Geocoding Search
    const fallbackSearch = async (query) => {
        const qNorm = query.toLowerCase().trim();
        const localMatches = CURATED_INDIAN_LOCATIONS.filter(item =>
            item.name.toLowerCase().includes(qNorm) ||
            item.display_name.toLowerCase().includes(qNorm) ||
            (item.address?.postcode && item.address.postcode.includes(qNorm))
        );

        if (localMatches.length > 0) {
            const formatted = localMatches.map((item, idx) => ({
                isGoogle: false,
                raw: item,
                placeId: `curated-${idx}`,
                mainText: item.name,
                secondaryText: item.display_name,
                description: item.display_name
            }));
            setSuggestions(formatted);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=6`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const formatted = data.map(item => ({
                    isGoogle: false,
                    raw: item,
                    placeId: String(item.place_id),
                    mainText: item.name || item.address?.suburb || item.address?.city || item.display_name.split(',')[0],
                    secondaryText: item.display_name,
                    description: item.display_name
                }));
                setSuggestions(formatted);
            } else {
                setErrorMessage('Location not found. Try another area, street, landmark, or PIN.');
            }
        } catch (err) {
            console.warn('[LOCATION] Network geocode search notice:', err.message);
            // Default match so user is never blocked
            const genericMatch = {
                name: query,
                lat: 12.2253,
                lon: 79.0747,
                display_name: `${query}, Thiruvannamalai, Tamil Nadu, 606601, India`,
                address: { city: query, state: 'Tamil Nadu', postcode: '606601', country: 'India' }
            };
            setSuggestions([{
                isGoogle: false,
                raw: genericMatch,
                placeId: 'custom-fallback-1',
                mainText: query,
                secondaryText: `${query}, Thiruvannamalai, Tamil Nadu, India`,
                description: `${query}, Thiruvannamalai, Tamil Nadu, India`
            }]);
        }
    };

    // Handle Input Search with Google Places Autocomplete or Geocoding Fallback
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setSearching(true);
        setErrorMessage('');
        setSuggestions([]);

        try {
            if (!googleAuthFailed && window.google?.maps?.places?.AutocompleteService) {
                let googleResults = null;
                try {
                    googleResults = await new Promise((resolve) => {
                        const timeoutTimer = setTimeout(() => resolve(null), 2000);
                        const service = new window.google.maps.places.AutocompleteService();
                        service.getPlacePredictions(
                            {
                                input: query,
                                componentRestrictions: { country: 'in' }
                            },
                            (predictions, status) => {
                                clearTimeout(timeoutTimer);
                                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length > 0) {
                                    resolve(predictions);
                                } else {
                                    resolve(null);
                                }
                            }
                        );
                    });
                } catch (gErr) {
                    googleResults = null;
                }

                if (googleResults && googleResults.length > 0) {
                    const formatted = googleResults.map(p => ({
                        isGoogle: true,
                        placeId: p.place_id,
                        mainText: p.structured_formatting?.main_text || p.description,
                        secondaryText: p.structured_formatting?.secondary_text || '',
                        description: p.description
                    }));
                    setSuggestions(formatted);
                    return;
                }
            }

            await fallbackSearch(query);
        } catch (err) {
            console.error('[LOCATION] Search error:', err);
            setErrorMessage('Unable to search locations. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    // Handle Place Selection
    const handleSelectSuggestion = async (item) => {
        setErrorMessage('');
        setSuggestions([]);
        setSearchQuery('');

        let resolvedLocation = null;

        if (item.isGoogle && window.google?.maps?.places?.PlacesService && !googleAuthFailed) {
            try {
                const place = await new Promise((resolve) => {
                    const detailsTimeout = setTimeout(() => resolve(null), 2000);
                    const dummyDiv = document.createElement('div');
                    const placesService = new window.google.maps.places.PlacesService(dummyDiv);

                    placesService.getDetails(
                        {
                            placeId: item.placeId,
                            fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name']
                        },
                        (res, status) => {
                            clearTimeout(detailsTimeout);
                            if (status === window.google.maps.places.PlacesServiceStatus.OK && res?.geometry) {
                                resolve(res);
                            } else {
                                resolve(null);
                            }
                        }
                    );
                });

                if (place) {
                    resolvedLocation = parseGoogleAddressComponents(
                        place.address_components,
                        place.formatted_address,
                        place.geometry,
                        place.place_id
                    );
                }
            } catch (e) {
                console.warn('[LOCATION] Google PlacesService getDetails error:', e);
            }
        }

        if (!resolvedLocation && item.raw) {
            resolvedLocation = parseFallbackAddress(item.raw);
        }

        if (!resolvedLocation) {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.description)}&countrycodes=in&format=json&addressdetails=1&limit=1`
                );
                const data = await res.json();
                if (Array.isArray(data) && data[0]) {
                    resolvedLocation = parseFallbackAddress(data[0]);
                }
            } catch (err) {
                console.warn('[LOCATION] Geocode fallback error:', err);
            }
        }

        if (resolvedLocation) {
            setSelectedLocation(resolvedLocation);
            renderOrMoveMap(resolvedLocation.lat, resolvedLocation.lng);
        } else {
            setErrorMessage('Unable to load this location. Please try another area.');
        }
    };

    // Use Current Location
    const handleUseCurrentLocation = () => {
        setErrorMessage('');

        if (!('geolocation' in navigator)) {
            setErrorMessage('Location permission was denied. Please search for your location instead.');
            return;
        }

        setDetectingGps(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Move map to GPS coordinates
                renderOrMoveMap(lat, lng);

                // Reverse geocode
                await performReverseGeocode(lat, lng);
                setDetectingGps(false);
            },
            (error) => {
                setDetectingGps(false);
                setErrorMessage('Location permission was denied. Please search for your location instead.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Save Location to Real MongoDB User Record
    const handleConfirmLocation = async () => {
        if (!selectedLocation || isNaN(selectedLocation.lat) || isNaN(selectedLocation.lng)) {
            setErrorMessage('Please select a valid location before confirming.');
            return;
        }

        if (saving || isMapMoving) return;

        setSaving(true);
        setErrorMessage('');

        const finalLat = Number(selectedLocation.lat || selectedLocation.latitude);
        const finalLng = Number(selectedLocation.lng || selectedLocation.longitude);
        const finalAddress = (selectedLocation.address || '').trim() || `${finalLat.toFixed(5)}, ${finalLng.toFixed(5)}`;

        const locationPayload = {
            lat: finalLat,
            lng: finalLng,
            latitude: finalLat,
            longitude: finalLng,
            address: finalAddress,
            formattedAddress: finalAddress,
            city: selectedLocation.city || 'Thiruvannamalai',
            state: selectedLocation.state || 'Tamil Nadu',
            pincode: selectedLocation.pincode || '606601',
            postalCode: selectedLocation.pincode || '606601',
            area: selectedLocation.area || '',
            country: selectedLocation.country || 'India',
            placeId: selectedLocation.placeId || `loc-${finalLat.toFixed(5)}-${finalLng.toFixed(5)}`
        };

        try {
            const token = localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await apiFetch('/api/auth/update-location', {
                method: 'PUT',
                headers,
                credentials: 'include',
                body: JSON.stringify(locationPayload)
            });

            if (response.status === 401) {
                setErrorMessage('Your session has expired. Please sign in again.');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                const confirmedLoc = data.user?.location || locationPayload;
                // Update Contexts immediately without reload
                manuallySetLocation(confirmedLoc);
                updateUser({ location: confirmedLoc });

                try {
                    sessionStorage.removeItem('onboarding_in_progress');
                } catch (e) {}

                toast.success('Location confirmed successfully!');
                navigate('/marketplace', { replace: true });
            } else {
                setErrorMessage(data.message || 'Unable to save your location. Please try again.');
            }
        } catch (err) {
            console.error('[LOCATION] Error saving location:', err);
            setErrorMessage('Unable to save your location. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (authStatus === 'INITIALIZING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading location setup...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-gray-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-lg">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-600 shadow-sm mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-heading">
                        Set your delivery location
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
                        Choose your current location or search for your address to continue.
                    </p>
                    {user?.name && (
                        <p className="mt-1 text-xs font-semibold text-green-700">
                            Welcome, {user.name}! Let's personalize your GreenBond experience.
                        </p>
                    )}
                </div>

                <div className="mt-6 bg-white py-6 px-5 sm:p-8 rounded-3xl shadow-xl border border-gray-100 space-y-6">
                    {/* Notice Banner */}
                    {googleApiNotice && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-700 font-medium">
                            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                            </svg>
                            <span>{googleApiNotice}</span>
                        </div>
                    )}

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-fade-in" role="alert">
                            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                            </svg>
                            <span className="text-xs sm:text-sm text-red-700 font-medium leading-relaxed">{errorMessage}</span>
                        </div>
                    )}

                    {/* OPTION A: Current Location */}
                    <div>
                        <button
                            type="button"
                            id="btn-use-current-location"
                            disabled={detectingGps || saving}
                            onClick={handleUseCurrentLocation}
                            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 border shadow-sm ${
                                detectingGps 
                                ? 'bg-green-50 border-green-300 text-green-700 cursor-wait' 
                                : 'bg-green-600 hover:bg-green-700 text-white border-transparent shadow-[0_4px_14px_0_rgba(22,163,74,0.3)] hover:-translate-y-0.5'
                            }`}
                        >
                            {detectingGps ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Detecting location...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Use Current Location</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-xs uppercase tracking-wider font-semibold text-gray-400">OR</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* OPTION B: Google Maps Location Search */}
                    <div className="space-y-2 relative">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Search Location
                        </label>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="input-search-location"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search town, hospital, landmark, PIN (e.g. Thiruvannamalai, Vignesh Hospital)"
                                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                id="btn-search-location-submit"
                                disabled={searching || !searchQuery.trim()}
                                className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                            >
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        {/* Autocomplete Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 z-50 mt-1 border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto bg-white shadow-2xl">
                                {suggestions.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSelectSuggestion(item)}
                                        className="w-full text-left p-3 hover:bg-green-50 transition-colors flex items-start gap-2.5"
                                    >
                                        <svg className="w-4 h-4 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {item.mainText}
                                            </p>
                                            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interactive Map Display with Center Pin Overlay */}
                    {selectedLocation && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Adjust Pin to Exact Location
                                    </span>
                                </div>
                                <span className="text-[11px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    {selectedLocation.lat?.toFixed(5)}, {selectedLocation.lng?.toFixed(5)}
                                </span>
                            </div>

                            {/* Map Container with Center Pin Overlay */}
                            <div className="relative w-full h-60 sm:h-64 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner">
                                <div 
                                    ref={mapContainerRef} 
                                    id="location-map-container" 
                                    className="w-full h-full"
                                ></div>

                                {/* Center Pin Overlay: Stays exactly over the center of the map while user pans underneath */}
                                <div className="absolute inset-0 pointer-events-none z-[400] flex items-center justify-center">
                                    <div className="relative -translate-y-1/2 flex flex-col items-center">
                                        {/* Dynamic Status Tooltip */}
                                        <div className={`mb-1.5 px-3 py-1 text-white text-[11px] font-bold rounded-full shadow-lg whitespace-nowrap flex items-center gap-1.5 transition-all duration-150 ${
                                            isMapMoving ? 'bg-emerald-600 scale-105' : 'bg-gray-900/90 scale-100'
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            <span>
                                                {isMapMoving 
                                                    ? 'Pinpointing location...' 
                                                    : (isGeocoding ? 'Resolving address...' : 'Delivery Spot')}
                                            </span>
                                        </div>
                                        
                                        {/* Green Map Pin with Physical Lift Micro-Animation */}
                                        <div className={`transition-transform duration-150 ${
                                            isMapMoving ? '-translate-y-2.5 scale-110' : 'translate-y-0 scale-100'
                                        }`}>
                                            <img 
                                                src={GREEN_PIN_URL}
                                                alt="Selected Delivery Location Pin"
                                                className="w-7 h-11 drop-shadow-md select-none"
                                                draggable={false}
                                            />
                                        </div>

                                        {/* Target Ground Shadow under Pin Tip */}
                                        <div className={`w-3.5 h-1.5 bg-black/35 rounded-full blur-[1px] transition-all duration-150 ${
                                            isMapMoving ? 'scale-75 opacity-40' : 'scale-100 opacity-80'
                                        }`}></div>
                                    </div>
                                </div>

                                {/* Helper Badge for User Guidance */}
                                <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-[400] text-center">
                                    <span className="inline-block bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-gray-200">
                                        Drag map or tap anywhere to place the pin at your exact entrance / building
                                    </span>
                                </div>
                            </div>

                            {/* Clean Structured Confirmation Card */}
                            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {isGeocoding ? 'Updating address...' : (selectedLocation.label || 'Selected Location')}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        Final Delivery Point
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-900 leading-snug">
                                        {selectedLocation.address}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 font-medium">
                                        {selectedLocation.area && <span>Area: <b className="text-gray-900">{selectedLocation.area}</b></span>}
                                        {selectedLocation.city && <span>City: <b className="text-gray-900">{selectedLocation.city}</b></span>}
                                        {selectedLocation.state && <span>State: <b className="text-gray-900">{selectedLocation.state}</b></span>}
                                        {selectedLocation.pincode && <span>Pincode: <b className="text-gray-900">{selectedLocation.pincode}</b></span>}
                                        {selectedLocation.country && <span>Country: <b className="text-gray-900">{selectedLocation.country}</b></span>}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    id="btn-confirm-location"
                                    disabled={saving || isMapMoving}
                                    onClick={handleConfirmLocation}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-all ${
                                        saving 
                                        ? 'bg-emerald-400 cursor-wait' 
                                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_14px_rgba(5,150,105,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                                >
                                    {saving ? 'Saving...' : 'Confirm Location'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationSetup;
