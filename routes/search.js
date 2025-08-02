const express = require('express');
const { searchBlogs, searchUsers, getPopularSearches } = require('../controllers/searchController');
const { readLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleAuth');

const router = express.Router();

// Public search routes
router.get('/blogs', readLimiter, searchBlogs);
router.get('/popular', readLimiter, getPopularSearches);

// Admin-only search routes
router.get('/users', protect, checkRole('ADMIN', 'SUPER_ADMIN'), searchUsers);

module.exports = router;
