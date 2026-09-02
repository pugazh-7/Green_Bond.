import mongoose from 'mongoose';

const deviceTokenSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        index: true 
    },
    userType: { 
        type: String, 
        enum: ['User', 'Farmer', 'DeliveryPartner', 'Shop'], 
        default: 'User' 
    },
    role: { 
        type: String, 
        default: 'user' 
    },
    token: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    platform: { 
        type: String, 
        enum: ['web', 'android', 'ios', 'desktop', 'unknown'], 
        default: 'web' 
    },
    deviceType: { 
        type: String, 
        default: 'browser' 
    },
    userAgent: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    lastUsedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Composite indexes for fast multi-device lookups
deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ token: 1, isActive: 1 });

export default mongoose.model('DeviceToken', deviceTokenSchema);
