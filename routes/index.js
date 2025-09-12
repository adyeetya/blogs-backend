const express = require('express');
const userAuthRoutes = require('./userAuth');
const adminAuthRoutes = require('./adminAuth');
const blogRoutes = require('./blogs');
const adminRoutes = require('./admin');
const searchRoutes = require('./search');

const likeRoutes = require('./likes');
const saveRoutes = require('./saves');
const magazineRoutes = require('./magazines');


const categoriesRoutes = require('./categories');
const router = express.Router();

// User routes (OAuth-based)
router.use('/auth/users', userAuthRoutes);

// Admin routes (password-based)
router.use('/auth/admin', adminAuthRoutes);

// Content routes

router.use('/categories', categoriesRoutes);
router.use('/blogs', blogRoutes);
router.use('/admin', adminRoutes);
router.use('/search', searchRoutes);

router.use('/likes', likeRoutes);
router.use('/saves', saveRoutes);
router.use('/magazines', magazineRoutes);

module.exports = router;
