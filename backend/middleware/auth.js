const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email }).populate('role department');
    
    if (!user || !user.active) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Access denied: role information missing' });
    }

    const userRole = req.user.role.roleName;
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({ message: `Access denied: role ${userRole} not authorized` });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
