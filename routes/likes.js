const express = require('express');
const { toggleLike, getLikeStatus } = require('../controllers/likeController');
const { actionLimiter, readLimiter } = require('../middleware/rateLimiter');
const { likeValidation } = require('../middleware/validation');

const router = express.Router();

// Toggle like for a post
router.post('/:postId', actionLimiter, likeValidation, toggleLike);

// Get like status for a post
router.get('/:postId/status', readLimiter, getLikeStatus);

module.exports = router;
