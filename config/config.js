
const _ = require('lodash');
const config = require('./config.json');

// Use NODE_ENV or default to 'development'
const environment = process.env.NODE_ENV || 'development';
const defaultConfig = config.development;
const environmentConfig = config[environment] || {};
const finalConfig = _.merge({}, defaultConfig, environmentConfig);
global.gConfig = finalConfig;

// ...existing code...