const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect route — verify JWT ──
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid or expired. Please login again.' });
  }
};

// ── Admin only ──
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only.' });
  }
};

module.exports = { protect, adminOnly };
