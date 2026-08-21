import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

const DeliveryLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Forgot Password States
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remembered_delivery_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        if (!email || !password) {
            toast.error("Please fill in all fields.");
            return;
        }

        setIsLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const cleanEmail = email.trim().toLowerCase();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanEmail, password }),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                const user = data.partner || data.user;
                const role = user.role || 'delivery';
                
                localStorage.setItem('userRole', role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(user));
                if (data.token) localStorage.setItem('token', data.token);
                
                login(user, data.token);
                
                if (rememberMe) {
                    localStorage.setItem('remembered_delivery_email', cleanEmail);
                } else {
                    localStorage.removeItem('remembered_delivery_email');
                }

                toast.success(`Welcome back, ${user.name}!`);
            } else {
                toast.error(data.message || 'Invalid Email or Password.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Login error:', error);
            if (error.name === 'AbortError') toast.error('Request timed out.');
            else toast.error('Unable to connect to GreenBond.');
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-password-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            toast.error('Unable to connect to GreenBond.');
        }
    };

    if (showForgotPassword) {
        return (
            <AuthLayout 
                heroImage="https://images.unsplash.com/photo-1551281223-9c869fb209b5?auto=format&fit=crop&q=80"
                heroTitle="Reset Password"
                heroSubtitle="Securely recover access to your account."
                userRole="Delivery Partner"
            >
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <button type="button" onClick={() => setShowForgotPassword(false)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-500 text-sm mb-6">Enter your email and new password.</p>
                    
                    <form onSubmit={handleForgotPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none" placeholder="Enter your email" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                        </div>
                        <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Reset Password
                        </button>
                    </form>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1551281223-9c869fb209b5?auto=format&fit=crop&q=80"
            heroTitle="Deliver locally. Earn flexibly."
            heroSubtitle="Join our delivery fleet and earn on your own schedule."
            userRole="Delivery Partner"
        >
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Delivery Login</h2>
                    <p className="text-gray-500 text-sm">Access your delivery dashboard</p>
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
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
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
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                        </label>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                            Forgot password?
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${
                            isLoading 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5'
                        }`}
                    >
                        {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-600">
                        Want to deliver with GreenBond?{' '}
                        <Link to="/signup/delivery" className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default DeliveryLogin;
