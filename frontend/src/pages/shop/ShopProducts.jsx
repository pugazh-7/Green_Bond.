import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import ProductImage from '../../components/shared/ProductImage';
import {
    Package,
    Plus,
    Edit,
    Search,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Power
} from '../../components/ui/Icons';

const CATEGORIES = ['Groceries', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Dairy & Eggs', 'Bakery', 'Fruits & Vegetables'];

const ShopProducts = () => {
    const { user, accessToken } = useAuth();
    const { location } = useLocationContext();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Search and filter
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [stockFilter, setStockFilter] = useState('ALL');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingProductId, setDeletingProductId] = useState(null);

    // Form states
    const initialFormState = {
        title: '',
        price: '',
        category: 'Groceries',
        availableQuantity: 10,
        unit: 'piece',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        description: '',
        minOrder: 1,
        orderType: 'retail'
    };
    const [formData, setFormData] = useState(initialFormState);

    const fetchProducts = useCallback(async (quiet = false) => {
        if (!quiet) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch('/api/products/my-products', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } else {
                toast.error('Failed to load shop inventory');
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Network error loading inventory');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                location: location?.address || 'Shop Location',
                contact: user?.mobile || ''
            };

            const res = await fetch('/api/products/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Product added successfully!');
                setShowAddModal(false);
                setFormData(initialFormState);
                fetchProducts(true);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to add product');
            }
        } catch (err) {
            toast.error('Network error creating product');
        }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const res = await fetch(`/api/products/${editingProduct._id || editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    title: editingProduct.name || editingProduct.title,
                    price: editingProduct.price,
                    category: editingProduct.category,
                    minOrder: editingProduct.minOrder,
                    unit: editingProduct.unit,
                    description: editingProduct.description
                })
            });

            if (res.ok) {
                toast.success('Product updated successfully!');
                setEditingProduct(null);
                fetchProducts(true);
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update product');
            }
        } catch (err) {
            toast.error('Network error updating product');
        }
    };

    const handleUpdateStock = async (id, newQty) => {
        if (newQty < 0) return;
        try {
            const res = await fetch(`/api/products/${id}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ availableQuantity: newQty })
            });

            if (res.ok) {
                toast.success('Stock updated');
                // Optimistic local update
                setProducts(prev => prev.map(p => (p._id === id || p.id === id) ? { ...p, availableQuantity: newQty } : p));
            } else {
                toast.error('Failed to update stock');
                fetchProducts(true);
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await fetch(`/api/products/${id}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(data.message || 'Status changed');
                setProducts(prev => prev.map(p => (p._id === id || p.id === id) ? { ...p, isActive: data.isActive } : p));
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to toggle status');
            }
        } catch (err) {
            toast.error('Network error toggling status');
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (res.ok) {
                toast.success('Product removed from inventory');
                setDeletingProductId(null);
                setProducts(prev => prev.filter(p => (p._id !== id && p.id !== id)));
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to delete product');
            }
        } catch (err) {
            toast.error('Network error deleting product');
        }
    };

    // Filters
    const filteredProducts = products.filter(p => {
        const title = (p.name || p.title || '').toLowerCase();
        const category = (p.category || '').toLowerCase();

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            if (!title.includes(q) && !category.includes(q)) return false;
        }

        if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

        if (stockFilter === 'OUT_OF_STOCK' && p.availableQuantity > 0) return false;
        if (stockFilter === 'LOW_STOCK' && (p.availableQuantity === 0 || p.availableQuantity > 5)) return false;
        if (stockFilter === 'IN_STOCK' && p.availableQuantity <= 0) return false;
        if (stockFilter === 'ACTIVE' && p.isActive === false) return false;
        if (stockFilter === 'INACTIVE' && p.isActive !== false) return false;

        return true;
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Package className="w-6 h-6 text-emerald-600" />
                        Shop Inventory
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Manage catalog, update available quantities, and adjust prices
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchProducts(true)}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by title or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                    <option value="ALL">All Stock Levels</option>
                    <option value="IN_STOCK">In Stock (&gt; 0)</option>
                    <option value="LOW_STOCK">Low Stock (1-5)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                    <option value="ACTIVE">Status: Active Only</option>
                    <option value="INACTIVE">Status: Inactive Only</option>
                </select>
            </div>

            {/* Inventory Grid */}
            {isLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Loading catalog items...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No items match your filter</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Try clearing search terms or adding new products to your catalog
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProducts.map(product => {
                        const pid = product._id || product.id;
                        const isOutOfStock = product.availableQuantity <= 0;
                        const isLowStock = product.availableQuantity > 0 && product.availableQuantity <= 5;
                        const isActive = product.isActive !== false;

                        return (
                            <div
                                key={pid}
                                className={`bg-white rounded-2xl border transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-md ${
                                    !isActive ? 'border-slate-200 opacity-60' : 'border-slate-100'
                                }`}
                            >
                                {/* Image & Badges */}
                                <div className="h-44 bg-slate-100 relative overflow-hidden">
                                    <ProductImage product={product} className="w-full h-full object-cover" />
                                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                                        <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 shadow-sm">
                                            {product.category || 'General'}
                                        </span>
                                    </div>
                                    <div className="absolute top-2.5 right-2.5">
                                        <button
                                            onClick={() => handleToggleStatus(pid)}
                                            title={isActive ? 'Deactivate Product' : 'Activate Product'}
                                            className={`p-1.5 rounded-lg shadow-sm font-bold text-xs flex items-center gap-1 transition ${
                                                isActive
                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    : 'bg-rose-500 text-white hover:bg-rose-600'
                                            }`}
                                        >
                                            <Power className="w-3.5 h-3.5" />
                                            <span>{isActive ? 'Active' : 'Hidden'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 line-clamp-1 text-sm sm:text-base">
                                            {product.name || product.title}
                                        </h3>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-base font-black text-emerald-700">
                                                ₹{product.price}
                                            </span>
                                            {product.unit && (
                                                <span className="text-xs text-slate-400 font-medium">
                                                    / {product.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stock Controls */}
                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Stock:</span>
                                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                                                isOutOfStock
                                                    ? 'bg-rose-100 text-rose-700'
                                                    : isLowStock
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {isOutOfStock ? 'Out of Stock' : `${product.availableQuantity} units`}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleUpdateStock(pid, (product.availableQuantity || 0) - 1)}
                                                    disabled={product.availableQuantity <= 0}
                                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 transition"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold text-slate-800">
                                                    {product.availableQuantity || 0}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateStock(pid, (product.availableQuantity || 0) + 1)}
                                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setEditingProduct({ ...product, title: product.name || product.title })}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                                    title="Edit Product"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingProductId(pid)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Delete Product"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 p-6 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-600" />
                                Add New Product
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Organic Brown Bread"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g. 45"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Unit *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. kg, piece, packet"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Category *
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Initial Stock *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.availableQuantity}
                                        onChange={e => setFormData({ ...formData, availableQuantity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Short description of the product..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                                >
                                    Add Product
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 p-6 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Edit className="w-5 h-5 text-emerald-600" />
                                Edit Product
                            </h2>
                            <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingProduct.name || editingProduct.title || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value, title: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={editingProduct.price || ''}
                                        onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Unit *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingProduct.unit || 'piece'}
                                        onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Category *
                                </label>
                                <select
                                    value={editingProduct.category || 'Groceries'}
                                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows="2"
                                    value={editingProduct.description || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingProductId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-900">Delete Product?</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-5">
                            This product will be permanently removed from your shop inventory and marketplace listings.
                        </p>
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setDeletingProductId(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteProduct(deletingProductId)}
                                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopProducts;
