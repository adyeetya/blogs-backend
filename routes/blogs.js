const express = require('express');
const { 
  getAllBlogs, 
  getBlogBySlug, 
  createBlog, 
  updateBlog, 
  deleteBlog 
} = require('../controllers/blogController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const { optionalUserAuth } = require('../middleware/userAuth');
const { readLimiter, actionLimiter } = require('../middleware/rateLimiter');
const { blogValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes (with optional user context for personalization)
router.get('/', readLimiter, optionalUserAuth, getAllBlogs);
router.get('/:slug', readLimiter, optionalUserAuth, getBlogBySlug);

// Admin-only routes for blog management
router.post('/', 
  protectAdmin,
  checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
  actionLimiter, 
  blogValidation, 
  createBlog
);

router.put('/:id', 
  protectAdmin,
  checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
  actionLimiter, 
  blogValidation, 
  updateBlog
);

router.delete('/:id', 
  protectAdmin,
  checkAdminRole('ADMIN', 'SUPER_ADMIN'),
  actionLimiter, 
  deleteBlog
);

module.exports = router;
