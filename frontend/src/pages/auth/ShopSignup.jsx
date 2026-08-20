import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';

const ShopSignup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        location: null
    });
    
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleLocationChange = (location) => {
        setFormData({ ...formData, location });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            return toast.error("Passwords don't match");
        }
        
        if (!formData.location) {
            return toast.error("Please select shop location");
        }

        setLoading(true);
        const loadingToast = toast.loading('Registering Shop...');

        try {
            const response = await fetch('/api/auth/register-shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Shop registered successfully!', { id: loadingToast });
                // We don't auto-login here since login returns token. Redirect to login
                navigate('/login/shop');
            } else {
                toast.error(data.message || 'Registration failed', { id: loadingToast });
            }
        } catch (error) {
            toast.error('An error occurred during registration', { id: loadingToast });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
            <div className="md:w-1/2 bg-yellow-600 text-white flex flex-col justify-center p-8 md:p-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Partner with GreenBond</h1>
                <p className="text-xl text-yellow-100 mb-8">
                    Register your local store to sell everyday essentials to nearby customers in minutes. Grow your business digitally.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">✓</div>
                        <span>Reach thousands of nearby customers</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">✓</div>
                        <span>Instant delivery handled by us</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">✓</div>
                        <span>Easy digital payments</span>
                    </div>
                </div>
            </div>
            
            <div className="md:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop Registration</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                            <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <input type="tel" name="mobile" required pattern="[0-9]{10}" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input type="password" name="confirmPassword" required minLength="6" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <LocationPicker onLocationChange={handleLocationChange} />
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full py-3 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-70">
                            {loading ? 'Registering...' : 'Register Shop'}
                        </button>
                    </form>
                    
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Already registered? <Link to="/login/shop" className="text-yellow-600 font-bold hover:underline">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopSignup;
