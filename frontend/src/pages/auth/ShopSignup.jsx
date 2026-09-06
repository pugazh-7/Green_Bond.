import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';

const ShopSignup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });
    
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        if (!formData.name || formData.name.trim().length < 3) {
            toast.error('Shop name must be at least 3 characters long.');
            return false;
        }
        if (!formData.ownerName || formData.ownerName.trim().length < 2) {
            toast.error('Owner name must be at least 2 characters long.');
            return false;
        }
        if (!formData.mobile || !/^[0-9]{10}$/.test(formData.mobile.trim())) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email.trim())) {
            toast.error('Please enter a valid email address.');
            return false;
        }
        if (!formData.password || formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!validateForm()) return;

        setLoading(true);
        const loadingToast = toast.loading('Registering Shop...');

        const newShop = {
            name: formData.name.trim(),
            ownerName: formData.ownerName.trim(),
            email: formData.email ? formData.email.trim() : undefined,
            mobile: formData.mobile.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword
        };

        try {
            const response = await apiFetch('/api/auth/register-shop', {
                method: 'POST',
                body: JSON.stringify(newShop)
            });

            const data = await response.json();

            if (response.ok && (data.user || data.shop)) {
                const authenticatedUser = data.user || data.shop;
                login(authenticatedUser, data.token);
                try {
                    sessionStorage.setItem('onboarding_in_progress', 'true');
                } catch (e) {}

                toast.success('Shop registered successfully! Please set your store location.', { id: loadingToast });
                navigate('/location-setup', { replace: true });
            } else {
                toast.error(data.message || 'Registration failed', { id: loadingToast });
            }
        } catch (error) {
            toast.error('An error occurred during registration', { id: loadingToast });
            console.error('Shop signup error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80"
            heroTitle="Reach nearby customers with fast local delivery."
            heroSubtitle="Register your store to sell essentials digitally."
            userRole="Shop Owner"
        >
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Shop Registration</h2>
                    <p className="text-gray-500 text-sm">Join the GreenBond local network</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Shop Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm outline-none" placeholder="Shop Name" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Owner Name</label>
                            <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm outline-none" placeholder="Owner Name" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
                            <input type="tel" name="mobile" pattern="[0-9]{10}" required value={formData.mobile} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm outline-none" placeholder="10-digit mobile" maxLength="10" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal text-xs">(Optional)</span></label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm outline-none" placeholder="Email address" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                            <PasswordInput name="password" value={formData.password} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm</label>
                            <PasswordInput name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm" />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${
                            loading 
                            ? 'bg-yellow-400 cursor-not-allowed' 
                            : 'bg-yellow-600 hover:bg-yellow-700 shadow-[0_4px_14px_0_rgba(202,138,4,0.39)] hover:shadow-[0_6px_20px_rgba(202,138,4,0.23)] hover:-translate-y-0.5'
                        }`}
                    >
                        {loading ? 'REGISTERING...' : 'REGISTER SHOP'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-5">
                    <p className="text-sm text-gray-600">
                        Already have a shop account?{' '}
                        <Link to="/login/shop" className="font-bold text-yellow-600 hover:text-yellow-800 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ShopSignup;
