import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';

const ClientSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        location: '',
        address: '',
        lat: null,
        lng: null,
        farmLocation: null,
        pin: '',
        idProofDoc: '',
        landProofDoc: ''
    });

    const handleLocationChange = (loc) => {
        setFormData({
            ...formData,
            location: loc.address,
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
            farmLocation: { lat: loc.lat, lng: loc.lng, address: loc.address }
        });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (formData.mobile.length !== 10) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return;
        }

        setIsSubmitting(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register-farmer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                signal: controller.signal,
                credentials: 'include'
            });

            clearTimeout(timeoutId);
            const data = await response.json();

            if (response.ok) {
                toast.success('Registration Successful! Please login.');
                navigate('/login/farmer');
            } else {
                toast.error(data.message || 'Registration failed.');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Registration error:', error);
            if (error.name === 'AbortError') toast.error('Request timed out.');
            else toast.error('Unable to connect to GreenBond. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80"
            heroTitle="Sell directly to customers. Grow your local market."
            heroSubtitle="Empowering farmers with a modern digital marketplace."
            userRole="Farmer"
        >
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Farmer Registration</h2>
                    <p className="text-gray-500 text-sm">Join GreenBond to sell your products</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="Your name" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="10-digit mobile" maxLength="10" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Set PIN</label>
                        <PasswordInput name="pin" value={formData.pin} onChange={handleChange} placeholder="Create a secure PIN" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">ID Proof Doc URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <input type="text" name="idProofDoc" value={formData.idProofDoc} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="URL" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Land Proof Doc URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <input type="text" name="landProofDoc" value={formData.landProofDoc} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all text-sm outline-none" placeholder="URL" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Farm Location <span className="text-red-500">*</span></label>
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
                        {isSubmitting ? 'REGISTERING...' : 'REGISTER AS FARMER'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-gray-100 pt-5">
                    <p className="text-sm text-gray-600">
                        Already have a farmer account?{' '}
                        <Link to="/login/farmer" className="font-bold text-green-600 hover:text-green-800 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ClientSignup;


