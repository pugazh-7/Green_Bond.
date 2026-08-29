import mongoose from 'mongoose';

const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'admin_settings'
    gstin: { type: String },
    legalName: { type: String },
    registeredAddress: { type: String },
    invoicePrefix: { type: String, default: 'GB-' },
    nextInvoiceNumber: { type: Number, default: 1 },
    deliveryFee: { type: Number, default: 0 },
    deliveryBoyPayoutPercentage: { type: Number, default: 100 }, // percentage of delivery fee
    greenBondCommissionPercentage: { type: Number, default: 10 }
}, { timestamps: true });

export default mongoose.model('Config', configSchema);
