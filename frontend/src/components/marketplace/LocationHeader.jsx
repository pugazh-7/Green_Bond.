import React from 'react';

const LocationHeader = ({ locationText, isFetching }) => {
    return (
        <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 pt-4 pb-3 px-4 md:px-8 border-b border-gray-100 flex items-center justify-between shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <div className="flex flex-col cursor-pointer group">
                <div className="flex items-center gap-1.5 text-green-700 font-extrabold text-lg">
                    <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span>Delivering to</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 ml-1">
                    {isFetching ? (
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                        <span className="text-sm font-semibold text-gray-800 line-clamp-1 max-w-[200px] md:max-w-xs">{locationText || 'Fetching location...'}</span>
                    )}
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center cursor-pointer hover:bg-green-100 transition-colors">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
        </div>
    );
};

export default LocationHeader;
