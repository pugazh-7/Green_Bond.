import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import LocationHeader from '../../components/marketplace/LocationHeader';
import SmartSearch from '../../components/marketplace/SmartSearch';
import MarketplaceSwitcher from '../../components/marketplace/MarketplaceSwitcher';
import ShoppingView from './views/ShoppingView';
import QuickView from './views/QuickView';
import FreshView from './views/FreshView';
import toast from 'react-hot-toast';

const MainMarketplace = () => {
    const navigate = useNavigate();
    const urlLocation = useLocation();
    const searchParams = new URLSearchParams(urlLocation.search);
    const initialPhase = searchParams.get('phase') || 'SHOPPING';

    const { location, isFetching } = useLocationContext();
    const [activePhase, setActivePhase] = useState(initialPhase);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Sync state with URL params
    useEffect(() => {
        const phase = searchParams.get('phase');
        if (phase && phase !== activePhase) {
            setActivePhase(phase);
        }
    }, [urlLocation.search]);

    const handleSwitch = (phase) => {
        setActivePhase(phase);
        navigate(`/user?phase=${phase}`);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        // We'll pass the debounced logic to the views, or handle it here if it's unified.
        // For now, passing searchQuery down.
    };

    const locationText = location?.address || (location?.lat ? `${Number(location.lat).toFixed(4)}, ${Number(location.lng).toFixed(4)}` : null);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Unified Headers */}
            <LocationHeader locationText={locationText} isFetching={isFetching} />
            <SmartSearch onSearch={handleSearch} isSearching={isSearching} />
            <MarketplaceSwitcher activePhase={activePhase} onSwitch={handleSwitch} />

            {/* Content Views */}
            <div className="mt-6">
                {activePhase === 'SHOPPING' && (
                    <ShoppingView 
                        location={location} 
                        searchQuery={searchQuery} 
                        setIsSearching={setIsSearching} 
                    />
                )}
                {activePhase === 'QUICK' && (
                    <QuickView 
                        location={location} 
                        searchQuery={searchQuery} 
                        setIsSearching={setIsSearching} 
                    />
                )}
                {activePhase === 'FRESH' && (
                    <FreshView 
                        location={location} 
                        searchQuery={searchQuery} 
                        setIsSearching={setIsSearching} 
                    />
                )}
            </div>
        </div>
    );
};

export default MainMarketplace;
