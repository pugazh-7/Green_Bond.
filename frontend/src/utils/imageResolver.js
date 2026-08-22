import { productImageRegistry } from './imageRegistry';

// Dynamically get backend URL to support both laptop and mobile device testing
// We use the current host's IP instead of hardcoded 127.0.0.1 if on mobile dev
const getBackendUrl = () => {
    if (import.meta.env.VITE_IMAGE_CDN_BASE_URL) {
        return import.meta.env.VITE_IMAGE_CDN_BASE_URL.replace(/\/cdn$/, '');
    }
    const host = window.location.hostname;
    // If not localhost or IP, fallback to 127.0.0.1 or standard API endpoint
    return `http://${host}:5000`;
};

export const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.includes('undefined')) return null;
    
    const backendUrl = getBackendUrl();

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    if (url.startsWith('/uploads/') || url.startsWith('/images/') || url.startsWith('/cdn/')) {
        return `${backendUrl}${url}`;
    }

    if (url.startsWith('uploads/') || url.startsWith('images/') || url.startsWith('cdn/')) {
        return `${backendUrl}/${url}`;
    }
    
    // Relative but not starting with /
    return `${backendUrl}/${url}`;
};

export const getProductImageUrl = (url, options = {}) => {
    if (!url) return null;
    
    // Simple mock transformation logic for the CDN
    // In production this would use ?w=320&q=75 etc.
    if (options.width || options.format) {
        try {
            const urlObj = new URL(url, getBackendUrl());
            if (options.width) urlObj.searchParams.set('w', options.width);
            if (options.quality) urlObj.searchParams.set('q', options.quality);
            if (options.format) urlObj.searchParams.set('fm', options.format);
            return urlObj.toString();
        } catch(e) {
            // Ignore URL parsing errors for base64 or absolute external URLs without standard format
            return url;
        }
    }
    
    return url;
};
