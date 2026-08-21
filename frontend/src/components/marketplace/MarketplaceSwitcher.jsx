import React from 'react';

const MarketplaceSwitcher = ({ activePhase, onSwitch }) => {
    return (
        <div className="mt-6">
            <div className="flex overflow-x-auto gap-3 px-4 md:px-8 pb-4 no-scrollbar snap-x">
                {/* Shopping Card */}
                <button 
                    onClick={() => onSwitch('SHOPPING')}
                    className={`flex-none w-[220px] p-4 rounded-3xl text-left transition-all duration-300 snap-center relative overflow-hidden active-press
                        ${activePhase === 'SHOPPING' 
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 shadow-md shadow-indigo-100' 
                            : 'bg-white border border-gray-100 opacity-70 scale-95'}`}
                >
                    <div className="text-3xl mb-2">🛍️</div>
                    <h3 className={`font-black text-lg ${activePhase === 'SHOPPING' ? 'text-indigo-900' : 'text-gray-800'}`}>Shopping</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Everything you need</p>
                </button>

                {/* Quick Card */}
                <button 
                    onClick={() => onSwitch('QUICK')}
                    className={`flex-none w-[220px] p-4 rounded-3xl text-left transition-all duration-300 snap-center relative overflow-hidden active-press
                        ${activePhase === 'QUICK' 
                            ? 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-200 shadow-md shadow-purple-100' 
                            : 'bg-white border border-gray-100 opacity-70 scale-95'}`}
                >
                    <div className="text-3xl mb-2">⚡</div>
                    <h3 className={`font-black text-lg ${activePhase === 'QUICK' ? 'text-purple-900' : 'text-gray-800'}`}>Quick</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Delivered in 10-15 min</p>
                </button>

                {/* Fresh Card */}
                <button 
                    onClick={() => onSwitch('FRESH')}
                    className={`flex-none w-[220px] p-4 rounded-3xl text-left transition-all duration-300 snap-center relative overflow-hidden active-press
                        ${activePhase === 'FRESH' 
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-md shadow-green-100' 
                            : 'bg-white border border-gray-100 opacity-70 scale-95'}`}
                >
                    <div className="text-3xl mb-2">🥬</div>
                    <h3 className={`font-black text-lg ${activePhase === 'FRESH' ? 'text-green-900' : 'text-gray-800'}`}>Fresh</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Direct from nearby farmers</p>
                </button>
            </div>
        </div>
    );
};

export default MarketplaceSwitcher;
