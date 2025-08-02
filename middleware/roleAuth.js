const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }
    
    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

const checkPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }
    
    const hasPermission = permissions.some(permission => 
      req.user.role.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You don\'t have the required permissions.'
      });
    }
    
    next();
  };
};

module.exports = { checkRole, checkPermission };
