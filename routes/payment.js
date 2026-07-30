const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// Init Razorpay (only if keys exist)
let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
  razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
  });
}

// ── POST /api/payment/create — create Razorpay order ──
router.post('/create', protect, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: 'Payment gateway not configured.' });
    }

    const { amount } = req.body;   // amount in ₹

    const options = {
      amount:   Math.round(amount * 100),   // Razorpay uses paise
      currency: 'INR',
      receipt:  `th_${Date.now()}`,
      notes:    { store: 'ThriftHub' }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      orderId:  razorpayOrder.id,
      amount:   razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/payment/verify — verify Razorpay signature ──
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    // Update order payment status
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        'payment.status':        'paid',
        'payment.transactionId': razorpay_payment_id,
        'payment.paidAt':        new Date(),
        status:                  'confirmed'
      });
    }

    res.json({
      message:   'Payment verified successfully!',
      paymentId: razorpay_payment_id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/payment/upi-confirm — confirm UPI/COD payment manually ──
router.post('/upi-confirm', protect, async (req, res) => {
  try {
    const { orderId, method, transactionId } = req.body;

    const update = {
      'payment.method': method,
      'payment.status': method === 'cod' ? 'pending' : 'paid',
      status: 'confirmed'
    };
    if (transactionId) update['payment.transactionId'] = transactionId;

    const order = await Order.findByIdAndUpdate(orderId, update, { new: true });

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    res.json({ message: 'Payment confirmed!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
