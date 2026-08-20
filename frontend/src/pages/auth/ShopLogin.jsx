import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ShopLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        mobile: '',
        password: ''
    });
    
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        const loadingToast = toast.loading('Logging in...');

        try {
            const response = await fetch('/api/auth/login-shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Login successful!', { id: loadingToast });
                login(data.shop, data.token);
            } else {
                toast.error(data.message || 'Login failed', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Server error during login', { id: loadingToast });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900">Shop Login</h2>
                    <p className="mt-2 text-sm text-gray-600">Access your shop dashboard to manage products and orders.</p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                        <input
                            name="mobile"
                            type="tel"
                            pattern="[0-9]{10}"
                            required
                            value={formData.mobile}
                            onChange={handleChange}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50"
                            placeholder="Enter 10-digit mobile"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-70 transition-colors"
                    >
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-600">
                        New to GreenBond?{' '}
                        <Link to="/signup/shop" className="font-bold text-yellow-600 hover:text-yellow-500">
                            Register your Shop
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopLogin;
