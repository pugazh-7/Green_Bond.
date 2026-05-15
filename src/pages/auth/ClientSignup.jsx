import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ClientSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        location: '',
        pin: ''
    });

    const [showPin, setShowPin] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        if (formData.mobile.length !== 10) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register-farmer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Registration Successful! Please login.');
                navigate('/login/farmer');
            } else {
                toast.error(data.message || 'Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Server error. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md 2xl:max-w-xl w-full bg-white p-8 2xl:p-12 2xl:space-y-4 rounded-2xl shadow-xl border-t-4 border-green-600">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Farmer Registration</h2>
                    <p className="text-gray-600">Join GreenBond to sell your products.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSignup}>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder=" Enter Your Name"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm font-bold">+91</span>
                            </div>
                            <input
                                name="mobile"
                                type="tel"
                                required
                                maxLength={10}
                                className="appearance-none block w-full pl-12 pr-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder=" Enter Mobile Number"
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 10) {
                                        setFormData({ ...formData, mobile: value });
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">District / Location</label>
                        <input
                            name="location"
                            type="text"
                            required
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g. Madurai"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Create PIN</label>
                        <div className="relative">
                            <input
                                name="pin"
                                type={showPin ? "text" : "password"}
                                required
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="4 Digit Security PIN"
                                onChange={handleChange}
                                maxLength={4}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPin ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97(0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>                    <button
                        type="submit"
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mt-6"
                    >
                        Register Securely
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/login/farmer" className="font-bold text-green-700 hover:text-green-600">
                            Already registered? Login here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientSignup;
