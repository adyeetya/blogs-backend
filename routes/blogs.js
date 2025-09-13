const express = require('express');
const { 
  getAllBlogs, 
  getBlogBySlug, 
  createBlog, 
  updateBlog, 
  deleteBlog,
  getLatestBlogs,
  getOlderBlogs,
  searchBlogs
} = require('../controllers/blogController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const { optionalUserAuth } = require('../middleware/userAuth');
const { readLimiter, actionLimiter } = require('../middleware/rateLimiter');
const { blogValidation } = require('../middleware/validation');
const uploadHandler = require('../helper/uploadHandler').default || require('../helper/uploadHandler');
const { uploadFilesOnS3 } = require('../controllers/uploadFilesOnS3');
const router = express.Router();


// Public routes (with optional user context for personalization)
router.get('/', readLimiter, optionalUserAuth, getAllBlogs);
router.get('/search', readLimiter, optionalUserAuth, searchBlogs);
router.get('/latest', readLimiter, optionalUserAuth, getLatestBlogs);
router.get('/older', readLimiter, optionalUserAuth, getOlderBlogs);
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


// Route for uploading files to S3 (admin only, with file upload handler)
router.post('/upload', 
  protectAdmin,
  checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
  (req, res, next) => uploadHandler.uploadFile(req, res, next),
  uploadFilesOnS3
);

module.exports = router;
