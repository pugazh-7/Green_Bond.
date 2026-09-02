import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import SmartSearch from '../../components/marketplace/SmartSearch';
import MarketplaceSwitcher from '../../components/marketplace/MarketplaceSwitcher';
import ShoppingView from './views/ShoppingView';
import QuickView from './views/QuickView';
import FreshView from './views/FreshView';
import UnifiedSearchView from './views/UnifiedSearchView';
import toast from 'react-hot-toast';

const MainMarketplace = () => {
    const navigate = useNavigate();
    const urlLocation = useLocation();
    const searchParams = new URLSearchParams(urlLocation.search);
    const initialPhase = searchParams.get('phase') || 'SHOPPING';

    const { location, isFetching, hasResolvedInitialLocation } = useLocationContext();
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

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Unified Headers */}
            <div className="pt-1.5 space-y-0.5">
                <SmartSearch onSearch={handleSearch} isSearching={isSearching} />
                <MarketplaceSwitcher activePhase={activePhase} onSwitch={handleSwitch} />
            </div>

            {/* Content Views */}
            <div className="mt-4">
                {!hasResolvedInitialLocation ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-pulse">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl opacity-50">📍</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Establishing Delivery Location...</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                            Finding the best products and fastest delivery for your area.
                        </p>
                    </div>
                ) : searchQuery ? (
                    <UnifiedSearchView 
                        location={location}
                        searchQuery={searchQuery}
                        activePhase={activePhase}
                    />
                ) : (
                    <>
                        {activePhase === 'SHOPPING' && (
                            <ShoppingView 
                                location={location} 
                                searchQuery="" 
                                setIsSearching={setIsSearching} 
                            />
                        )}
                        {activePhase === 'QUICK' && (
                            <QuickView 
                                location={location} 
                                searchQuery="" 
                                setIsSearching={setIsSearching} 
                            />
                        )}
                        {activePhase === 'FRESH' && (
                            <FreshView 
                                location={location} 
                                searchQuery="" 
                                setIsSearching={setIsSearching} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MainMarketplace;
