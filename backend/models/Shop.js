import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    ownerName: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        minlength: 10,
        maxlength: 10
    },
    email: {
        type: String,
        unique: true,
        sparse: true
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
    isActive: {
        type: Boolean,
        default: true
    },
    operatingHours: {
        start: { type: String, default: "08:00" }, // e.g., "08:00"
        end: { type: String, default: "22:00" }    // e.g., "22:00"
    },
    role: {
        type: String,
        default: 'shop'
    }
}, { timestamps: true });

shopSchema.index({ locationGeo: '2dsphere' });
shopSchema.index({ isActive: 1 });

export default mongoose.model('Shop', shopSchema);
