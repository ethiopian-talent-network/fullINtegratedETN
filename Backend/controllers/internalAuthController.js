const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db")

const INTERNAL_ROLES = ["admin", "owner"];

// POST /api/internal/login — admin & owner only login
exports.internalLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Account not found" });

    const user = rows[0];

    if (!INTERNAL_ROLES.includes(user.role))
      return res.status(403).json({ message: "Access denied. This portal is for internal staff only." });

    if (!user.is_verified)
      return res.status(403).json({ message: "Account not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
