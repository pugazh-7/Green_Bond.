import React from 'react';

const EmptyState = ({ 
    title = "No products found", 
    message = "We couldn't find anything matching your criteria.", 
    icon = "🛍️",
    actionLabel,
    onAction
}) => {
    return (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center animate-fade-in">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl drop-shadow-sm">{icon}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 font-heading tracking-tight">{title}</h3>
            <p className="text-gray-500 text-sm max-w-[250px] mx-auto leading-relaxed mb-8">{message}</p>
            
            {actionLabel && onAction && (
                <button 
                    onClick={onAction} 
                    className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
