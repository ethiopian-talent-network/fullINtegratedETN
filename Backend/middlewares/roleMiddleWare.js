exports.authorizeRole = (...roles) => {
  return (req, res, next) => {
    console.log("[ROLE] Checking authorization:", { userRole: req.user?.role, allowedRoles: roles });
    if (!roles.includes(req.user.role)) {
      console.log("[ROLE] Authorization failed - user role not in allowed roles");
      return res.status(403).json({ msg: "you dont have access this resource" });
    }
    next();
  };
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("[ROLE] Checking authorization:", { userRole: req.user?.role, allowedRoles: roles });
    if (!roles.includes(req.user.role)) {
      console.log("[ROLE] Authorization failed - user role not in allowed roles");
      return res.status(403).json({ msg: "you dont have access this resource" });
    }
    next();
  };
};
