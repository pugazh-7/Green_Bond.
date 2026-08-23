import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const UserSignup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        location: null
    });

    const handleLocationChange = (loc) => {
        setFormData({ ...formData, location: loc });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const { name, email, mobile, password, confirmPassword } = formData;
        if (name.trim().length < 3) {
            toast.error("Name must be at least 3 characters long.");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address.");
            return false;
        }
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            toast.error("Mobile number must be exactly 10 digits.");
            return false;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return false;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return false;
        }
        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const newUser = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            mobile: formData.mobile.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            location: formData.location
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                // Auto-login after successful registration
                try {
                    const loginRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login-user`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: newUser.email, password: newUser.password }),
                        credentials: 'include'
                    });
                    if (loginRes.ok) {
                        const loginData = await loginRes.json();
                        login(loginData.user, loginData.token);
                        toast.success('Registration successful! Welcome to GreenBond.');
                        // Navigate will be handled by App.js protected route re-evaluation, but we can explicitly trigger it:
                        navigate('/user');
                    } else {
                        toast.success('Registration successful! Please login.');
                        navigate('/login/user');
                    }
                } catch (err) {
                    toast.success('Registration successful! Please login.');
                    navigate('/login/user');
                }
            } else {
                toast.error(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('GreenBond API error:', error);
            console.error('Request URL:', `${import.meta.env.VITE_API_URL || ''}/api/auth/register-user`);
            console.error('Error message:', error.message);
            if (error.name === 'AbortError') toast.error('Request timed out.');
            else toast.error('Unable to connect to GreenBond. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
            heroTitle="Fresh from farmers. Fast from nearby shops."
            heroSubtitle="Create an account to start shopping local."
            userRole="Customer"
        >
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Create Account</h2>
                    <p className="text-gray-500 text-sm">Join GreenBond today</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="John Doe" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </div>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="you@example.com" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="10-digit mobile number" maxLength="10" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                            <PasswordInput name="password" value={formData.password} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm</label>
                            <PasswordInput name="confirmPassword" placeholder="Confirm" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Location <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 transition-all">
                            <LocationPicker onLocationChange={handleLocationChange} />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${
                            isSubmitting 
                            ? 'bg-green-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5'
                        }`}
                    >
                        {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-5">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login/user" className="font-bold text-green-600 hover:text-green-800 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default UserSignup;


