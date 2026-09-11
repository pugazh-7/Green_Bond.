import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 10
    },
    location: {
        type: String,
        required: false,
        default: ''
    },
    address: {
        type: String,
    },
    lat: { type: Number },
    lng: { type: Number },
    farmLocation: {
        lat: { type: Number },
        lng: { type: Number },
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String },
        area: { type: String },
        placeId: { type: String }
    },
    farmLocationGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    serviceRadius: {
        type: Number,
        default: 20 // Default service radius in kilometers
    },
    pin: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    // Land & Farm Specific Details
    landOwnerName: {
        type: String,
        trim: true,
        default: ''
    },
    surveyNumber: {
        type: String,
        trim: true,
        default: ''
    },
    landArea: {
        type: String,
        trim: true,
        default: ''
    },
    village: {
        type: String,
        trim: true,
        default: ''
    },
    taluk: {
        type: String,
        trim: true,
        default: ''
    },
    district: {
        type: String,
        trim: true,
        default: ''
    },
    state: {
        type: String,
        trim: true,
        default: ''
    },
    pincode: {
        type: String,
        trim: true,
        default: ''
    },
    // Land Document Verification Metadata
    landDocumentType: {
        type: String,
        enum: ['Patta', 'Chitta', 'Other'],
        default: 'Patta'
    },
    landDocumentNumber: {
        type: String,
        trim: true,
        default: ''
    },
    landDocumentReference: {
        type: String,
        default: ''
    },
    landDocumentOriginalName: {
        type: String,
        default: ''
    },
    landDocumentMimeType: {
        type: String,
        default: ''
    },
    landDocumentUploadedAt: {
        type: Date,
        default: null
    },
    landDocumentVerifiedAt: {
        type: Date,
        default: null
    },
    landDocumentVerifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    landDocumentRejectionReason: {
        type: String,
        default: ''
    },
    farmerStatus: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'PENDING'
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PENDING_VERIFICATION', 'IDENTITY_VERIFIED', 'LAND_VERIFIED'],
        default: 'PENDING'
    },
    idProofDoc: { type: String },
    landProofDoc: { type: String },
    lastLogoutAt: { type: Date, default: null }
}, { timestamps: true });

farmerSchema.index({ verificationStatus: 1 });
farmerSchema.index({ farmerStatus: 1 });
farmerSchema.index({ farmLocationGeo: '2dsphere' });

export default mongoose.model('Farmer', farmerSchema);
