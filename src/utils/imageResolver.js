export const resolveProductImage = (product) => {
    if (!product) return null;

    let imagePath = product.image;

    // Fallbacks if image is missing but images array exists
    if (!imagePath && product.images && product.images.length > 0) {
        imagePath = product.images[0];
    }

    if (!imagePath) {
        // Map by name to our existing assets if missing
        const title = (product.title || product.name || '').toLowerCase();
        
        // Example mappings that we know exist in assets based on earlier listing:
        if (title.includes('potato')) return new URL('../assets/Potatoes.jpg', import.meta.url).href;
        if (title.includes('milk')) return new URL('../assets/Amul Milk.jpg', import.meta.url).href; // Assuming we have it
        if (title.includes('rice')) return new URL('../assets/Ponni Rice.webp', import.meta.url).href;
        if (title.includes('tomato')) return new URL('../assets/Country Tomat.jpg', import.meta.url).href;
        if (title.includes('apple')) return new URL('../assets/Shimla Apples.webp', import.meta.url).href;
        if (title.includes('banana')) return new URL('../assets/Yelakki Banana.jpg', import.meta.url).href;
        if (title.includes('onion')) return new URL('../assets/Red Onions.webp', import.meta.url).href;
        if (title.includes('garlic')) return new URL('../assets/Garlic.avif', import.meta.url).href;
        if (title.includes('chicken') || title.includes('meat')) return null; // Add more as needed
        
        return null;
    }

    // 1. Absolute URL (Unsplash, Cloudinary, S3, etc.)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // The user complained about random Unsplash placeholder images.
        // If it's unsplash, we might want to try to map it to a local real image to satisfy the user's "Milk -> milk packet" rule.
        const title = (product.title || product.name || '').toLowerCase();
        
        if (imagePath.includes('unsplash.com')) {
            if (title.includes('soap')) return new URL('../assets/Personal Care.jpg', import.meta.url).href; // Fallback
            if (title.includes('rice')) return new URL('../assets/Ponni Rice.webp', import.meta.url).href;
            if (title.includes('headphone')) return new URL('../assets/Electronics.jpg', import.meta.url).href; // Fallback
            if (title.includes('shirt')) return new URL('../assets/Fashion.jpg', import.meta.url).href; // Fallback
            if (title.includes('milk')) return new URL('../assets/Amul Milk.jpg', import.meta.url).href; // Fallback
            if (title.includes('tomato')) return new URL('../assets/Country Tomat.jpg', import.meta.url).href;
            if (title.includes('potato')) return new URL('../assets/Potatoes.jpg', import.meta.url).href;
            if (title.includes('onion')) return new URL('../assets/Red Onions.webp', import.meta.url).href;
            if (title.includes('cabbage')) return new URL('../assets/Cabbage.jpg', import.meta.url).href;
            if (title.includes('chilli') || title.includes('chili')) return new URL('../assets/Green Chilli.webp', import.meta.url).href;
        }

        return imagePath;
    }

    // 2. Relative Backend Uploads Path (/uploads/...)
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('/images/')) {
        // Resolve using the API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.29.210:5000';
        return `${apiUrl}${imagePath}`;
    }

    // 3. Just a filename like 'amul-milk.webp', assume it's in uploads/products/
    if (!imagePath.includes('/')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.29.210:5000';
        return `${apiUrl}/uploads/products/${imagePath}`;
    }

    return imagePath;
};
