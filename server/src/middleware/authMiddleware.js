const jwt = require('jsonwebtoken');
const env = require('../config/env');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = { id: decoded.id };
    } catch (err) {
      // Ignore invalid token in optional auth
    }
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, restrictTo };
