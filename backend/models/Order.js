import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    cartId: String,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    price: String,
    farmer: String,
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
    sourceType: { type: String, enum: ['SHOP', 'FARMER'] },
    location: String,
    image: String,
    quantity: Number
});

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerEmail: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    sourceType: { type: String, enum: ['SHOP', 'FARMER'], default: 'FARMER' },
    sellerId: { type: mongoose.Schema.Types.ObjectId },
    deliveryBoyId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner' },
    items: [orderItemSchema],
    qty: { type: Number, required: true },
    total: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    productAmount: { type: Number, default: 0 },
    farmerAmount: { type: Number, default: 0 },
    greenBondCommission: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    gstBreakdown: [{
        productId: { type: mongoose.Schema.Types.ObjectId },
        rate: Number,
        taxableValue: Number,
        cgst: Number,
        sgst: Number,
        igst: Number,
        totalGst: Number
    }],
    deliveryBoyPayout: { type: Number, default: 0 },
    sellerAmount: { type: Number, default: 0 },
    settlementStatus: { type: String, enum: ['PENDING', 'SETTLED'], default: 'PENDING' },
    status: { 
        type: String, 
        enum: [
            // Canonical States
            'PLACED', 'CONFIRMED', 'PACKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED',
            // Legacy States (preserved for transition)
            'PENDING', 'ACCEPTED', 'FARMER_ACCEPTED', 'SHOP_ACCEPTED', 'PACKED', 
            'ReadyForPickup', 'Assigned', 'DELIVERY_ASSIGNED', 
            'OutForDelivery', 'PICKED_UP', 'Delivered', 'Cancelled'
        ],
        default: 'PLACED' 
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    pickupAddress: { type: String, required: true },
    deliveryLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    pickupLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    estimatedDeliveryTime: { type: Date },
    acceptedAt: { type: Date },
    packedAt: { type: Date },
    readyAt: { type: Date },
    assignedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    pickupOtp: { type: String },
    deliveryOtp: { type: String },
    pickupOtpVerified: { type: Boolean, default: false },
    deliveryOtpVerified: { type: Boolean, default: false },
    codAmount: { type: Number },
    codStatus: { type: String, enum: ['PENDING', 'COLLECTED'], default: 'PENDING' }
}, { timestamps: true });

orderSchema.index({ userId: 1 });
orderSchema.index({ sellerId: 1 });
orderSchema.index({ sourceType: 1 });
orderSchema.index({ 'items.farmerId': 1 });
orderSchema.index({ deliveryBoyId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
