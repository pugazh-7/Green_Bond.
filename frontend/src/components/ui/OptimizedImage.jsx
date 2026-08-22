import React, { useState, useEffect } from 'react';

const OptimizedImage = ({ 
    src, 
    alt = 'Image', 
    className = '', 
    priority = false, 
    width, 
    height,
    sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const fallbackImage = 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=500&auto=format&fit=crop';

    // Optimize Unsplash URLs dynamically if they are used
    const getOptimizedSrc = (url) => {
        if (!url) return fallbackImage;
        if (url.includes('images.unsplash.com')) {
            try {
                const urlObj = new URL(url);
                urlObj.searchParams.set('auto', 'format');
                urlObj.searchParams.set('fit', 'crop');
                // Use a lower quality for faster loading but keep it looking decent
                if (!urlObj.searchParams.has('q')) {
                    urlObj.searchParams.set('q', '75'); 
                }
                // Target WebP/AVIF implicitly via 'auto=format'
                return urlObj.toString();
            } catch (e) {
                return url;
            }
        }
        return url;
    };

    const finalSrc = hasError ? fallbackImage : getOptimizedSrc(src);

    useEffect(() => {
        // Reset state if src changes
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton Placeholder */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center rounded-[inherit]">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
            )}
            
            {/* Actual Image */}
            <img
                src={finalSrc}
                alt={alt}
                width={width}
                height={height}
                sizes={sizes}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setHasError(true);
                    setIsLoaded(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                    objectFit: className.includes('object-contain') ? 'contain' : 'cover'
                }}
            />
        </div>
    );
};

export default OptimizedImage;
