import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        label: 'Home',
        name: '',
        address: '',
        city: '',
        state: '',
        pin: '',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/user/addresses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAddresses(data);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (addressId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/user/addresses/${addressId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Address deleted");
                fetchAddresses();
            } else {
                toast.error("Failed to delete address");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/user/addresses`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Address added successfully");
                setShowModal(false);
                fetchAddresses();
                setFormData({
                    label: 'Home',
                    name: '',
                    address: '',
                    city: '',
                    state: '',
                    pin: '',
                    isDefault: false
                });
            } else {
                toast.error("Failed to add address");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    + Add New
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-6 text-gray-400">Loading addresses...</div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No saved addresses yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {addresses.map((addr) => (
                        <div key={addr._id} className="p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:shadow-sm transition-all relative group">
                            {addr.isDefault && (
                                <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    Default
                                </span>
                            )}
                            <div className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">
                                    {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}
                                </span>
                                <div className="pr-12">
                                    <p className="font-bold text-gray-900">{addr.name || addr.label}</p>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        {addr.address}, {addr.city}, {addr.state} - {addr.pin}
                                    </p>
                                    <div className="mt-3 flex gap-3">
                                        <button 
                                            onClick={() => handleDelete(addr._id)}
                                            className="text-xs font-medium text-red-500 hover:text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-md relative z-10 animate-slide-up sm:animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg text-gray-900">Add New Address</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="p-5 overflow-y-auto">
                            <form id="addressForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, label: 'Home' })}
                                        className={`p-3 border rounded-xl text-sm font-semibold transition-colors ${formData.label === 'Home' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        🏠 Home
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, label: 'Work' })}
                                        className={`p-3 border rounded-xl text-sm font-semibold transition-colors ${formData.label === 'Work' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        💼 Work
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Receiver Name</label>
                                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="John Doe" />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Complete Address</label>
                                    <textarea required name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none" placeholder="House/Flat No., Building Name, Street" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                                        <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                                        <input required type="text" name="pin" value={formData.pin} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                                    <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                                </div>

                                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                    <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                                    <span className="text-sm text-gray-700">Make this my default address</span>
                                </label>
                            </form>
                        </div>
                        
                        <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl shrink-0">
                            <button 
                                type="submit" 
                                form="addressForm"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md disabled:bg-green-400"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Address'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressManager;
