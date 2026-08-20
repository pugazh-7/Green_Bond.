import mongoose from 'mongoose';

const serviceZoneSchema = new mongoose.Schema({
    zoneId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    locationGeo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    radiusKm: { type: Number, required: true, default: 10 },
    active: { type: Boolean, default: true },
    deliveryPricing: [{
        maxDistanceKm: Number,
        price: Number
    }],
    operatingHours: {
        start: String, // e.g., "08:00"
        end: String    // e.g., "22:00"
    }
}, { timestamps: true });

serviceZoneSchema.index({ locationGeo: '2dsphere' });
serviceZoneSchema.index({ active: 1 });

export default mongoose.model('ServiceZone', serviceZoneSchema);
