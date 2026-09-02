import React, { useState } from 'react';
import { getProductImage, getCategoryFallback } from '../../services/productImageResolver';

const ProductImage = ({ product, alt, className = "w-full h-full object-cover rounded-xl" }) => {
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    
    // Safety check
    if (!product) return null;
    
    // Always use the deterministic API image URL
    const resolvedSrc = getProductImage(product);
    const fallbackSrc = getCategoryFallback(product);

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-gray-50 overflow-hidden rounded-xl">
            {/* Skeleton / Loading State */}
            {status === 'loading' && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-greenbond-200 border-t-greenbond-600 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Actual Image */}
            <img 
                src={resolvedSrc} 
                alt={alt || product?.name || product?.title || 'Product'} 
                className={`${className} ${status === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                onLoad={() => setStatus('success')}
                onError={(e) => {
                    if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = "true";
                        e.currentTarget.srcset = '';
                        e.currentTarget.src = fallbackSrc;
                        setStatus('error');
                    }
                }}
            />

            {/* Error / Fallback State */}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-4 text-center">
                    <span className="text-4xl mb-2">🛍️</span>
                    <span className="text-xs font-medium text-gray-500 line-clamp-2">
                        {product?.name || product?.title || 'GreenBond Product'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProductImage;
