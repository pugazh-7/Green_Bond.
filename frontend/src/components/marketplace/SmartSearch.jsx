import React, { useState, useEffect, useRef } from 'react';

const placeholders = [
    'Search "milk"',
    'Search "fresh vegetables"',
    'Search "rice"',
    'Search "headphones"',
    'Search "snacks"',
    'Search "பால்"'
];

const SmartSearch = ({ onSearch, isSearching }) => {
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    
    useEffect(() => {
        if (isFocused) return; // Stop rotating when focused
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isFocused]);

    const handleChange = async (e) => {
        const val = e.target.value;
        setQuery(val);
        onSearch(val);
        
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

    return (
        <div className="px-4 md:px-8 mt-4 sticky top-16 z-30">
            <div className={`relative flex items-center bg-white rounded-2xl shadow-sm border transition-all duration-300 ${isFocused ? 'border-green-500 shadow-md ring-4 ring-green-50' : 'border-gray-200'}`}>
                <div className="pl-4">
                    <svg className={`w-5 h-5 transition-colors ${isFocused ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full py-3.5 px-3 bg-transparent border-none focus:outline-none text-gray-900 font-medium placeholder-gray-400"
                />
                
                {query && (
                    <button 
                        onClick={() => { setQuery(''); onSearch(''); }}
                        className="pr-4 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5 bg-gray-100 rounded-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>
            
            {/* Search Overlay (Shows when typing) */}
            {isFocused && query.length > 0 && (
                <div className="absolute top-full left-4 right-4 md:left-8 md:right-8 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden animate-slide-up">
                    <div className="p-4">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-3 text-gray-500 font-medium text-sm">Searching...</span>
                            </div>
                        ) : suggestions.length > 0 ? (
                            <div className="py-2">
                                {suggestions.map(sugg => (
                                    <div 
                                        key={sugg.id} 
                                        className="py-2 px-3 hover:bg-gray-50 rounded-xl cursor-pointer flex items-center justify-between"
                                        onClick={() => {
                                            setQuery(sugg.title);
                                            onSearch(sugg.title);
                                            setIsFocused(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-400">🔍</span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{sugg.title}</p>
                                                <p className="text-[10px] text-gray-500">{sugg.category} • {sugg.brand}</p>
                                            </div>
                                        </div>
                                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">View</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-gray-500 text-sm">Hit enter or see results below</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartSearch;
