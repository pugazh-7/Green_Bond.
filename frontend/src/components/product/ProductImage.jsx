import React, { useState } from 'react';
import { getProductImage, getCategoryFallback } from '../../services/productImageResolver';

const ProductImage = ({ product, priority = false, className = "" }) => {
    const [imageStatus, setImageStatus] = useState('loading');

    // Handle invalid product objects safely
    if (!product) return null;

    const fallbackUrl = getCategoryFallback(product);
    // Strict DB resolution - _id is source of truth, no priority matching
    const resolvedUrl = getProductImage(product);

    const handleError = (e) => {
        if (e.currentTarget.src !== fallbackUrl) {
            e.currentTarget.srcset = '';
            e.currentTarget.src = fallbackUrl;
            setImageStatus('error');
        }
    };

    const handleLoad = () => {
        if (imageStatus !== 'error') {
            setImageStatus('loaded');
        }
    };

    return (
        <div className={`relative w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden ${className}`}>
            {/* Skeleton / Loading State */}
            {imageStatus === 'loading' && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-greenbond-200 border-t-greenbond-600 rounded-full animate-spin"></div>
                </div>
            )}
            
            {/* Actual Image */}
            <img 
                src={resolvedUrl} 
                alt={product.name || product.title || 'Product Image'} 
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                className={`w-full h-full object-contain transition-all duration-500 ease-out 
                    ${imageStatus === 'loading' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} 
                    ${imageStatus !== 'error' ? 'group-hover:scale-110' : ''}`}
                onLoad={handleLoad}
                onError={handleError}
            />
        </div>
    );
};

export default ProductImage;
