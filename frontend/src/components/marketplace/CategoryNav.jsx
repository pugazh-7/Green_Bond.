import React from 'react';
import { resolveCategoryIcon } from '../../utils/iconRegistry';

const CategoryNav = ({ categories, activeCategory, onSelectCategory }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="px-4 md:px-8 py-3 bg-white mb-2 shadow-xs rounded-b-2xl">
            <div className="flex gap-3 md:gap-5 overflow-x-auto no-scrollbar snap-x">
                {categories.map((cat, idx) => {
                    const isActive = activeCategory === cat;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onSelectCategory(cat)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer snap-start min-w-[56px] sm:min-w-[64px] active:scale-95 transition-transform"
                        >
                            <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex flex-col items-center justify-center p-2 transition-all duration-300 shadow-xs
                                ${isActive ? 'bg-green-50 ring-2 ring-green-600 scale-105 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'}`}
                            >
                                <div className={isActive ? 'text-green-700' : 'text-gray-500'}>
                                    {React.createElement(resolveCategoryIcon(cat), { className: "w-5 h-5 sm:w-6 sm:h-6" })}
                                </div>
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-bold text-center leading-tight w-full truncate px-0.5 ${isActive ? 'text-green-800' : 'text-gray-600'}`}>
                                {cat}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryNav;
