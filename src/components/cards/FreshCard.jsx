import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductImage from '../shared/ProductImage';

const FreshCard = ({ product, onAdd }) => {
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(`/user/product/${product.id || product._id}`, { state: { product } })}
            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col relative w-44 min-w-[176px] snap-start border border-fresh-50 cursor-pointer"
        >
            {/* Fresh Badge */}
            <div className="absolute top-2 left-2 bg-fresh-50 text-fresh-700 border border-fresh-200 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center shadow-sm">
                🌱 Harvested Today
            </div>
            
            <button className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors z-10">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <div className="h-36 w-full flex items-center justify-center relative group cursor-pointer overflow-hidden bg-fresh-50/20">
                <ProductImage product={product} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-3 flex flex-col flex-1">
                <div className="flex items-center space-x-1 mb-1 text-[10px] text-gray-500">
                    <span className="truncate">👨‍🌾 {product.sourceName || 'Farmer'}</span>
                    <span>•</span>
                    <span>📍 {product.distanceKm || '2.5'} km</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-2 line-clamp-2 min-h-[40px]">{product.title}</h3>
                <div className="mt-auto flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-900">₹{product.price}<span className="text-[10px] text-gray-500 font-normal">/{product.unit || 'kg'}</span></p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                        className="bg-fresh-50 text-fresh-600 border border-fresh-200 hover:bg-fresh-100 font-bold px-3 py-1 rounded-lg text-xs transition-colors active:scale-95"
                    >
                        ADD
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FreshCard;
