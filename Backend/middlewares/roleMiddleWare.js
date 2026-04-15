exports.authorizeRole = (role) => {
  return (req, res, next) => {
    console.log("USER ROLE:", req.user.role);
    console.log("REQUIRED ROLE:", role);
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ msg: "you dont have access this resource" });
    }

    next();
  };
};
