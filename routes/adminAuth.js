const express = require('express');
const { body } = require('express-validator');
const { 
  adminLogin, 
  getAdminProfile, 
  createAdmin 
} = require('../controllers/adminAuthController');
const { protectAdmin, checkAdminRole } = require('../middleware/adminAuth');
const { actionLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Admin login validation
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required')
];


// Public admin routes
router.post('/login', actionLimiter, loginValidation, adminLogin);

// Token verification route (public, just checks token validity)
const { verifyAdminToken } = require('../controllers/adminAuthController');
router.post('/verify', verifyAdminToken);

// Protected admin routes
router.use(protectAdmin); // All routes below require admin authentication

router.get('/profile', getAdminProfile);
router.post('/create', 
  checkAdminRole('SUPER_ADMIN'),
  [
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('roleType').optional().isIn(['ADMIN', 'AUTHOR'])
  ],
  createAdmin
);

module.exports = router;
