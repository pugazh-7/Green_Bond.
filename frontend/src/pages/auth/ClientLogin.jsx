import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

const ClientLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [pin, setPin] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [showForgotPin, setShowForgotPin] = useState(false);
    const [resetName, setResetName] = useState('');
    const [resetMobile, setResetMobile] = useState('');
    const [newPin, setNewPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const rememberedName = localStorage.getItem('remembered_client_name');
        const rememberedMobile = localStorage.getItem('remembered_client_mobile');
        if (rememberedMobile) {
            setName(rememberedName || '');
            setMobile(rememberedMobile);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        if (mobile.length !== 10) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return;
        }

        setIsLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login-farmer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mobile, pin }),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                const user = data.farmer || data.user || data.partner;
                const role = user.role || 'client';
                
                localStorage.setItem('userRole', role);
                localStorage.setItem('green_bond_current_user', JSON.stringify(user));
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('green_bond_token', data.token);
                }
                
                login(user, data.token);
                
                if (rememberMe) {
                    localStorage.setItem('remembered_client_name', name);
                    localStorage.setItem('remembered_client_mobile', mobile);
                } else {
                    localStorage.removeItem('remembered_client_name');
                    localStorage.removeItem('remembered_client_mobile');
                }

                toast.success(`Welcome back, ${user.name}!`);
                navigate('/client', { replace: true });
            } else {
                toast.error(data.message || 'Invalid Name, Mobile Number or PIN.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Login error:', error);
            if (error.name === 'AbortError') toast.error('Request timed out.');
            else toast.error('Unable to connect to GreenBond. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPin = async (e) => {
        e.preventDefault();
        if (!resetName || !resetMobile || !newPin) {
            toast.error("Please fill in all fields.");
            return;
        }
        if (resetMobile.length !== 10) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/reset-pin-farmer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: resetName, mobile: resetMobile, newPin })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('PIN reset successfully!');
                setShowForgotPin(false);
                setResetName('');
                setResetMobile('');
                setNewPin('');
            } else {
                toast.error(data.message || 'Error resetting PIN.');
            }
        } catch (error) {
            console.error('Reset error:', error);
            toast.error('Unable to connect to GreenBond. Please try again.');
        }
    };

    if (showForgotPin) {
        return (
            <AuthLayout 
                heroImage="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80"
                heroTitle="Reset PIN"
                heroSubtitle="Securely recover access to your farmer dashboard."
                userRole="Farmer"
            >
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <button type="button" onClick={() => setShowForgotPin(false)} className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to login
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset PIN</h2>
                    <p className="text-gray-500 text-sm mb-6">Enter your details and a new PIN.</p>
                    
                    <form onSubmit={handleForgotPin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" required value={resetName} onChange={(e) => setResetName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="Your name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <input type="tel" required value={resetMobile} onChange={(e) => setResetMobile(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="10-digit mobile" maxLength="10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
                            <PasswordInput value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="Enter new PIN" />
                        </div>
                        <button type="submit" className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            Reset PIN
                        </button>
                    </form>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80"
            heroTitle="Sell directly to customers. Grow your local market."
            heroSubtitle="Empowering farmers with a modern digital marketplace."
            userRole="Farmer"
        >
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Farmer Login</h2>
                    <p className="text-gray-500 text-sm">Access your farmer dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="Your name" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <input type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="10-digit mobile" maxLength="10" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN</label>
                        <PasswordInput value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer group">
                            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer" />
                            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                        </label>
                        <button type="button" onClick={() => setShowForgotPin(true)} className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors">
                            Forgot PIN?
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
                        New farmer?{' '}
                        <Link to="/signup/farmer" className="font-bold text-green-600 hover:text-green-800 transition-colors">
                            Register as Farmer
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ClientLogin;


