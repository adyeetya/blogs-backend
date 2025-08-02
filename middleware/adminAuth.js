const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Role = require('../models/Role');

const protectAdmin = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin login required.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure this is an admin token, not user
    if (decoded.type !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Admin access required.'
      });
    }
    
    const admin = await Admin.findById(decoded.id)
      .populate('role', 'name permissions')
      .select('+password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or admin deactivated.'
      });
    }
    
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed login attempts.'
      });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid admin token.'
    });
  }
};

// Check admin role
const checkAdminRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin access required.'
      });
    }
    
    if (!roles.includes(req.admin.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient admin permissions.'
      });
    }
    
    next();
  };
};

module.exports = { protectAdmin, checkAdminRole };
