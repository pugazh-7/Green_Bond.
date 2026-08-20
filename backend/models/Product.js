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
    orderType: { type: String, enum: ['retail', 'bulk'], default: 'retail' },
    
    // New Fields for Marketplace Enhancement
    marketplaceType: { type: String, enum: ['SHOPPING', 'QUICK', 'FRESH'], default: 'FRESH' },
    sellerType: { type: String, enum: ['ADMIN', 'SHOP_OWNER', 'FARMER'], default: 'FARMER' },
    brand: { type: String },
    subcategory: { type: String },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    searchKeywords: { type: [String], default: [] },
    originalPrice: { type: String },
    discountPercentage: { type: Number },
    tags: { type: [String], default: [] },
    aliases: { type: [String], default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductSchema.index({ farmerId: 1 });
ProductSchema.index({ sellerId: 1 });
ProductSchema.index({ sourceType: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ availableQuantity: 1 });
ProductSchema.index({ marketplaceType: 1 });
ProductSchema.index({ isActive: 1 });

// Text Index for robust searching
ProductSchema.index({
    title: 'text',
    brand: 'text',
    category: 'text',
    subcategory: 'text',
    description: 'text',
    searchKeywords: 'text',
    aliases: 'text',
    tags: 'text'
}, {
    weights: {
        title: 10,
        aliases: 9,
        searchKeywords: 8,
        brand: 5,
        category: 4,
        subcategory: 4,
        tags: 3,
        description: 1
    },
    name: "TextSearchIndex"
});

export default mongoose.model('Product', ProductSchema);

