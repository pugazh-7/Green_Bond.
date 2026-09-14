import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'customer', 'client', 'farmer', 'delivery', 'shop', 'admin'],
        default: 'user'
    },
    otpHash: {
        type: String,
        required: true
    },
    resetTokenHash: {
        type: String,
        default: null,
        index: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    used: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 300 } // TTL index removes document 5 minutes after expiration
    }
}, { timestamps: true });

export default mongoose.model('PasswordReset', passwordResetSchema);
