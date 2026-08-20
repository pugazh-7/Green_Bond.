import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema({
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
        address: { type: String },
        updatedAt: { type: Date }
    },
    locationGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },
    status: {
        type: String,
        enum: ['Available', 'Offline'],
        default: 'Offline'
    },
    role: {
        type: String,
        default: 'delivery'
    }
}, { timestamps: true });

deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ locationGeo: '2dsphere' });

export default mongoose.model('DeliveryPartner', deliveryPartnerSchema);
