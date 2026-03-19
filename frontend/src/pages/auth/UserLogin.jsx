import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_user_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
        
        // Auto-redirect if already logged in
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'user' || userRole === 'admin') {
            navigate(userRole === 'admin' ? '/admin/dashboard' : '/user/marketplace');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }

        const cleanEmailInput = email.trim().toLowerCase();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: cleanEmailInput, password }),
            });

            const data = await response.json();

            if (response.ok) {
                const user = data.user;
                localStorage.setItem('userRole', user.role || 'user');
                localStorage.setItem('green_bond_current_user', JSON.stringify(user));

                if (rememberMe) {
                    localStorage.setItem('remembered_user_email', cleanEmailInput);
                } else {
                    localStorage.removeItem('remembered_user_email');
                }

                toast.success(`Welcome back, ${user.name}!`);
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/user/marketplace');
                }
            } else {
                toast.error(data.message || 'Invalid Email or Password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Server error. Please try again later.');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!resetEmail || !newPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password reset successfully! Please login with new password.');
                setShowForgotPassword(false);
                setResetEmail('');
                setNewPassword('');
            } else {
                toast.error(data.message || 'Error resetting password.');
            }
        } catch (error) {
            console.error('Reset error:', error);
            toast.error('Server error. Please try again later.');
        }
    };

    if (showForgotPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md 2xl:max-w-xl w-full space-y-8 2xl:space-y-12 bg-white/80 backdrop-blur-lg p-10 2xl:p-14 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-cyan-500"></div>
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="text-center mt-4">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Reset Password</h2>
                        <p className="mt-2 text-sm text-gray-600">Enter your email and new password.</p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 ml-1">Email address <span className="text-red-500">*</span></label>
                                <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Email address" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 ml-1">New Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type={showNewPassword ? "text" : "password"} 
                                        required 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" 
                                        placeholder="New Password" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showNewPassword ? (
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
                        <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg">
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md 2xl:max-w-xl w-full space-y-8 2xl:space-y-12 bg-white/80 backdrop-blur-lg p-10 2xl:p-14 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-cyan-500"></div>

                <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>

                <div className="text-center mt-4">
                    <div className="mx-auto h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Login</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Welcome back! Access your green portfolio.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1">Email address <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 ml-1">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
                                    placeholder="••••••••"
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

                    </div>

                    <div className="flex items-center justify-between">
                        <div 
                            className="flex items-center cursor-pointer group"
                            onClick={() => setRememberMe(!rememberMe)}
                        >
                            <input
                                type="checkbox"
                                required
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-900 group-hover:text-teal-600 transition-colors">
                                Remember me <span className="text-red-500">*</span>
                            </span>
                        </div>
                        <div className="text-sm">
                            <button type="button" onClick={() => setShowForgotPassword(true)} className="font-medium text-teal-600 hover:text-teal-500">
                                Forgot password?
                            </button>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-lg transform transition-all hover:-translate-y-0.5">
                            Sign in
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup/user" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                                Register as Investor
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserLogin;
