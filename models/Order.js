const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:     { type: String, required: true },
  image:    { type: String, required: true },
  price:    { type: Number, required: true },
  size:     { type: String, default: 'M' },
  quantity: { type: Number, default: 1 }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    name:    { type: String, required: true },
    phone:   { type: String, required: true },
    street:  { type: String, required: true },
    city:    { type: String, required: true },
    state:   { type: String, required: true },
    pincode: { type: String, required: true }
  },
  payment: {
    method:        { type: String, enum: ['upi', 'card', 'netbanking', 'cod'], required: true },
    status:        { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: { type: String, default: '' },
    paidAt:        Date
  },
  itemsTotal:    { type: Number, required: true },
  shippingCost:  { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status:    String,
    updatedAt: { type: Date, default: Date.now },
    note:      String
  }],
  trackingNumber: { type: String, default: '' },
  estimatedDelivery: Date,
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

// ── Auto-generate order number ──
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: 'pending', note: 'Order placed' });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
