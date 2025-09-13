const express = require('express');
const router = express.Router();
const { getAllCategories, createCategory } = require('../controllers/categoryController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const { optionalUserAuth } = require('../middleware/userAuth');
const { readLimiter, actionLimiter } = require('../middleware/rateLimiter');

// Public route to get all categories
router.get('/', getAllCategories);

// Admin-only route to create a category
router.post('/', protectAdmin,
    checkAdminRole('ADMIN', 'SUPER_ADMIN', 'AUTHOR'),
    actionLimiter, createCategory);

module.exports = router;
