import mongoose from 'mongoose';

const bulkOrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customer: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        contact: { type: String, required: true },
        address: { type: String }
    },
    farmer: { type: String, required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    location: { type: String },
    requestedQuantity: { type: Number, required: true },
    price: { type: String, required: true },
    image: { type: String },
    status: { 
        type: String, 
        enum: ['Inquiry Sent', 'Order Confirmed', 'Order Rejected', 'Cancelled'], 
        default: 'Inquiry Sent' 
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('BulkOrder', bulkOrderSchema);
