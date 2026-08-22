import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';
import ProductCard from '../../components/cards/ProductCard';
import toast from 'react-hot-toast';

const Search = () => {
    const navigate = useNavigate();
    const { location } = useLocationContext();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-focus search input on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.trim().length < 2) {
                setSuggestions([]);
                return;
            }
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/suggestions?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                }
            } catch (err) {
                console.error('Suggestions error:', err);
            }
        };

        const timeoutId = setTimeout(() => {
            if (!hasSearched) fetchSuggestions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, hasSearched]);

    const handleSearch = async (searchQuery = query) => {
        if (!searchQuery.trim()) return;
        setQuery(searchQuery);
        setHasSearched(true);
        setIsSearching(true);
        setSuggestions([]);

        try {
            const lat = location?.lat || '';
            const lng = location?.lng || '';
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?q=${encodeURIComponent(searchQuery)}&lat=${lat}&lng=${lng}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.products || data); // Depending on backend response wrapper
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddToCart = (product) => {
        const cart = JSON.parse(localStorage.getItem('user_cart') || '[]');
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.cartQuantity += 1;
        } else {
            cart.push({ ...product, cartQuantity: 1 });
        }
        localStorage.setItem('user_cart', JSON.stringify(cart));
        toast.success(`Added ${product.title} to cart`);
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans">
            {/* Search Header */}
            <div className="sticky top-0 bg-white z-40 px-4 pt-safe-top pb-3 border-b border-gray-100 flex items-center space-x-3 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-600 active:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                    className="flex-1 relative"
                >
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setHasSearched(false);
                        }}
                        placeholder="Search for 'paal', 'thakkali', or brands"
                        className="w-full bg-gray-100 text-gray-900 rounded-xl py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-greenbond-500 transition-all font-medium text-sm"
                    />
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    {query && (
                        <button 
                            type="button" 
                            onClick={() => { setQuery(''); setSuggestions([]); setHasSearched(false); setResults([]); }}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                            ✕
                        </button>
                    )}
                </form>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {/* Suggestions List */}
                {!hasSearched && suggestions.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {suggestions.map((sug, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSearch(sug.title || sug)}
                                className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-greenbond-50 focus:bg-greenbond-50 transition-colors flex items-center space-x-3 active:scale-[0.98]"
                            >
                                <span className="text-gray-400">🔍</span>
                                <div>
                                    <span className="text-sm font-medium text-gray-800 block">{sug.title || sug}</span>
                                    {sug.category && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{sug.category}</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading State */}
                {isSearching && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-200 animate-pulse h-56 rounded-2xl w-full"></div>
                        ))}
                    </div>
                )}

                {/* Results State */}
                {hasSearched && !isSearching && results.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                        {results.map(p => (
                            <div key={p.id || p._id} className="w-full">
                                {/* Wrap ProductCard to take full width of its grid cell */}
                                <div className="w-full">
                                    <ProductCard product={{...p, id: p.id || p._id}} onAdd={handleAddToCart} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {hasSearched && !isSearching && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center mt-20 p-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl opacity-50">🍃</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 font-display">No products found</h3>
                        <p className="text-sm text-gray-500 max-w-[250px]">We couldn't find anything matching "{query}". Try searching with a different term.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
