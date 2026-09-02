import React, { useState, useEffect, useRef } from 'react';

const placeholders = [
    'Search "milk"',
    'Search "fresh vegetables"',
    'Search "rice"',
    'Search "headphones"',
    'Search "snacks"',
    'Search "பால்"'
];

const POPULAR_SEARCHES = [
    'Milk', 'Vegetables', 'Fruits', 'Snacks', 
    'Mobile Accessories', 'Groceries', 'Fresh Products'
];

const SmartSearch = ({ onSearch, isSearching }) => {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('greenbond_recent_searches');
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch(e) {}
    }, []);

    const saveRecentSearch = (term) => {
        if (!term.trim()) return;
        const normalized = term.trim();
        const updated = [normalized, ...recentSearches.filter(s => s.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('greenbond_recent_searches', JSON.stringify(updated));
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('greenbond_recent_searches');
    };

    useEffect(() => {
        if (isFocused) return;
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isFocused]);

    const fetchSuggestions = async (val) => {
        if (val.length > 2) {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/suggestions?q=${encodeURIComponent(val)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error(err);
            }
        } else {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            saveRecentSearch(query);
            onSearch(query.trim());
            setIsFocused(false);
        }
    };

    const handleSelectSuggestion = (suggestion) => {
        const term = typeof suggestion === 'string' ? suggestion : suggestion.name;
        setQuery(term);
        saveRecentSearch(term);
        onSearch(term);
        setIsFocused(false);
    };

    const handleBack = () => {
        setIsFocused(false);
        if (query) {
            onSearch(query);
        }
    };
    
    const showOverlay = isFocused;

    return (
        <>
            <div className={`px-4 md:px-8 pt-1 pb-1 ${showOverlay ? 'fixed inset-0 z-50 bg-white px-0 md:px-0 mt-0 pt-0 flex flex-col' : 'relative z-20'}`}>
                {/* Search Header for Mobile Overlay */}
                <form onSubmit={handleSubmit} className={`relative flex items-center bg-white shadow-xs transition-all duration-300 ${showOverlay ? 'border-b border-gray-100 p-3 pt-safe' : 'rounded-2xl border border-gray-200/80 hover:border-green-400 focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100'}`}>
                    {showOverlay ? (
                        <button type="button" onClick={handleBack} className="p-2 text-gray-500 hover:text-gray-700 ml-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                    ) : (
                        <div className="pl-4">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    )}
                    
                    <input
                        type="text"
                        value={query}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        placeholder={placeholders[placeholderIndex]}
                        className={`w-full py-2.5 px-3 bg-transparent border-none focus:outline-none text-gray-900 font-medium placeholder-gray-400 text-sm md:text-base ${showOverlay ? 'text-lg' : ''}`}
                        autoFocus={showOverlay}
                    />
                    
                    {query && (
                        <button 
                            type="button"
                            onClick={() => { setQuery(''); setSuggestions([]); }}
                            className="pr-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5 bg-gray-100 rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    )}
                </form>

                {/* Overlay Content */}
                {showOverlay && (
                    <div className="bg-white flex-1 overflow-y-auto w-full">
                        {query.length > 0 ? (
                            <div className="py-2">
                                {suggestions.length > 0 ? (
                                    suggestions.map(s => (
                                        <div 
                                            key={s.id} 
                                            onClick={() => handleSelectSuggestion(s)}
                                            className="px-6 py-4 flex items-center gap-4 border-b border-gray-50 active:bg-gray-50 cursor-pointer"
                                        >
                                            <div className="bg-gray-100 p-2 rounded-full text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-gray-800 font-medium">{s.name}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                                    {s.category && <span>{s.category}</span>}
                                                    {s.brand && <span>• {s.brand}</span>}
                                                </div>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                        Type to see suggestions...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6">
                                {recentSearches.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-gray-900">Recent Searches</h3>
                                            <button onClick={clearRecentSearches} className="text-xs text-green-600 font-semibold hover:text-green-700">Clear all</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {recentSearches.map((term, i) => (
                                                <button 
                                                    key={i}
                                                    onClick={() => handleSelectSuggestion(term)}
                                                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200 active:bg-gray-100 flex items-center gap-2"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">Popular Searches</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {POPULAR_SEARCHES.map((term, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleSelectSuggestion(term)}
                                                className="px-4 py-2 bg-green-50 text-green-800 rounded-full text-sm font-medium border border-green-100 active:bg-green-100"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default SmartSearch;
