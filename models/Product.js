const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Original price is required']
  },
  gender: {
    type: String,
    required: true,
    enum: ['men', 'women', 'unisex']
  },
  category: {
    type: String,
    required: true,
    enum: ['tshirts', 'hoodies', 'jackets', 'bottoms', 'dresses', 'accessories']
  },
  brand: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair'],
    default: 'Good'
  },
  sizes: {
    type: [String],
    default: ['S', 'M', 'L', 'XL', 'XXL']
  },
  images: {
    type: [String],    // Cloudinary URLs or Unsplash URLs
    required: true
  },
  stock: {
    type: Number,
    default: 10,
    min: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  style: {
    type: String,
    enum: ['y2k', 'festival', 'premium', 'casual'],
    default: 'casual'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reviews:     [reviewSchema],
  numReviews:  { type: Number, default: 0 },
  avgRating:   { type: Number, default: 0 }
}, { timestamps: true });

// ── Virtual: discount percentage ──
productSchema.virtual('discountPercent').get(function () {
  return Math.round((1 - this.price / this.originalPrice) * 100);
});

// ── Update average rating when reviews change ──
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.avgRating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.avgRating = Math.round((total / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

// ── Text index for search ──
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
