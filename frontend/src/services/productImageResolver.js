/**
 * Resolves the deterministic centralized image for a product.
 * Falls back gracefully via the backend API.
 */

// If env var is not available, default to relative path (handled by Vite proxy / production)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getProductImage = (product) => {
    if (!product || !product._id) {
        return getNeutralFallback();
    }
    
    // Centralized Image API URL
    // We pass `v` for cache-busting when an image is updated
    return `${API_BASE_URL}/api/images/product/${product._id}?v=${product.imageVersion || 1}`;
};

export const getNeutralFallback = () => {
    // Professional neutral fallback image SVG
    return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Cpath%20d%3D%22M150%20150h100v100H150z%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Cpath%20d%3D%22M200%20180c-11.046%200-20%208.954-20%2020s8.954%2020%2020%2020%2020-8.954%2020-20-8.954-20-20-20zm0%2032c-6.627%200-12-5.373-12-12s5.373-12%2012-12%2012%205.373%2012%2012-5.373%2012-12%2012z%22%20fill%3D%22%239ca3af%22%2F%3E%3Cpath%20d%3D%22M200%20170c-2.761%200-5%202.239-5%205v5h10v-5c0-2.761-2.239-5-5-5z%22%20fill%3D%22%239ca3af%22%2F%3E%3C%2Fsvg%3E';
};

// We keep this function for generic use cases where we only have a category string and no product object,
// but the backend Image API handles the main fallback logic for actual products.
export const getCategoryFallback = (product) => {
    if (!product || !product.category) return getNeutralFallback();
    const cat = product.category.toLowerCase();
    
    // Use an unstyled generic placeholder SVG based on category colors/icons
    if (cat.includes('milk') || cat.includes('dairy')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23eff6ff%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%233b82f6%22%EMilk%20%26%20Dairy%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('grocery') || cat.includes('rice') || cat.includes('dal')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23fef3c7%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23d97706%22%EGrocery%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('snack') || cat.includes('chocolate') || cat.includes('ice cream')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23fce7f3%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23db2777%22%ESnacks%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('drink')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23e0f2fe%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%230284c7%22%EDrinks%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('fresh') || cat.includes('veg') || cat.includes('fruit')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23dcfce7%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%2316a34a%22%EFresh%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('electronic') || cat.includes('mobile') || cat.includes('laptop')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23f3e8ff%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%239333ea%22%EElectronics%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('fashion') || cat.includes('men') || cat.includes('women') || cat.includes('kid')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23ffedd5%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ea580c%22%EFashion%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    if (cat.includes('beauty') || cat.includes('care')) {
        return 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22400%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22%23ffe4e6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22200%22%20font-family%3D%22sans-serif%22%20font-size%3D%2248%22%20text-anchor%3D%22middle%22%20fill%3D%22%23e11d48%22%EBeauty%3C%2Ftext%3E%3C%2Fsvg%3E';
    }
    
    return getNeutralFallback();
};
