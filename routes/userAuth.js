const express = require('express');
const passport = require('passport');
const { 
  googleOAuthCallback, 
  getUserProfile, 
  updateUserProfile,
  deleteUserAccount 
} = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/userAuth');
const router = express.Router();

// OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  googleOAuthCallback
);

router.get('/apple', 
  passport.authenticate('apple', { scope: ['name', 'email'] })
);

// Protected user routes
router.get('/profile', protectUser, getUserProfile);
router.put('/profile', protectUser, updateUserProfile);
router.delete('/account', protectUser, deleteUserAccount);

module.exports = router;
