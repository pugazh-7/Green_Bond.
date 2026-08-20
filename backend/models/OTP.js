import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    type: { type: String, enum: ['PICKUP', 'DELIVERY'], required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false }
}, { timestamps: true });

// TTL index to automatically delete expired OTPs after 5 minutes of expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 300 });
otpSchema.index({ orderId: 1, type: 1 });

export default mongoose.model('OTP', otpSchema);
