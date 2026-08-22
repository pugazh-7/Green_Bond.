import React, { useState } from 'react';
import { resolveProductImage } from '../../utils/imageResolver';

const ProductImage = ({ product, alt, className = "w-full h-full object-contain" }) => {
    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const imageUrl = resolveProductImage(product);

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-gray-50 overflow-hidden">
            {/* Skeleton / Loading State */}
            {status === 'loading' && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex flex-col items-center justify-center">
                    <span className="text-gray-300 mb-1 opacity-50">Loading</span>
                    <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="w-1/2 h-full bg-greenbond-200 rounded-full animate-[bounce_1s_infinite]"></div>
                    </div>
                </div>
            )}

            {/* Actual Image */}
            {imageUrl ? (
                <img 
                    src={imageUrl} 
                    alt={alt || product?.title || 'Product'} 
                    className={`${className} ${status === 'loading' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={() => setStatus('success')}
                    onError={() => setStatus('error')}
                />
            ) : null}

            {/* Error / Fallback State */}
            {(status === 'error' || !imageUrl) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                    <span className="text-3xl mb-1">🛍️</span>
                    <span className="text-[10px] font-medium text-gray-400 text-center px-2">
                        {product?.title?.substring(0, 15) || 'Product'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProductImage;
