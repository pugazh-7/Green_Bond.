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
        required: true,
    },
    address: {
        type: String,
    },
    lat: { type: Number },
    lng: { type: Number },
    farmLocation: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    farmLocationGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    pin: {
        type: String,
        required: true,
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'IDENTITY_VERIFIED', 'LAND_VERIFIED', 'APPROVED', 'REJECTED'],
        default: 'PENDING_VERIFICATION'
    },
    idProofDoc: { type: String },
    landProofDoc: { type: String }
}, { timestamps: true });

farmerSchema.index({ verificationStatus: 1 });
farmerSchema.index({ farmLocationGeo: '2dsphere' });

export default mongoose.model('Farmer', farmerSchema);
