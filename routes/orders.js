const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── Email helper ──
const sendOrderEmail = async (userEmail, userName, order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const itemsList = order.items.map(i =>
      `<tr><td style="padding:8px">${i.name}</td><td style="padding:8px">Size: ${i.size}</td><td style="padding:8px;font-weight:bold">₹${i.price.toLocaleString('en-IN')}</td></tr>`
    ).join('');

    await transporter.sendMail({
      from:    `"ThriftHub" <${process.env.EMAIL_USER}>`,
      to:      userEmail,
      subject: `✅ Order Confirmed — ThriftHub`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#c8a96e">Order Confirmed! 🎉</h2>
          <p>Hi ${userName}, your order has been placed successfully.</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid #eee">
            ${itemsList}
            <tr style="background:#f9f6f2">
              <td colspan="2" style="padding:10px;font-weight:bold">Total</td>
              <td style="padding:10px;font-weight:bold;color:#c8a96e">₹${order.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
          <p style="margin-top:20px;color:#666">Payment: <strong>${order.payment.method.toUpperCase()}</strong></p>
          <p style="color:#888;font-size:12px">Estimated delivery: 5–7 business days</p>
          <p style="color:#c8a96e;font-weight:bold">Thank you for shopping with ThriftHub!</p>
        </div>`
    });
  } catch (err) {
    console.error('Email error (non-blocking):', err.message);
  }
};

// ── POST /api/orders — place order ──
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, payment } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    const itemsTotal   = items.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
    const shippingCost = itemsTotal > 999 ? 0 : 49;
    const codFee       = payment.method === 'cod' ? 40 : 0;
    const totalAmount  = itemsTotal + shippingCost + codFee;

    const order = await Order.create({
      user: req.user._id,
      items: items.map(i => ({
        product: i.product || null,
        name: i.name,
        image: i.image,
        price: i.price,
        size: i.size || 'M',
        quantity: i.quantity || 1
      })),
      shippingAddress,
      payment: { method: payment.method, status: payment.status || 'pending' },
      status: req.body.orderStatus || 'pending',
      itemsTotal,
      shippingCost,
      totalAmount
    });

    // Increment sold count on products
    for (const item of items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { sold: 1, stock: -1 }
        });
      }
    }

    // Send confirmation email (non-blocking)
    sendOrderEmail(req.user.email, req.user.name, order);

    res.status(201).json({ message: 'Order placed successfully!', order });

  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Order creation failed: ' + err.message });
  }
});

// ── GET /api/orders/my — user's orders ──
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/orders/all — admin: all orders ──
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/orders/:id — single order ──
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // Only owner or admin can view
    if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/orders/:id/status — admin update status ──
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, note, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, note: note || '' });
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (status === 'delivered') order.payment.status = 'paid';

    await order.save();
    res.json({ message: `Order status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/orders/:id/cancel — user cancel order ──
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel after shipping.' });
    }

    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by user';
    order.statusHistory.push({ status: 'cancelled', note: order.cancelReason });
    await order.save();

    res.json({ message: 'Order cancelled.', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
