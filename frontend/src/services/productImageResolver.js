// Only fallback utilities remain here
/**
 * Resolves the best product image based on requested priority.
 * Priority: images[0] > primaryImageUrl > imageUrl > image > thumbnail > fallback
 */
export const getNeutralFallback = () => {
    // Professional neutral fallback image
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Cpath%20d%3D%22M150%20150h100v100H150z%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Cpath%20d%3D%22M200%20180c-11.046%200-20%208.954-20%2020s8.954%2020%2020%2020%2020-8.954%2020-20-8.954-20-20-20zm0%2032c-6.627%200-12-5.373-12-12s5.373-12%2012-12%2012%205.373%2012%2012-5.373%2012-12%2012z%22%20fill%3D%22%239ca3af%22%2F%3E%3Cpath%20d%3D%22M200%20170c-2.761%200-5%202.239-5%205v5h10v-5c0-2.761-2.239-5-5-5z%22%20fill%3D%22%239ca3af%22%2F%3E%3C%2Fsvg%3E';
};

export const getCategoryFallback = (product) => {
    if (!product || !product.category) return getNeutralFallback();
    const cat = product.category.toLowerCase();
    
    // Use an unstyled generic placeholder SVG based on category colors/icons
    // For now we will return SVG icons to represent categories instead of broken links
    if (cat.includes('milk') || cat.includes('dairy')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23eff6ff%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%233b82f6%22%3EMilk%20%26%20Dairy%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('grocery') || cat.includes('rice') || cat.includes('dal')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23fef3c7%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23d97706%22%3EGrocery%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('snack') || cat.includes('chocolate') || cat.includes('ice cream')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23fce7f3%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23db2777%22%3ESnacks%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('drink')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23e0f2fe%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230284c7%22%3EDrinks%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('fresh') || cat.includes('veg') || cat.includes('fruit')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23dcfce7%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%2316a34a%22%3EFresh%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    
    return getNeutralFallback();
};
