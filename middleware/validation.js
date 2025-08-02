const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

const blogValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('content')
    .custom((value) => {
      // Allow HTML content but validate it's not empty after stripping tags
      const plainText = value.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 50) {
        throw new Error('Content must be at least 50 characters (excluding HTML tags)');
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  handleValidationErrors
];

const likeValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('type')
    .optional()
    .isIn(['like', 'dislike'])
    .withMessage('Type must be either like or dislike'),
  handleValidationErrors
];

const saveValidation = [
  param('postId')
    .isMongoId()
    .withMessage('Invalid post ID'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  handleValidationErrors
];

module.exports = {
  blogValidation,
  likeValidation,
  saveValidation,
  handleValidationErrors
};
