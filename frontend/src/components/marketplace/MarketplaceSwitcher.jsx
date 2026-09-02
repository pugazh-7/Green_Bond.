import React from 'react';
import { resolveIcon } from '../../utils/iconRegistry';

const MarketplaceSwitcher = ({ activePhase, onSwitch }) => {
    return (
        <div className="mt-3">
            <div className="flex overflow-x-auto gap-2.5 px-4 md:px-8 pb-2 no-scrollbar snap-x">
                {/* Shopping Card */}
                <button 
                    onClick={() => onSwitch('SHOPPING')}
                    className={`flex-none w-[140px] sm:w-[170px] p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-300 snap-center relative overflow-hidden active:scale-95
                        ${activePhase === 'SHOPPING' 
                            ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50 border-2 border-indigo-300 shadow-sm shadow-indigo-100/50' 
                            : 'bg-white border border-gray-200/70 hover:bg-gray-50/80 opacity-75'}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg overflow-hidden shadow-xs border border-white flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0">
                            {React.createElement(resolveIcon('shopping'), { className: "w-4 h-4" })}
                        </div>
                        <h3 className={`font-black text-sm sm:text-base leading-tight ${activePhase === 'SHOPPING' ? 'text-indigo-950' : 'text-gray-800'}`}>
                            Shopping
                        </h3>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                        Everything you need
                    </p>
                </button>

                {/* Quick Card */}
                <button 
                    onClick={() => onSwitch('QUICK')}
                    className={`flex-none w-[140px] sm:w-[170px] p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-300 snap-center relative overflow-hidden active:scale-95
                        ${activePhase === 'QUICK' 
                            ? 'bg-gradient-to-br from-purple-50/90 to-fuchsia-50 border-2 border-purple-300 shadow-sm shadow-purple-100/50' 
                            : 'bg-white border border-gray-200/70 hover:bg-gray-50/80 opacity-75'}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg overflow-hidden shadow-xs border border-white flex items-center justify-center bg-purple-50 text-purple-600 shrink-0">
                            {React.createElement(resolveIcon('quick'), { className: "w-4 h-4" })}
                        </div>
                        <h3 className={`font-black text-sm sm:text-base leading-tight ${activePhase === 'QUICK' ? 'text-purple-950' : 'text-gray-800'}`}>
                            Quick
                        </h3>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                        Delivered in 10-15 min
                    </p>
                </button>

                {/* Fresh Card */}
                <button 
                    onClick={() => onSwitch('FRESH')}
                    className={`flex-none w-[140px] sm:w-[170px] p-2.5 sm:p-3 rounded-2xl text-left transition-all duration-300 snap-center relative overflow-hidden active:scale-95
                        ${activePhase === 'FRESH' 
                            ? 'bg-gradient-to-br from-emerald-50/90 to-green-50 border-2 border-emerald-400 shadow-sm shadow-emerald-100/50' 
                            : 'bg-white border border-gray-200/70 hover:bg-gray-50/80 opacity-75'}`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg overflow-hidden shadow-xs border border-white flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                            {React.createElement(resolveIcon('fresh'), { className: "w-4 h-4" })}
                        </div>
                        <h3 className={`font-black text-sm sm:text-base leading-tight ${activePhase === 'FRESH' ? 'text-emerald-950' : 'text-gray-800'}`}>
                            Fresh
                        </h3>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                        Direct from farmers
                    </p>
                </button>
            </div>
        </div>
    );
};

export default MarketplaceSwitcher;
