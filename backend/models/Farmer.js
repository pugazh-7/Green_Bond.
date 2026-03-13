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
    pin: {
        type: String,
        required: true,
    }
}, { timestamps: true });

export default mongoose.model('Farmer', farmerSchema);

