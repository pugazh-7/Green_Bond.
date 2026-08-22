// backend/services/image/productMediaRegistry.js

/**
 * Deterministic mapping of product slugs to their canonical high-quality media.
 * This completely eliminates fragile text-based fuzzy matching.
 */
export const productMedia = {
    'pears-pure-gentle-soap': {
        primaryImage: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=1000&auto=format&fit=crop',
        thumbnailImage: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=400&auto=format&fit=crop',
        gallery: []
    },
    'india-gate-basmati-rice-classic': {
        primaryImage: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/White_rice_in_a_bowl.jpg',
        thumbnailImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice_in_a_bowl.jpg/400px-White_rice_in_a_bowl.jpg',
        gallery: []
    },
    'sony-wh-1000xm5-wireless-headphones': {
        primaryImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop',
        thumbnailImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=400&auto=format&fit=crop',
        gallery: []
    },
    'peter-england-mens-casual-cotton-shirt-blue': {
        primaryImage: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Blue_Tshirt.jpg',
        thumbnailImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Blue_Tshirt.jpg/400px-Blue_Tshirt.jpg',
        gallery: []
    }
};

/**
 * Automatically derives a stable slug from a raw product title if the DB document is missing one.
 * @param {String} title 
 */
export const generateSlug = (title) => {
    if (!title) return '';
    return title.toLowerCase()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/\-\-+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
};
