import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    gateway: { type: String, default: 'RAZORPAY' },
    paymentMethod: { type: String },
    status: { 
        type: String, 
        enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String },
    signature: { type: String },
    failureReason: { type: String },
    paidAt: { type: Date }
}, { timestamps: true });

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });

export default mongoose.model('Payment', paymentSchema);
