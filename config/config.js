
const _ = require('lodash');
const config = require('./config.json');

// Use NODE_ENV or default to 'development'
const environment = process.env.NODE_ENV || 'development';
const defaultConfig = config.development;
const environmentConfig = config[environment] || {};
const finalConfig = _.merge({}, defaultConfig, environmentConfig);
global.gConfig = finalConfig;

// ...existing code...

// .env 
// PORT=5009
// MONGODB_URI=mongodb+srv://2612adityasingh2000:GdVSPNS3g5WskAFl@founders-blogs.wzu2l84.mongodb.net/
// NODE_ENV=development
// JWT_SECRET=your-super-secret-jwt-key
// RATE_LIMIT_WINDOW_MS=900000
// RATE_LIMIT_MAX_REQUESTS=100
