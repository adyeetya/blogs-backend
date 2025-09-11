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
      const plainText = value.replace(/<[^>]*>/g, '').trim();
      if (plainText.length < 50) {
        throw new Error('Content must be at least 50 characters (excluding HTML tags)');
      }
      return true;
    })
    .withMessage('Content must be at least 50 characters (excluding HTML tags)'),
  body('featuredImage')
    .optional()
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('excerpt')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters'),
  body('author')
    .notEmpty()
    .withMessage('Author is required'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .withMessage('Each tag must be a string'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('publishedAt')
    .optional()
    .isISO8601()
    .withMessage('PublishedAt must be a valid date'),
  body('contentType')
    .optional()
    .isIn(['html', 'markdown'])
    .withMessage('Content type must be html or markdown'),
  body('views')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Views must be a non-negative integer'),
  body('likesCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Likes count must be a non-negative integer'),
  body('savesCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Saves count must be a non-negative integer'),
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
