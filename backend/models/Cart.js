import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // `title` and `price` remain as read aliases for legacy UI. New writes use name/unitPrice.
    name: { type: String, required: true },
    title: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    price: { type: Number },
    farmer: { type: String, required: false },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: false },
    sellerType: { type: String, enum: ['ADMIN', 'SHOP_OWNER', 'FARMER'], default: 'FARMER' },
    marketplaceType: { type: String, enum: ['SHOPPING', 'QUICK', 'FRESH'], default: 'FRESH' },
    image: { type: String },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unit: { type: String },
    subtotal: { type: Number, required: true }
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 }
}, { timestamps: true });

cartSchema.pre('save', function(next) {
    let total = 0;
    if (this.items && Array.isArray(this.items)) {
        this.items.forEach(item => {
            item.price = item.unitPrice;
            item.title = item.name;
            item.subtotal = (item.unitPrice || 0) * (item.quantity || 1);
            total += item.subtotal;
        });
    }
    this.totalAmount = total;
    this.deliveryFee = total > 0 ? 50 : 0; 
    this.grandTotal = this.totalAmount + this.deliveryFee;
    if (typeof next === 'function') {
        next();
    }
});

export default mongoose.model('Cart', cartSchema);
