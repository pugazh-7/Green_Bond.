import React from 'react';
import ProductCard from '../product/ProductCard';

const HorizontalProductList = ({ title, subtitle, products = [], isLoading = false, onAddToCart }) => {
    if (!isLoading && (!products || products.length === 0)) return null;

    return (
        <div className="mb-10 animate-fade-in">
            <div className="px-4 md:px-8 mb-4 flex items-end justify-between">
                <div>
                    <h2 className="text-xl md:text-2xl font-black font-heading text-gray-900 tracking-tight">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>}
                </div>
                {!isLoading && products.length > 4 && (
                    <button className="text-green-600 font-bold text-sm hover:text-green-700 flex items-center gap-1 group">
                        See All
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                )}
            </div>

            <div className="px-4 md:px-8 overflow-x-auto pb-4 pt-1 flex gap-4 md:gap-6 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {isLoading ? (
                    // Skeleton Loaders
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="min-w-[160px] md:min-w-[200px] max-w-[200px] flex-shrink-0 aspect-[4/5] bg-gray-100 rounded-3xl animate-pulse snap-start"></div>
                    ))
                ) : (
                    products.map(product => (
                        <div key={product._id || product.id} className="min-w-[160px] md:min-w-[200px] max-w-[200px] flex-shrink-0 snap-start h-full">
                            <ProductCard 
                                product={product} 
                                variant="shopping" 
                                onAddToCart={onAddToCart}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HorizontalProductList;
