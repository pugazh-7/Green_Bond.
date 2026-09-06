import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';

const FarmerVerificationPending = () => {
    const navigate = useNavigate();
    const { user, login, logout } = useAuth();
    const [farmerStatus, setFarmerStatus] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkVerificationStatus = async (silent = false) => {
        setIsChecking(true);
        try {
            const res = await apiFetch('/api/farmers/me/status');
            if (res.ok) {
                const data = await res.json();
                setFarmerStatus(data);
                
                // If updated in context
                if (data.verificationStatus === 'APPROVED') {
                    login({ ...user, ...data, verificationStatus: 'APPROVED' });
                    toast.success('Your account has been approved! Redirecting to dashboard...');
                    navigate('/client', { replace: true });
                    return;
                } else if (data.verificationStatus === 'REJECTED') {
                    login({ ...user, ...data, verificationStatus: 'REJECTED' });
                    toast.error('Your land document was rejected. Please re-upload.');
                    navigate('/farmer/reupload-proof', { replace: true });
                    return;
                }
                if (!silent) {
                    toast('Verification is still under review by GreenBond Admin.', { icon: '⏳' });
                }
            }
        } catch (error) {
            console.error('Error checking farmer status:', error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        checkVerificationStatus(true);
        const interval = setInterval(() => checkVerificationStatus(true), 8000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.success('Signed out successfully');
        navigate('/login/farmer');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
            <header className="max-w-4xl mx-auto w-full flex justify-between items-center py-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="text-xl font-black text-emerald-800 tracking-tight">GreenBond</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">FARMER PORTAL</span>
                </div>
                <button 
                    onClick={handleLogout}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                    Sign Out
                </button>
            </header>

            <main className="max-w-2xl mx-auto w-full my-auto">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-teal-500"></div>

                    {/* Pending Badge & Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center text-3xl shadow-inner animate-pulse">
                        ⏳
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 font-heading">
                        Your farmer account is under verification
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-8">
                        Thank you for registering with GreenBond. Our administrative team is reviewing your land ownership documents (Patta / Chitta).
                    </p>

                    {/* Process Timeline */}
                    <div className="bg-slate-50 rounded-2xl p-5 mb-8 border border-slate-100 text-left">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Verification Steps</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Application Submitted</p>
                                    <p className="text-xs text-slate-500">Your details and land proof document were received.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-bold animate-spin">●</span>
                                <div>
                                    <p className="text-sm font-bold text-amber-700">Land Proof Review (In Progress)</p>
                                    <p className="text-xs text-slate-500">Admin is verifying survey number and ownership records.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 opacity-50">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold">3</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Farmer Dashboard Access</p>
                                    <p className="text-xs text-slate-500">List farm produce and access the local fresh marketplace.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submitted Details Card */}
                    <div className="bg-emerald-50/50 rounded-2xl p-4 mb-8 border border-emerald-100 text-left text-xs text-slate-700 grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-slate-400 font-medium block">Farmer Name</span>
                            <span className="font-bold text-slate-800">{farmerStatus?.name || user?.name || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium block">Registered Mobile</span>
                            <span className="font-bold text-slate-800">{farmerStatus?.mobile || user?.mobile || '—'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium block">Survey Number</span>
                            <span className="font-bold text-slate-800">{farmerStatus?.surveyNumber || user?.surveyNumber || 'Submitted'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium block">Document Type</span>
                            <span className="font-bold text-emerald-700">{farmerStatus?.landDocumentType || user?.landDocumentType || 'Patta/Chitta'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            id="btn-check-verification-status"
                            onClick={() => checkVerificationStatus(false)}
                            disabled={isChecking}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isChecking ? 'Checking Status...' : '🔄 Refresh Status'}
                        </button>
                    </div>
                </div>
            </main>

            <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 py-4">
                Need assistance? Contact GreenBond Farmer Support at <span className="text-emerald-600 font-semibold">support@greenbond.local</span>
            </footer>
        </div>
    );
};

export default FarmerVerificationPending;
