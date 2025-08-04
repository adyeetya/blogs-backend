const express = require('express');
const { body } = require('express-validator');
const { 
  getDashboardStats,
  getAllAdmins,
  createSubAdmin,
  updateAdminStatus,
  getAllUsers,
  updateUserStatus,
  getAllBlogs,
  updateBlogStatus,
  // getAnalytics,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/adminController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const { actionLimiter, readLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All admin routes require authentication
router.use(protectAdmin);

// ======================
// DASHBOARD & ANALYTICS
// ======================

// Dashboard overview
router.get('/dashboard', 
  checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'), 
  readLimiter, 
  getDashboardStats
);

// Analytics (detailed stats)
// router.get('/analytics', 
//   checkAdminRole('ADMIN', 'SUPER_ADMIN'), 
//   readLimiter, 
//   getAnalytics
// );

// ======================
// ADMIN MANAGEMENT
// ======================

// Get all admins (SUPER_ADMIN only)
router.get('/admins', 
  checkAdminRole('SUPER_ADMIN'), 
  readLimiter, 
  getAllAdmins
);

// Create new sub-admin
router.post('/admins/create', 
  checkAdminRole('SUPER_ADMIN'),
  actionLimiter,
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name: 2-50 characters'),
    body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name: 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password: minimum 8 characters'),
    body('roleType').isIn(['ADMIN', 'AUTHOR']).withMessage('Role must be ADMIN or AUTHOR')
  ],
  createSubAdmin
);

// Update admin status (activate/deactivate)
router.patch('/admins/:adminId/status', 
  checkAdminRole('SUPER_ADMIN'),
  actionLimiter,
  [
    body('isActive').isBoolean().withMessage('isActive must be boolean')
  ],
  updateAdminStatus
);

// ======================
// USER MANAGEMENT
// ======================

// Get all website users
router.get('/users', 
  checkAdminRole('ADMIN', 'SUPER_ADMIN'), 
  readLimiter, 
  getAllUsers
);

// Update user status
router.patch('/users/:userId/status', 
  checkAdminRole('ADMIN', 'SUPER_ADMIN'),
  actionLimiter,
  [
    body('isActive').isBoolean().withMessage('isActive must be boolean')
  ],
  updateUserStatus
);

// ======================
// BLOG MANAGEMENT
// ======================

// Get all blogs (including drafts)
router.get('/blogs', 
  checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'), 
  readLimiter, 
  getAllBlogs
);

// Update blog status (publish/unpublish/archive)
router.patch('/blogs/:blogId/status', 
  checkAdminRole('ADMIN', 'SUPER_ADMIN'),
  actionLimiter,
  [
    body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
  ],
  updateBlogStatus
);

// ======================
// SYSTEM SETTINGS
// ======================

// Get system settings
router.get('/settings', 
  checkAdminRole('SUPER_ADMIN'), 
  readLimiter, 
  getSystemSettings
);

// Update system settings
router.put('/settings', 
  checkAdminRole('SUPER_ADMIN'),
  actionLimiter,
  [
    body('siteName').optional().isLength({ min: 1, max: 100 }),
    body('siteDescription').optional().isLength({ max: 500 }),
    body('allowUserRegistration').optional().isBoolean(),
    body('requireEmailVerification').optional().isBoolean(),
    body('maintenanceMode').optional().isBoolean()
  ],
  updateSystemSettings
);

module.exports = router;
