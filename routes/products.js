const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// ── GET /api/products — get all with filters ──
router.get('/', async (req, res) => {
  try {
    const { gender, category, brand, style, condition,
            minPrice, maxPrice, search, sort, page = 1, limit = 50 } = req.query;

    const query = { isActive: true };

    if (gender)    query.gender   = gender;
    if (category)  query.category = category;
    if (brand)     query.brand    = { $regex: brand, $options: 'i' };
    if (style)     query.style    = style;
    if (condition) query.condition = condition;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    let sortBy = { createdAt: -1 };
    if (sort === 'price_asc')   sortBy = { price: 1 };
    if (sort === 'price_desc')  sortBy = { price: -1 };
    if (sort === 'popular')     sortBy = { sold: -1 };
    if (sort === 'rating')      sortBy = { avgRating: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortBy).skip(skip).limit(Number(limit));

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/products/:id — single product ──
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.user', 'name');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/products — add product (anyone authenticated) ──
router.post('/', protect, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product added!', product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/products/:id — edit product (admin) ──
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product updated!', product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /api/products/:id — soft delete (admin) ──
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product removed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/products/:id/review — add review (protected) ──
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    // Check if already reviewed
    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You already reviewed this product.' });
    }

    product.reviews.push({
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(rating),
      comment
    });

    product.updateRating();
    await product.save();

    res.status(201).json({ message: 'Review added!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
