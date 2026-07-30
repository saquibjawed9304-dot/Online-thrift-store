const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── GET /api/wishlist — get user's wishlist ──
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist', 'name price originalPrice images category brand condition');
    res.json(user.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/wishlist/:productId — toggle product in wishlist ──
router.post('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const index = user.wishlist.indexOf(productId);

    if (index > -1) {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
      await user.save();
      res.json({ message: 'Removed from wishlist', inWishlist: false, wishlist: user.wishlist });
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      await user.save();
      res.json({ message: 'Added to wishlist!', inWishlist: true, wishlist: user.wishlist });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/wishlist/clear — clear all wishlist ──
router.delete('/clear', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { wishlist: [] });
    res.json({ message: 'Wishlist cleared.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
