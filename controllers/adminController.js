const Admin = require('../models/Admin');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Role = require('../models/Role');

// Dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalAdmins,
      totalUsers,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      archivedBlogs,
      totalViews,
      recentBlogs,
      recentUsers
    ] = await Promise.all([
      Admin.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Blog.countDocuments({ status: 'draft' }),
      Blog.countDocuments({ status: 'archived' }),
      Blog.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Blog.find({ status: 'published' })
        .populate('author', 'firstName lastName')
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('title slug author publishedAt views likesCount'),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email createdAt lastLogin')
    ]);
    
    const stats = {
      overview: {
        admins: totalAdmins,
        users: totalUsers,
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs,
          archived: archivedBlogs
        },
        totalViews: totalViews[0]?.total || 0
      },
      recent: {
        blogs: recentBlogs,
        users: recentUsers
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all admins (SUPER_ADMIN only)
const getAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Role filter
    if (req.query.role) {
      const role = await Role.findOne({ name: req.query.role.toUpperCase() });
      if (role) filter.role = role._id;
    }
    
    // Active status filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    const admins = await Admin.find(filter)
      .populate('role', 'name permissions')
      .populate('createdBy', 'firstName lastName email')
      .select('-password -twoFactorSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Admin.countDocuments(filter);
    
    res.json({
      success: true,
      data: admins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create sub-admin
const createSubAdmin = async (req, res) => {
  try {
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
    
    // Remove sensitive data from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;
    delete adminResponse.twoFactorSecret;
    
    res.status(201).json({
      success: true,
      data: adminResponse,
      message: 'Sub-admin created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update admin status
const updateAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;
    
    const admin = await Admin.findById(adminId).populate('role', 'name');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Prevent deactivating super admin
    if (admin.role.name === 'SUPER_ADMIN' && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate Super Admin'
      });
    }
    
    // Prevent self-deactivation
    if (admin._id.toString() === req.admin.id && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }
    
    admin.isActive = isActive;
    await admin.save();
    
    res.json({
      success: true,
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all website users
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Active status filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Provider filter
    if (req.query.provider) {
      filter.authProvider = req.query.provider;
    }
    
    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    const users = await User.find(filter)
      .select('-googleId -appleId -facebookId') // Hide sensitive OAuth IDs
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all blogs (admin view)
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Author filter (for AUTHORS to see only their blogs)
    if (req.admin.role.name === 'AUTHOR') {
      filter.author = req.admin.id;
    } else if (req.query.author) {
      filter.author = req.query.author;
    }
    
    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    
    const blogs = await Blog.find(filter)
      .populate('author', 'firstName lastName email')
      .populate('category', 'name slug color')
      .select('-plainTextContent')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(filter);
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update blog status
const updateBlogStatus = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { status } = req.body;
    
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Update status and set publishedAt if publishing
    blog.status = status;
    if (status === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    await blog.save();
    
    res.json({
      success: true,
      message: `Blog ${status} successfully`,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// System settings functions would go here...
const getSystemSettings = async (req, res) => {
  // Implementation for system settings
  res.json({
    success: true,
    data: {
      siteName: process.env.SITE_NAME || 'My Blog',
      allowUserRegistration: true,
      maintenanceMode: false
    }
  });
};

const updateSystemSettings = async (req, res) => {
  // Implementation for updating system settings
  res.json({
    success: true,
    message: 'Settings updated successfully'
  });
};

module.exports = {
  getDashboardStats,
  getAllAdmins,
  createSubAdmin,
  updateAdminStatus,
  getAllUsers,
  updateUserStatus,
  getAllBlogs,
  updateBlogStatus,
  getSystemSettings,
  updateSystemSettings
};
