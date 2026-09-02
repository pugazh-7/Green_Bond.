import React from 'react';
import ProductCard from '../product/ProductCard';
import { resolveCategoryIcon } from '../../utils/iconRegistry';

const getBadgeForCategory = (category) => {
    switch (category) {
        case 'Trending Now': return { text: 'TRENDING NOW', bg: 'bg-orange-100 text-orange-800' };
        case 'Fruits & Vegetables': return { text: 'FRESH TODAY', bg: 'bg-green-100 text-green-800' };
        case 'Grocery': return { text: 'ESSENTIALS', bg: 'bg-blue-100 text-blue-800' };
        case 'Snacks': return { text: 'CUSTOMER FAVOURITES', bg: 'bg-yellow-100 text-yellow-800' };
        case 'Electronics': return { text: 'FAST SELLING', bg: 'bg-purple-100 text-purple-800' };
        case 'Best Deals': return { text: 'BEST VALUE', bg: 'bg-red-100 text-red-800' };
        case 'New Arrivals': return { text: 'NEW ARRIVALS', bg: 'bg-indigo-100 text-indigo-800' };
        default: return { text: 'GREENBOND PICKS', bg: 'bg-teal-100 text-teal-800' };
    }
};

const getThemeForCategory = (category) => {
    switch (category) {
        case 'Fruits & Vegetables':
        case 'Dairy & Breakfast':
            return 'bg-green-50/50';
        case 'Snacks':
        case 'Drinks':
            return 'bg-orange-50/30';
        case 'Electronics':
            return 'bg-gray-50';
        case 'Fashion':
        case 'Beauty':
            return 'bg-pink-50/30';
        case 'Best Deals':
            return 'bg-red-50/30';
        default:
            return 'bg-white';
    }
};

const CategorySection = ({ id, category, subtitle, products = [], count = 0, onSeeAll, onAddToCart, isPriority = false, isQuick = false, variant }) => {
    if (!products || products.length === 0) return null;
    
    // Display max 6 products exactly as requested
    const displayProducts = products.slice(0, 6);
    const badge = getBadgeForCategory(category);
    const themeClass = getThemeForCategory(category);

    return (
        <div id={id} className={`pt-10 pb-12 mb-2 ${themeClass} animate-fade-in`}>
            <div className="px-4 md:px-8 mb-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-widest uppercase mb-3 inline-block ${badge.bg}`}>
                            {badge.text}
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-gray-50 text-gray-500">
                                {React.createElement(resolveCategoryIcon(category), { className: "w-5 h-5" })}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black font-heading text-gray-900 tracking-tight">
                                {category}
                            </h2>
                        </div>
                        {subtitle && <p className="text-sm md:text-base text-gray-500 font-medium mt-1">{subtitle}</p>}
                    </div>
                    
                    <button 
                        onClick={() => onSeeAll(category)}
                        className="group flex items-center justify-center md:justify-end gap-2 bg-white md:bg-transparent border md:border-none border-gray-200 px-4 py-2.5 md:p-0 rounded-xl text-green-700 font-bold text-sm hover:text-green-800 transition-colors shadow-sm md:shadow-none w-full md:w-auto mt-2 md:mt-0"
                    >
                        {count > 6 ? `Explore ${count}+ ${category}` : `View all ${category}`}
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>

            <div className="px-4 md:px-8 overflow-x-auto pb-4 pt-1 flex gap-2.5 md:gap-4 snap-x snap-mandatory no-scrollbar">
                {displayProducts.map((product, index) => (
                    <div key={product._id || product.id} className="min-w-[130px] md:min-w-[165px] max-w-[170px] flex-shrink-0 snap-start h-full pb-1">
                        <ProductCard 
                            product={product} 
                            variant={variant || (isQuick ? "quick" : (product.marketplaceType === 'FRESH' || product.sourceType === 'FARMER' || product.farmer ? "fresh" : "shopping"))} 
                            onAddToCart={onAddToCart}
                            priority={isPriority && index < 2}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategorySection;
