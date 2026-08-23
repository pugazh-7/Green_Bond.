import React from 'react';
import { resolveCategoryIcon } from '../../utils/iconRegistry';

const CategoryNav = ({ categories, activeCategory, onSelectCategory }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <div className="px-4 md:px-8 py-5 bg-white mb-2 shadow-sm rounded-b-3xl">
            <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x">
                {categories.map((cat, idx) => {
                    const isActive = activeCategory === cat;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => onSelectCategory(cat)}
                            className="flex flex-col items-center gap-2 cursor-pointer snap-start min-w-[72px] active:scale-95 transition-transform"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all duration-300 shadow-sm
                                ${isActive ? 'bg-green-50 ring-2 ring-green-600 scale-105 shadow-md' : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'}`}
                            >
                                <div className="text-gray-500">
                                    {React.createElement(resolveCategoryIcon(cat), { className: "w-8 h-8" })}
                                </div>
                            </div>
                            <span className={`text-[11px] font-bold text-center leading-tight w-full break-words px-1 ${isActive ? 'text-green-800' : 'text-gray-700'}`}>
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
