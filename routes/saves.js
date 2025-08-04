const express = require('express');
const { savePost, getSavedPosts, removeSavedPost } = require('../controllers/saveController');
const { actionLimiter, readLimiter } = require('../middleware/rateLimiter');
const { saveValidation } = require('../middleware/validation');

const router = express.Router();

// Save a post
router.post('/saves/:postId', actionLimiter, saveValidation, savePost);

// Get saved posts by token
router.get('/token/:token', readLimiter, getSavedPosts);

// Remove saved post
router.delete('/delete/:postId', actionLimiter, removeSavedPost);

module.exports = router;
