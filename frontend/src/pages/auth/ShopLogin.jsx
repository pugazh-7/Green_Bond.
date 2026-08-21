import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

const ShopLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        mobile: '',
        password: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        const loadingToast = toast.loading('Logging in...');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login-shop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Login successful!', { id: loadingToast });
                login(data.shop, data.token);
            } else {
                toast.error(data.message || 'Login failed', { id: loadingToast });
            }
        } catch (error) {
            toast.error('Unable to connect to GreenBond', { id: loadingToast });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80"
            heroTitle="Reach nearby customers with fast local delivery."
            heroSubtitle="Digitize your store and grow your business today."
            userRole="Shop Owner"
        >
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Shop Login</h2>
                    <p className="text-gray-500 text-sm">Access your store dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <input
                                name="mobile"
                                type="tel"
                                pattern="[0-9]{10}"
                                required
                                value={formData.mobile}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm outline-none"
                                placeholder="10-digit mobile"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                        <PasswordInput 
                            name="password"
                            value={formData.password} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${
                            loading 
                            ? 'bg-yellow-400 cursor-not-allowed' 
                            : 'bg-yellow-600 hover:bg-yellow-700 shadow-[0_4px_14px_0_rgba(202,138,4,0.39)] hover:shadow-[0_6px_20px_rgba(202,138,4,0.23)] hover:-translate-y-0.5'
                        }`}
                    >
                        {loading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-600">
                        New to GreenBond?{' '}
                        <Link to="/signup/shop" className="font-bold text-yellow-600 hover:text-yellow-800 transition-colors">
                            Register your Shop
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ShopLogin;
