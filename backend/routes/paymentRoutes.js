import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret'
});

// Create a Razorpay Order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.body;
        
        const order = await Order.findOne({ id: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Amount must be authoritative from the server
        const amountInPaise = Math.round(order.totalAmount * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderId
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Create Payment record
        await Payment.create({
            userId: req.user.id,
            orderId: order.id,
            amount: order.totalAmount,
            gatewayOrderId: razorpayOrder.id,
            status: 'PENDING'
        });

        res.status(200).json({ 
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId'
        });
    } catch (error) {
        console.error("Payment creation error:", error);
        res.status(500).json({ message: 'Server error creating payment', error: error.message });
    }
});

// Webhook for Razorpay
router.post('/webhook', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'YourWebhookSecret';
        
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest === req.headers['x-razorpay-signature']) {
            const event = req.body.event;
            const payload = req.body.payload;

            if (event === 'order.paid' || event === 'payment.captured') {
                const paymentEntity = payload.payment.entity;
                const rzpOrderId = paymentEntity.order_id;
                
                // Idempotent processing
                const payment = await Payment.findOne({ gatewayOrderId: rzpOrderId });
                
                if (payment && payment.status === 'PENDING') {
                    payment.status = 'PAID';
                    payment.gatewayPaymentId = paymentEntity.id;
                    payment.signature = req.headers['x-razorpay-signature'];
                    payment.paidAt = new Date();
                    payment.paymentMethod = paymentEntity.method;
                    await payment.save();

                    // Update corresponding Order
                    await Order.findOneAndUpdate(
                        { id: payment.orderId },
                        { paymentStatus: 'Paid' }
                    );
                }
            }
            
            if (event === 'payment.failed') {
                const paymentEntity = payload.payment.entity;
                const rzpOrderId = paymentEntity.order_id;
                
                const payment = await Payment.findOne({ gatewayOrderId: rzpOrderId });
                
                if (payment && payment.status === 'PENDING') {
                    payment.status = 'FAILED';
                    payment.failureReason = paymentEntity.error_description || 'Payment Failed';
                    await payment.save();
                }
            }

            res.status(200).json({ status: 'ok' });
        } else {
            res.status(400).json({ status: 'invalid signature' });
        }
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ message: 'Server error handling webhook' });
    }
});

// Verify Payment synchronously for frontend (fallback to webhook)
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'YourTestKeySecret')
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            // Update Payment Status
            const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
            if (payment && payment.status === 'PENDING') {
                payment.status = 'PAID';
                payment.gatewayPaymentId = razorpay_payment_id;
                payment.signature = razorpay_signature;
                payment.paidAt = new Date();
                await payment.save();

                await Order.findOneAndUpdate(
                    { id: payment.orderId },
                    { paymentStatus: 'Paid' }
                );
            }
            return res.status(200).json({ message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({ message: 'Server error verifying payment' });
    }
});

export default router;
