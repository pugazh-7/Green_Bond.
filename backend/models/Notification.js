import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { 
        type: String, 
        enum: ['Order Update', 'Delivery Update', 'System', 'Promotion'],
        required: true 
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    orderId: { type: String, index: true },
    eventTag: { type: String, index: true }
}, { timestamps: true });

// Auto-delete notifications older than 30 days to save DB space
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Notification', notificationSchema);
