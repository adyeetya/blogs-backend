const Admin = require('../models/Admin');
const Role = require('../models/Role');
const { validationResult } = require('express-validator');

const adminLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const admin = await Admin.findOne({ email })
      .select('+password')
      .populate('role', 'name permissions');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account locked due to multiple failed login attempts'
      });
    }
    
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated'
      });
    }
    
    const isPasswordCorrect = await admin.comparePassword(password);
    
    if (!isPasswordCorrect) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.updateOne({
        $unset: {
          loginAttempts: 1,
          lockUntil: 1
        }
      });
    }
    
    // Update last login
    admin.lastLogin = new Date();
    await admin.save();
    
    const token = admin.generateAuthToken();
    
    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.twoFactorSecret;
    
    res.json({
      success: true,
      data: {
        admin: adminResponse,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .populate('role', 'name permissions')
      .populate('createdBy', 'firstName lastName email');
    
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    // Only SUPER_ADMIN can create other admins
    if (req.admin.role.name !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create other admins'
      });
    }
    
    const { firstName, lastName, email, password, roleType = 'ADMIN' } = req.body;
    
    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }
    
    // Get role
    const role = await Role.findOne({ name: roleType });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      role: role._id,
      createdBy: req.admin.id
    });
    
    await admin.save();
    await admin.populate('role', 'name permissions');
    
    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    
    res.status(201).json({
      success: true,
      data: adminResponse,
      message: 'Admin created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
  createAdmin
};
