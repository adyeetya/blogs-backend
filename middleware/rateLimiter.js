const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(900 / 60) + ' minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later'
    });
  }
});

// Strict limiter for like/save actions
const actionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 actions per 5 minutes
  message: {
    error: 'Too many actions from this IP, please slow down',
    retryAfter: '5 minutes'
  },
  skipSuccessfulRequests: true
});

// Read operations limiter (more lenient)
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many read requests, please slow down'
  }
});

module.exports = {
  generalLimiter,
  actionLimiter,
  readLimiter
};
