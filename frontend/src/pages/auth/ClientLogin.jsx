import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ClientLogin = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [pin, setPin] = useState('');


    const [showForgotPin, setShowForgotPin] = useState(false);
    const [resetName, setResetName] = useState('');
    const [resetMobile, setResetMobile] = useState('');
    const [newPin, setNewPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [showResetPin, setShowResetPin] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (mobile.length !== 10) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login-farmer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, mobile, pin }),
            });

            const data = await response.json();

            if (response.ok) {
                const farmer = data.farmer;
                localStorage.setItem('userRole', 'client');
                localStorage.setItem('green_bond_current_user', JSON.stringify(farmer));
                navigate('/client');
                toast.success('Login Successful!');
            } else {
                toast.error(data.message || 'Invalid Name, Mobile Number or PIN. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Server error. Please try again later.');
        }
    };

    const handleForgotPin = (e) => {
        e.preventDefault();
        const farmers = JSON.parse(localStorage.getItem('green_bond_farmers') || '[]');
        const farmerIndex = farmers.findIndex(f =>
            f.mobile === resetMobile &&
            f.name.toLowerCase() === resetName.toLowerCase()
        );

        if (farmerIndex !== -1) {
            farmers[farmerIndex].pin = newPin;
            localStorage.setItem('green_bond_farmers', JSON.stringify(farmers));
            toast.success('PIN Reset Successful! Please Login.');
            setShowForgotPin(false);
            setResetName('');
            setResetMobile('');
            setNewPin('');
        } else {
            toast.error('Details not found! Please check Name and Mobile Number.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F9F4] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border-t-4 border-green-600 relative">

                <Link to="/" className="absolute top-6 left-6 text-green-700 hover:text-green-900 transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                </Link>

                <div className="text-center mb-8">
                    <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Farmer Login</h2>
                    <div className="flex items-center justify-center mt-2 gap-2 text-green-700 bg-green-50 py-1 px-3 rounded-full inline-flex mx-auto w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">100% Secure & Encrypted</span>
                    </div>
                </div>

                {showForgotPin ? (
                    <form className="space-y-6" onSubmit={handleForgotPin}>
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Reset Your PIN</h3>
                            <p className="text-sm text-gray-600">Enter details to verify identity</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={resetName}
                                onChange={(e) => setResetName(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter Your Registered Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                value={resetMobile}
                                onChange={(e) => setResetMobile(e.target.value.replace(/\D/g, ''))}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter Registered Mobile"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">New PIN</label>
                            <div className="relative">
                                <input
                                    type={showResetPin ? "text" : "password"}
                                    required
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500"
                                    placeholder="Set New 4-Digit PIN"
                                    maxLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowResetPin(!showResetPin)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showResetPin ? (
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
                        <button
                            type="submit"
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Reset PIN
                        </button>
                        <div className="text-center mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForgotPin(false)}
                                className="text-sm font-bold text-green-700 hover:text-green-600"
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-lg"
                                placeholder=" Enter Your Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm font-bold">+91</span>
                                </div>
                                <input
                                    type="tel"
                                    required
                                    value={mobile}
                                    maxLength={10}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) setMobile(value);
                                    }}
                                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 pr-12 sm:text-lg border-gray-300 rounded-lg py-3"
                                    placeholder="Enter Mobile Number"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>



                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Pin / Password</label>
                            <div className="relative">
                                <input
                                    type={showPin ? "text" : "password"}
                                    required
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-lg"
                                    placeholder="Enter your PIN"
                                    maxLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPin ? (
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember_me" type="checkbox" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                                    Keep me logged in
                                </label>
                            </div>
                            <div className="text-sm">
                                <button type="button" onClick={() => setShowForgotPin(true)} className="font-bold text-green-600 hover:text-green-500">
                                    Forgot PIN?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Secure Login
                        </button>

                        <div className="text-center mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600">
                                New Farmer?{' '}
                                <Link to="/signup/farmer" className="font-bold text-green-700 hover:text-green-600">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ClientLogin;
