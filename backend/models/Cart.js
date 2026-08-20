import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    farmer: { type: String, required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    image: { type: String },
    quantity: { type: Number, required: true, default: 1 },
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

// Pre-save middleware to automatically calculate totals
cartSchema.pre('save', function(next) {
    let total = 0;
    this.items.forEach(item => {
        item.subtotal = item.price * item.quantity;
        total += item.subtotal;
    });
    this.totalAmount = total;
    // Basic delivery fee logic (could be more complex based on distance later)
    this.deliveryFee = total > 0 ? 50 : 0; 
    this.grandTotal = this.totalAmount + this.deliveryFee;
    next();
});

export default mongoose.model('Cart', cartSchema);
