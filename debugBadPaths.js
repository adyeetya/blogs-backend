// debugBadPaths.js
const originalRouter = require('express').Router;

require('express').Router = function(...args) {
  const router = originalRouter.apply(this, args);
  
  // Intercept route registration methods
  ['get', 'post', 'put', 'patch', 'delete', 'all'].forEach(method => {
    const original = router[method];
    router[method] = function(path, ...handlers) {
      console.log(`↳ registering ${method.toUpperCase()} route:`, JSON.stringify(path));
      return original.call(this, path, ...handlers);
    };
  });
  
  return router;
};
