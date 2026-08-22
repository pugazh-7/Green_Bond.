// backend/services/image/imageResolver.js

import { productMedia, generateSlug } from './productMediaRegistry.js';

/**
 * Resolves the absolute best product image based on the schema and fallbacks.
 * Returns a normalized image object.
 * 
 * @param {Object} product - The product document
 * @returns {Object} - Normalized image { primary, thumbnail, gallery }
 */
const getProductImage = (product) => {
    let primary = getNeutralPlaceholder();
    let thumbnail = getNeutralPlaceholder();
    let gallery = [];

    if (!product) return { primary, thumbnail, gallery };

    const slug = product.slug || generateSlug(product.name || product.title);
    
    // Extract array images
    if (product.images && Array.isArray(product.images)) {
        gallery = product.images.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
    }

    // Determine primary and thumbnail
    if (productMedia[slug]) {
        primary = productMedia[slug].primaryImageUrl || productMedia[slug].primaryImage || primary;
        thumbnail = productMedia[slug].thumbnailImageUrl || productMedia[slug].thumbnailImage || productMedia[slug].primaryImage || primary;
        if (productMedia[slug].gallery && productMedia[slug].gallery.length > 0) {
            gallery = [...productMedia[slug].gallery, ...gallery];
        }
    } else if (product.primaryImageUrl && product.primaryImageUrl.trim() !== '') {
        primary = product.primaryImageUrl;
        thumbnail = product.thumbnailUrl || primary;
    } else if (product.imageUrl && product.imageUrl.trim() !== '') {
        primary = product.imageUrl;
        thumbnail = primary;
    } else if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
        primary = product.image;
        thumbnail = primary;
    } else if (gallery.length > 0) {
        primary = gallery[0];
        thumbnail = gallery[0];
    }

    return { primary, thumbnail, gallery };
};

const getNeutralPlaceholder = () => {
    return ''; // Frontend will handle missing/empty strings with category fallbacks
};

export { getProductImage, getNeutralPlaceholder };
