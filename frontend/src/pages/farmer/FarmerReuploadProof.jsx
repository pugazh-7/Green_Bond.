import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/apiFetch';

const FarmerReuploadProof = () => {
    const navigate = useNavigate();
    const { user, login, logout, accessToken } = useAuth();
    const fileInputRef = useRef(null);

    const [documentType, setDocumentType] = useState('Patta');
    const [documentNumber, setDocumentNumber] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState(user?.landDocumentRejectionReason || '');

    useEffect(() => {
        // Fetch latest rejection reason from backend
        const fetchStatus = async () => {
            try {
                const res = await apiFetch('/api/farmers/me/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.landDocumentRejectionReason) {
                        setRejectionReason(data.landDocumentRejectionReason);
                    }
                    if (data.surveyNumber) {
                        setDocumentNumber(data.surveyNumber);
                    }
                    if (data.verificationStatus === 'APPROVED') {
                        login({ ...user, ...data, verificationStatus: 'APPROVED' });
                        navigate('/client', { replace: true });
                    }
                }
            } catch (e) {
                console.error('Failed to fetch status:', e);
            }
        };
        fetchStatus();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, JPEG, PNG, or PDF files are allowed.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit.');
            return;
        }

        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview('PDF_DOCUMENT');
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!selectedFile) {
            toast.error('Please upload a valid land document proof.');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Uploading corrected document...');

        try {
            const formData = new FormData();
            formData.append('landProof', selectedFile);
            formData.append('landDocumentType', documentType);
            formData.append('landDocumentNumber', documentNumber);

            const token = accessToken || localStorage.getItem('green_bond_token') || localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/farmers/reupload-proof`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Document re-uploaded successfully!', { id: loadingToast });
                login({ ...user, verificationStatus: 'PENDING', landDocumentRejectionReason: '' });
                navigate('/farmer/verification-pending', { replace: true });
            } else {
                toast.error(data.message || 'Failed to upload document', { id: loadingToast });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Network error during upload. Please retry.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        toast.success('Signed out');
        navigate('/login/farmer');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-slate-50 to-amber-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
            <header className="max-w-4xl mx-auto w-full flex justify-between items-center py-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="text-xl font-black text-slate-800 tracking-tight">GreenBond</span>
                    <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">ACTION REQUIRED</span>
                </div>
                <button 
                    onClick={handleLogout}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                    Sign Out
                </button>
            </header>

            <main className="max-w-xl mx-auto w-full my-auto">
                <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-400 via-amber-400 to-rose-500"></div>

                    {/* Alert Banner */}
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-left">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-bold text-rose-900 text-sm">Your land document needs correction</h3>
                                <p className="text-xs text-rose-700 mt-1 font-medium">
                                    {rejectionReason || 'The uploaded document could not be verified by the admin. Please upload a clearer copy of your Patta or Chitta.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 font-heading text-left">
                        Re-upload Land Proof
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mb-6 text-left">
                        Please upload a clear copy of your land ownership record (JPG, PNG, or PDF). Max 10MB.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        {/* Document Type & Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Document Type
                                </label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="Patta">Patta (பட்டா)</option>
                                    <option value="Chitta">Chitta (சிட்டா)</option>
                                    <option value="Other">Other Land Proof</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Survey / Document No.
                                </label>
                                <input
                                    type="text"
                                    value={documentNumber}
                                    onChange={(e) => setDocumentNumber(e.target.value)}
                                    placeholder="e.g. 124/2A"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* File Upload Box */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Select Document File
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,application/pdf"
                                capture="environment"
                                onChange={handleFileChange}
                                className="hidden"
                                id="reupload-file-input"
                            />

                            {!selectedFile ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
                                >
                                    <div className="text-4xl mb-2">📄</div>
                                    <p className="text-sm font-bold text-slate-700">Click to upload document</p>
                                    <p className="text-xs text-slate-400 mt-1">Supports Mobile Camera, Gallery, or PDF files (up to 10MB)</p>
                                    <button 
                                        type="button" 
                                        className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                                    >
                                        Browse Files / Take Photo
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 truncate">
                                        {filePreview === 'PDF_DOCUMENT' ? (
                                            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                                                PDF
                                            </div>
                                        ) : (
                                            <img 
                                                src={filePreview} 
                                                alt="Preview" 
                                                className="w-12 h-12 rounded-xl object-cover border border-slate-200" 
                                            />
                                        )}
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                                            <p className="text-[11px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="text-xs font-bold text-rose-600 hover:text-rose-800 p-2"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            id="btn-reupload-submit"
                            disabled={isSubmitting || !selectedFile}
                            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md mt-4 ${
                                isSubmitting || !selectedFile
                                    ? 'bg-slate-300 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:-translate-y-0.5'
                            }`}
                        >
                            {isSubmitting ? 'UPLOADING DOCUMENT...' : 'SUBMIT RE-UPLOAD FOR VERIFICATION'}
                        </button>
                    </form>
                </div>
            </main>

            <footer className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 py-4">
                GreenBond Technologies — Farmer Land Proof Portal
            </footer>
        </div>
    );
};

export default FarmerReuploadProof;
