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
    role: {
        type: String,
        default: 'delivery'
    }
}, { timestamps: true });

export default mongoose.model('DeliveryPartner', deliveryPartnerSchema);

