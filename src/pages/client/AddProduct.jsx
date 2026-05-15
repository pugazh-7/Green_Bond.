import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AddProduct = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        category: 'Vegetables',
        price: '',
        unit: 'kg',
        quantity: '',
        mobile: '',
        description: '',
        image: null,
        orderType: 'retail', // 'retail' or 'bulk'
        minOrder: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Enforcement of limits
        if (formData.unit === 'kg') {
            const minOrderNum = parseInt(formData.minOrder);
            if (formData.orderType === 'retail') {
                if (minOrderNum > 5) {
                    toast.error("Retail minimum order for Kg items cannot exceed 5kg. For larger orders, select 'Bulk Order' type.");
                    return;
                }
            } else if (formData.orderType === 'bulk') {
                if (minOrderNum < 10) {
                    toast.error("Bulk orders must have a minimum quantity of at least 10kg.");
                    return;
                }
            }
        }

        const currentUser = JSON.parse(localStorage.getItem('green_bond_current_user') || '{}');

        const newProduct = {
            title: formData.name,
            farmer: currentUser.name || "Authorized Farmer",
            location: currentUser.location || "Your Farm",
            price: `₹${formData.price}/${formData.unit}`,
            minOrder: `${formData.minOrder} ${formData.unit}`,
            category: formData.category,
            contact: formData.mobile,
            image: formData.image || "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=1974&auto=format&fit=crop",
            description: formData.description,
            availableQuantity: parseInt(formData.quantity),
            unit: formData.unit,
            orderType: formData.orderType
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProduct),
            });

            if (response.ok) {
                toast.success("Product Listed Successfully!");
                navigate('/client');
            } else {
                toast.error("Failed to list product.");
            }
        } catch (error) {
            console.error('Error listing product:', error);
            toast.error("Server error. Please try again.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">List New Produce</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.orderType === 'retail' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <input
                                type="radio"
                                name="orderType"
                                value="retail"
                                className="sr-only"
                                checked={formData.orderType === 'retail'}
                                onChange={e => setFormData({ ...formData, orderType: e.target.value })}
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.orderType === 'retail' ? 'border-green-600' : 'border-gray-300'}`}>
                                {formData.orderType === 'retail' && <div className="w-2 h-2 bg-green-600 rounded-full" />}
                            </div>
                            <div className="text-center">
                                <p className={`font-bold ${formData.orderType === 'retail' ? 'text-green-800' : 'text-gray-500'}`}>Retail Store</p>
                                <p className="text-xs text-gray-500">Max 5kg per item</p>
                            </div>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.orderType === 'bulk' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <input
                                type="radio"
                                name="orderType"
                                value="bulk"
                                className="sr-only"
                                checked={formData.orderType === 'bulk'}
                                onChange={e => setFormData({ ...formData, orderType: e.target.value })}
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.orderType === 'bulk' ? 'border-green-600' : 'border-gray-300'}`}>
                                {formData.orderType === 'bulk' && <div className="w-2 h-2 bg-green-600 rounded-full" />}
                            </div>
                            <div className="text-center">
                                <p className={`font-bold ${formData.orderType === 'bulk' ? 'text-green-800' : 'text-gray-500'}`}>Bulk Orders</p>
                                <p className="text-xs text-gray-500">Min 10kg per item</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Organic Tomatoes"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option>Vegetables</option>
                            <option>Fruits</option>
                            <option>Grains</option>
                            <option>Dairy</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                ₹
                            </span>
                            <input
                                type="number"
                                required
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 100"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        >
                            <option value="kg">Per Kg</option>
                            <option value="pc">Per Piece</option>
                            <option value="dz">Per Dozen</option>
                            <option value="bun">Per Bunch</option>
                            <option value="box">Per Box</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order ({formData.unit})</label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 5"
                            value={formData.minOrder}
                            onChange={e => setFormData({ ...formData, minOrder: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Mobile</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            placeholder="Customer connects via this"
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Describe your produce (freshness, harvest date, etc.)"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                        type="url"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for no image.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/client')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 rounded-lg text-white hover:bg-green-700 font-medium shadow-sm"
                    >
                        List Product
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
