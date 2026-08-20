import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    farmer: { type: String, required: false },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, required: false }, // References either Shop or Farmer depending on sourceType
    sourceType: { type: String, enum: ['SHOP', 'FARMER'], default: 'FARMER' },
    location: { type: String, required: true },
    price: { type: String, required: true },
    minOrder: { type: String, required: true },
    category: { type: String, required: true },
    contact: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    availableQuantity: { type: Number, required: true },
    unit: { type: String, required: true },
    orderType: { type: String, enum: ['retail', 'bulk'], default: 'retail' }
}, { timestamps: true });

ProductSchema.index({ farmerId: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ sourceType: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ availableQuantity: 1 });

export default mongoose.model('Product', ProductSchema);

