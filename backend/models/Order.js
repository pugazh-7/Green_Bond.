import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    cartId: String,
    title: String,
    price: String,
    farmer: String,
    location: String,
    image: String,
    quantity: Number
});

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    customerEmail: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    items: [orderItemSchema],
    qty: { type: Number, required: true },
    total: { type: String, required: true },
    totalAmount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Placed', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Placed' 
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    pickupAddress: { type: String, required: true },
    acceptedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
