import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';

const UserSignup = () => {
    const navigate = useNavigate();
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

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDelayed, setIsDelayed] = useState(false);

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

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setIsDelayed(false);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
        const delayTimeoutId = setTimeout(() => setIsDelayed(true), 3000);

        const newUser = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            mobile: formData.mobile.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            location: formData.location
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            clearTimeout(delayTimeoutId);
            const data = await response.json();

            if (response.ok) {
                toast.success('Account Created Successfully! Please login.');
                navigate('/login/user');
            } else {
                toast.error(data.message || 'Registration failed.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            clearTimeout(delayTimeoutId);
            console.error('Registration error:', error);
            if (error.name === 'AbortError') {
                toast.error('Request timed out. Please try again.');
            } else {
                toast.error('Server error. Please try again later.');
            }
        } finally {
            setIsSubmitting(false);
            setIsDelayed(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md 2xl:max-w-xl w-full space-y-8 2xl:space-y-12 premium-card p-10 2xl:p-14 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 to-green-400"></div>
                <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
                    Back
                </Link>
                <div className="text-center mt-4">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 border border-green-200">
                        <span className="text-green-700 font-bold text-3xl font-heading">G</span>
                    </div>
                    <h2 className="mt-2 text-3xl font-black text-gray-900 tracking-tight font-heading">Create Account</h2>
                    <p className="mt-2 text-sm text-gray-600 font-medium">
                        Join GreenBond for fresh local deliveries.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Enter Your Name"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <input
                                name="mobile"
                                type="tel"
                                required
                                maxLength={10}
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                placeholder="Enter 10-digit Mobile Number"
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 10) {
                                        setFormData({ ...formData, mobile: value });
                                    }
                                }}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                    placeholder="Create a strong password"
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm password"
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showConfirmPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <LocationPicker onLocationChange={handleLocationChange} />
                    </div>

                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white ${
                                isSubmitting 
                                ? 'bg-emerald-400 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 focus:border-emerald-500 shadow-md transform transition-all hover:-translate-y-0.5'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isDelayed ? "Taking a little longer than usual. Please wait..." : "Creating account..."}
                                </span>
                            ) : 'Create Account'}
                        </button>
                    </div>
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login/user" className="font-bold text-green-700 hover:text-green-800 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserSignup;
