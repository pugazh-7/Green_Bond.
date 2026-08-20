import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';

const ShopProducts = () => {
    const { user, accessToken } = useAuth();
    const { location } = useLocationContext();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category: 'Groceries',
        availableQuantity: 0,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        description: '',
        minOrder: '1',
        orderType: 'retail'
    });

    const fetchProducts = async () => {
        try {
            const token = accessToken;
            const res = await fetch('/api/products/my-products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            const token = accessToken;
            
            const payload = {
                ...formData,
                location: location?.address || 'Shop Location',
                contact: user.mobile
            };

            const res = await fetch('/api/products/add', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Product added successfully!');
                setIsAdding(false);
                setFormData({
                    ...formData, title: '', price: '', availableQuantity: 0, description: ''
                });
                fetchProducts();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to add product');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleUpdateStock = async (id, newQty) => {
        try {
            const token = accessToken;
            const res = await fetch(`/api/products/${id}/stock`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ availableQuantity: newQty })
            });

            if (res.ok) {
                toast.success('Stock updated');
                fetchProducts();
            } else {
                toast.error('Failed to update stock');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-gray-500 mt-1">Manage your shop items and stock levels.</p>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="px-4 py-2 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition-colors"
                >
                    {isAdding ? 'Cancel' : '+ Add Item'}
                </button>
            </header>

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Add New Item</h2>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input type="text" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="e.g. 50/kg or 20/unit" className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500">
                                <option value="Groceries">Groceries</option>
                                <option value="Snacks">Snacks</option>
                                <option value="Beverages">Beverages</option>
                                <option value="Personal Care">Personal Care</option>
                                <option value="Household">Household</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Quantity</label>
                            <input type="number" required min="0" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500" rows="3"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" className="w-full py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition-colors">
                                Add Item
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="p-10 text-center">Loading inventory...</div>
            ) : products.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 font-medium">No items in your inventory yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product._id || product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-40 bg-gray-100 relative">
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                <span className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-700">{product.category}</span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                                <p className="text-sm font-bold text-green-700 mb-4">{product.price}</p>
                                
                                <div className="mt-auto border-t border-gray-100 pt-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Stock: <b className={product.availableQuantity > 0 ? "text-gray-900" : "text-red-600"}>{product.availableQuantity}</b></span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleUpdateStock(product._id || product.id, product.availableQuantity - 1)}
                                            disabled={product.availableQuantity <= 0}
                                            className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold disabled:opacity-50"
                                        >-</button>
                                        <button 
                                            onClick={() => handleUpdateStock(product._id || product.id, product.availableQuantity + 1)}
                                            className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                                        >+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopProducts;
