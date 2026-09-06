import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import { useAuth } from '../../context/AuthContext';

const ClientSignup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        pin: '',
        confirmPin: '',
        landOwnerName: '',
        surveyNumber: '',
        landArea: '',
        village: '',
        taluk: '',
        district: 'Tiruvannamalai',
        state: 'Tamil Nadu',
        pincode: '606601',
        landDocumentType: 'Patta',
        landDocumentNumber: ''
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only JPG, JPEG, PNG, or PDF files are allowed.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Document file size exceeds 10MB limit.');
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

    const validateForm = () => {
        const { name, mobile, pin, confirmPin, surveyNumber, landArea } = formData;
        if (!name || name.trim().length < 2) {
            toast.error('Please enter your full name.');
            return false;
        }
        if (!mobile || !/^[0-9]{10}$/.test(mobile.trim())) {
            toast.error('Mobile Number must be exactly 10 digits.');
            return false;
        }
        if (!pin || pin.trim().length < 4) {
            toast.error('PIN must be at least 4 characters long.');
            return false;
        }
        if (confirmPin && pin !== confirmPin) {
            toast.error('PINs do not match.');
            return false;
        }
        if (!surveyNumber || surveyNumber.trim().length < 1) {
            toast.error('Please enter the Survey Number.');
            return false;
        }
        if (!landArea || landArea.trim().length < 1) {
            toast.error('Please enter the Land Area (e.g. 2.5 Acres).');
            return false;
        }
        if (!selectedFile) {
            toast.error('Please upload your Patta / Chitta land proof document.');
            return false;
        }
        return true;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!validateForm()) return;

        setIsSubmitting(true);
        const loadingToast = toast.loading('Submitting farmer application with land proof...');

        try {
            const uploadData = new FormData();
            uploadData.append('name', formData.name.trim());
            uploadData.append('mobile', formData.mobile.trim());
            uploadData.append('email', formData.email.trim());
            uploadData.append('pin', formData.pin.trim());
            uploadData.append('landOwnerName', formData.landOwnerName.trim() || formData.name.trim());
            uploadData.append('surveyNumber', formData.surveyNumber.trim());
            uploadData.append('landArea', formData.landArea.trim());
            uploadData.append('village', formData.village.trim());
            uploadData.append('taluk', formData.taluk.trim());
            uploadData.append('district', formData.district.trim());
            uploadData.append('state', formData.state.trim());
            uploadData.append('pincode', formData.pincode.trim());
            uploadData.append('landDocumentType', formData.landDocumentType);
            uploadData.append('landDocumentNumber', formData.landDocumentNumber.trim() || formData.surveyNumber.trim());
            uploadData.append('address', `${formData.village}, ${formData.taluk}, ${formData.district}`);
            uploadData.append('location', formData.district || 'Thiruvannamalai');

            if (selectedFile) {
                uploadData.append('landProof', selectedFile);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register-farmer`, {
                method: 'POST',
                body: uploadData
            });

            const data = await response.json();

            if (response.ok && (data.user || data.farmer)) {
                const authenticatedUser = data.user || data.farmer;
                login(authenticatedUser, data.token);

                toast.success('Registration submitted! Your account is under verification.', { id: loadingToast });
                // Route explicitly to verification pending (DO NOT immediately open dashboard)
                navigate('/farmer/verification-pending', { replace: true });
            } else {
                toast.error(data.message || 'Registration failed. Please check your inputs.', { id: loadingToast });
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Unable to connect to GreenBond. Please try again.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout 
            heroImage="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&q=80"
            heroTitle="Sell directly to customers. Grow your local market."
            heroSubtitle="Empowering farmers with verified local trade & direct-to-consumer delivery."
            userRole="Farmer"
        >
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">Farmer Registration</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Enter farm details & upload land proof for verification</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4 text-left">
                    {/* SECTION 1: PERSONAL DETAILS */}
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>👤</span> Personal Details
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    required 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    placeholder="Enter full name" 
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                                    <input 
                                        type="tel" 
                                        name="mobile" 
                                        required 
                                        value={formData.mobile} 
                                        onChange={handleChange} 
                                        maxLength="10"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                        placeholder="10-digit mobile" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                        placeholder="email@example.com" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Create 4-digit PIN / Password *</label>
                                    <PasswordInput 
                                        name="pin" 
                                        required 
                                        value={formData.pin} 
                                        onChange={handleChange} 
                                        placeholder="e.g. 1234" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm PIN *</label>
                                    <PasswordInput 
                                        name="confirmPin" 
                                        required 
                                        value={formData.confirmPin} 
                                        onChange={handleChange} 
                                        placeholder="Confirm PIN" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: FARM & LAND DETAILS */}
                    <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>🌾</span> Land & Farm Details
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Land Owner Name</label>
                                    <input 
                                        type="text" 
                                        name="landOwnerName" 
                                        value={formData.landOwnerName} 
                                        onChange={handleChange} 
                                        placeholder="Owner name as in Patta"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Survey Number *</label>
                                    <input 
                                        type="text" 
                                        name="surveyNumber" 
                                        required
                                        value={formData.surveyNumber} 
                                        onChange={handleChange} 
                                        placeholder="e.g. 124/2A"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Land Area *</label>
                                    <input 
                                        type="text" 
                                        name="landArea" 
                                        required
                                        value={formData.landArea} 
                                        onChange={handleChange} 
                                        placeholder="e.g. 3 Acres"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Village</label>
                                    <input 
                                        type="text" 
                                        name="village" 
                                        value={formData.village} 
                                        onChange={handleChange} 
                                        placeholder="Village name"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">District</label>
                                    <input 
                                        type="text" 
                                        name="district" 
                                        value={formData.district} 
                                        onChange={handleChange} 
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: LAND PROOF UPLOAD */}
                    <div className="pb-2">
                        <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>📑</span> Land Proof Document
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Document Type *</label>
                                    <select
                                        name="landDocumentType"
                                        value={formData.landDocumentType}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none font-medium"
                                    >
                                        <option value="Patta">Patta (பட்டா)</option>
                                        <option value="Chitta">Chitta (சிட்டா)</option>
                                        <option value="Other">Other Land Ownership Document</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Document / Passbook No.</label>
                                    <input 
                                        type="text" 
                                        name="landDocumentNumber" 
                                        value={formData.landDocumentNumber} 
                                        onChange={handleChange} 
                                        placeholder="Document number"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm outline-none" 
                                    />
                                </div>
                            </div>

                            {/* File Upload Box */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Upload Document Copy (JPG, PNG, PDF) *</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                                    capture="environment"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="farmer-signup-file-input"
                                />

                                {!selectedFile ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/20"
                                    >
                                        <div className="text-3xl mb-1">📄</div>
                                        <p className="text-xs font-bold text-gray-700">Click to upload Patta or Chitta</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Supports Mobile Camera, Photo, or PDF (Max 10MB)</p>
                                        <button 
                                            type="button" 
                                            className="mt-2 px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
                                        >
                                            Browse / Take Photo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3 truncate">
                                            {filePreview === 'PDF_DOCUMENT' ? (
                                                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                                    PDF
                                                </div>
                                            ) : (
                                                <img 
                                                    src={filePreview} 
                                                    alt="Preview" 
                                                    className="w-10 h-10 rounded-lg object-cover border border-gray-200" 
                                                />
                                            )}
                                            <div className="truncate text-left">
                                                <p className="text-xs font-bold text-gray-800 truncate">{selectedFile.name}</p>
                                                <p className="text-[10px] text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        id="btn-farmer-signup-submit"
                        disabled={isSubmitting}
                        className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wide transition-all shadow-md mt-2 ${
                            isSubmitting 
                            ? 'bg-emerald-400 cursor-not-allowed' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:-translate-y-0.5'
                        }`}
                    >
                        {isSubmitting ? 'SUBMITTING APPLICATION...' : 'SUBMIT FARMER APPLICATION'}
                    </button>

                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-500">
                            Already registered?{' '}
                            <Link to="/login/farmer" className="font-bold text-emerald-600 hover:text-emerald-700">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ClientSignup;
