import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DeliveryLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    React.useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_delivery_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }

        // Auto-redirect if already logged in
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'delivery') {
            navigate('/delivery');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }

        const cleanEmail = email.trim().toLowerCase();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login-delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: cleanEmail, password }),
            });

            const data = await response.json();

            if (response.ok) {
                const partner = data.partner;
                localStorage.setItem('userRole', 'delivery');
                localStorage.setItem('green_bond_current_user', JSON.stringify(partner));
                
                if (rememberMe) {
                    localStorage.setItem('remembered_delivery_email', cleanEmail);
                } else {
                    localStorage.removeItem('remembered_delivery_email');
                }

                navigate('/delivery');
                toast.success(`Welcome back, ${partner.name}!`);
            } else {
                toast.error(data.message || 'Invalid Email or Password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Server error. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md 2xl:max-w-xl w-full bg-white p-8 2xl:p-12 2xl:space-y-4 rounded-2xl shadow-xl border-t-4 border-blue-600 relative">

                <Link to="/" className="absolute top-6 left-6 text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                </Link>

                <div className="text-center mb-8">
                    <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-blue-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Partner Login</h2>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
                            placeholder="Email address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
                                placeholder="Enter your password"
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

                    <div className="flex items-center justify-between">
                        <label className="flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer" 
                            />
                            <span className="ml-2 text-sm text-gray-900 group-hover:text-blue-600 transition-colors" required>
                                Remember me
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Login
                    </button>

                    <div className="text-center mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                            New Partner?{' '}
                            <Link to="/signup/delivery" className="font-bold text-blue-700 hover:text-blue-600">
                                Register Here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliveryLogin;
