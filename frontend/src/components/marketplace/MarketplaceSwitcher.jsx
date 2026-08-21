import React from 'react';

const MarketplaceSwitcher = ({ activePhase, onSwitch }) => {
    return (
        <div className="px-4 md:px-8 mt-6">
            <div className="bg-gray-100 p-1 rounded-2xl flex relative overflow-hidden w-full shadow-inner">
                {/* Active Indicator Background */}
                <div 
                    className="absolute top-1 bottom-1 w-[32.33%] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out z-0"
                    style={{ 
                        transform: 
                            activePhase === 'SHOPPING' ? 'translateX(2%)' : 
                            activePhase === 'QUICK' ? 'translateX(102%)' : 
                            'translateX(203%)'
                    }}
                />
                
                <button 
                    onClick={() => onSwitch('SHOPPING')}
                    className={`flex-1 relative z-10 py-3 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors ${activePhase === 'SHOPPING' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="text-lg">🛍</span> Shopping
                </button>
                
                <button 
                    onClick={() => onSwitch('QUICK')}
                    className={`flex-1 relative z-10 py-3 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors ${activePhase === 'QUICK' ? 'text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="text-lg">⚡</span> Quick
                </button>
                
                <button 
                    onClick={() => onSwitch('FRESH')}
                    className={`flex-1 relative z-10 py-3 text-sm font-extrabold flex items-center justify-center gap-2 transition-colors ${activePhase === 'FRESH' ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <span className="text-lg">🥬</span> Fresh
                </button>
            </div>
        </div>
    );
};

export default MarketplaceSwitcher;
