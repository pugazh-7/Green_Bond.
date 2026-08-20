import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 10
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    locationGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    addresses: [{
        label: { type: String, enum: ['HOME', 'WORK', 'OTHER'], default: 'HOME' },
        name: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pin: { type: String },
        lat: { type: Number },
        lng: { type: Number },
        isDefault: { type: Boolean, default: false }
    }],
    role: {
        type: String,
        enum: ['customer', 'user', 'admin'],
        default: 'user'
    }
}, { timestamps: true });

userSchema.index({ locationGeo: '2dsphere' });

export default mongoose.model('User', userSchema);
