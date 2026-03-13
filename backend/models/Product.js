import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    farmer: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true },
    minOrder: { type: String, required: true },
    category: { type: String, required: true },
    contact: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    availableQuantity: { type: Number, required: true },
    unit: { type: String, required: true },
    orderType: { type: String, enum: ['retail', 'bulk'], default: 'retail' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', ProductSchema);

