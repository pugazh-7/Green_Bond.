import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

const UserLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_user_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;
        if (!email || !password || !email.trim() || !password.trim()) {
            toast.error("Please enter a valid email and password.");
            return;
        }

        setIsLoading(true);
        const cleanEmailInput = email.trim().toLowerCase();

        try {
            const response = await apiFetch('/api/auth/login-user', {
                method: 'POST',
                body: JSON.stringify({ email: cleanEmailInput, password })
            });

            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (response.ok && data.user) {
                const user = data.user;
                
                try {
                    if (rememberMe) {
                        localStorage.setItem('remembered_user_email', cleanEmailInput);
                    } else {
                        localStorage.removeItem('remembered_user_email');
                    }
                } catch (storageError) {
                    console.warn('Local storage error:', storageError);
                }

                login(user, data.token);

                toast.success(`Welcome back, ${user.name}!`);
                if (user.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else {
                    navigate('/user', { replace: true });
                }
            } else {
                if (response.status === 400) {
                    toast.error('Please enter a valid email and password.');
                } else if (response.status === 401) {
                    toast.error(data?.message || 'Invalid email or password.');
                } else if (response.status === 403) {
                    toast.error('You are not authorized to continue.');
                } else if (response.status === 404) {
                    toast.error(data?.message || 'Resource not found.');
                } else if (response.status === 429) {
                    toast.error('Too many attempts. Please try again later.');
                } else if (response.status >= 500) {
                    toast.error('GreenBond is temporarily unavailable. Please try again.');
                } else {
                    toast.error(data?.message || 'Invalid email or password.');
                }
            }
        } catch (error) {
            console.error('GreenBond Login error:', error);
            if (error.name === 'TimeoutError' || error.name === 'AbortError') {
                toast.error('GreenBond is taking too long to respond. Please try again.');
            } else if (error.name === 'NetworkError' || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                toast.error('Unable to connect to GreenBond. Please try again.');
            } else {
                toast.error('GreenBond is temporarily unavailable. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail || !newPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            const response = await apiFetch('/api/auth/reset-password-user', {
                method: 'POST',
                body: JSON.stringify({ email: resetEmail, newPassword })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Password reset successfully!');
                setShowForgotPassword(false);
                setResetEmail('');
                setNewPassword('');
            } else {
                toast.error(data.message || 'Error resetting password.');
            }
        } catch (error) {
            console.error('Reset error:', error);
            toast.error('Unable to connect to GreenBond. Please try again.');
        }
    };

    if (showForgotPassword) {
        return (
            <AuthLayout 
                heroImage="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
                heroTitle="Reset Password"
                heroSubtitle="Securely recover access to your account."
                userRole="Customer"
            >
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-500 text-sm mb-6">Enter your email and a new password.</p>
                    
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="Enter your email" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                        </div>
                        <button type="submit" className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Reset Password
                        </button>
                    </form>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"
            heroTitle="Fresh from farmers. Fast from nearby shops."
            heroSubtitle="Everything you need, delivered closer to you."
            userRole="Customer"
        >
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Welcome Back</h2>
                    <p className="text-gray-500 text-sm">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                        <PasswordInput 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                        </label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${
                            isLoading 
                            ? 'bg-green-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5'
                        }`}
                    >
                        {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup/user" id="account-create-user" className="font-bold text-green-600 hover:text-green-800 transition-colors">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default UserLogin;


