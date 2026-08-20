import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // We'll use a hack to get a single product if an endpoint doesn't exist yet, 
                // but usually there's a GET /api/marketplace/products/:id or similar.
                // Assuming standard REST or fetching from general /products and filtering.
                // Actually, let's call the GET /api/marketplace/product/:id endpoint which we should ensure exists,
                // or just fetch all and find (not efficient). Let's assume a generic GET exists or we can mock it.
                // Since this is a new feature, I might need to add this route to backend.
                
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketplace/products`);
                if (res.ok) {
                    const data = await res.json();
                    const products = Array.isArray(data) ? data : (data.products || []);
                    const found = products.find(p => p.id === id || p._id === id);
                    if (found) {
                        setProduct(found);
                    } else {
                        toast.error("Product not found");
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const addToCart = () => {
        if (!product) return;
        const currentCart = JSON.parse(localStorage.getItem('user_cart') || '[]');
        const hasShopItems = currentCart.some(item => item.sourceType === 'SHOP');
        const hasFreshItems = currentCart.some(item => item.sourceType === 'FARMER');
        
        if ((product.sourceType === 'SHOP' && hasFreshItems) || (product.sourceType === 'FARMER' && hasShopItems)) {
            toast.error("Cannot mix Fresh Farmer items with Local Shop items.");
            return;
        }

        const existingItem = currentCart.find(item => item._id === product._id);
        if (existingItem) {
            existingItem.quantity += 1;
            localStorage.setItem('user_cart', JSON.stringify(currentCart));
        } else {
            localStorage.setItem('user_cart', JSON.stringify([...currentCart, { ...product, quantity: 1 }]));
        }
        toast.success(`Added ${product.title} to cart`);
        window.dispatchEvent(new Event('cart_updated'));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
                <button onClick={() => navigate('/user/marketplace')} className="bg-green-600 text-white px-6 py-2 rounded-xl">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 truncate flex-1">{product.title}</h1>
                    <button onClick={() => navigate('/user/cart')} className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
                        {product.discountPercentage > 0 && (
                            <div className="absolute top-6 left-6 z-10 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-lg shadow-sm">
                                {product.discountPercentage}% OFF
                            </div>
                        )}
                        <img 
                            src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'} 
                            alt={product.title} 
                            className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-xl"
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60';
                            }}
                        />
                    </div>

                    {/* Details Section */}
                    <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
                        <div className="mb-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.brand || 'GreenBond'} • {product.category}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">{product.title}</h2>
                        
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                                <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                <span className="text-sm font-bold text-yellow-700">{product.rating || 4.5}</span>
                            </div>
                            <span className="text-sm text-gray-500 underline">{product.reviewCount || 10} Ratings & Reviews</span>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl mb-8">
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-4xl font-black text-gray-900">₹{product.price}</span>
                                {product.originalPrice && product.originalPrice !== product.price && (
                                    <span className="text-lg text-gray-400 line-through mb-1 font-medium">₹{product.originalPrice}</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-4">Inclusive of all taxes</p>
                            
                            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Unit/Weight:</span>
                                    <span className="font-bold text-gray-900 uppercase">{product.unit || 'Piece'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Stock Status:</span>
                                    {product.availableQuantity > 0 ? (
                                        <span className="font-bold text-green-600">In Stock ({product.availableQuantity} left)</span>
                                    ) : (
                                        <span className="font-bold text-red-500">Out of Stock</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Seller:</span>
                                    <span className="font-bold text-gray-900">{product.sourceName || 'GreenBond Hub'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Product Description</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {product.description || `Experience premium quality with this authentic ${product.title} by ${product.brand}. Specially curated for GreenBond users with guaranteed authenticity and fast delivery.`}
                            </p>
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <button 
                                onClick={addToCart}
                                disabled={product.availableQuantity <= 0}
                                className="flex-1 bg-green-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {product.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductDetails;
