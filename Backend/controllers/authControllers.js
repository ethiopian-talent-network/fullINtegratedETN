const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { generateToken } = require("../utils/generateToken");

dotenv.config({ path: "./.env" });
const db = require("../config/db")
const { client: redis } = require("../config/redis");

// Create nodemailer transporter with SMTP
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

exports.signup = async (req, res) => {
  const connection = await db.getConnection();
  const { name, email, password, passwordConfirm, selectedRole } = req.body;
  if (!name || !email || !password || !passwordConfirm || !selectedRole) {
    return res.status(400).send({
      message: "Please provide all required fields",
    });
  }
  if (password !== passwordConfirm) {
    return res.status(400).send({
      message: "Passwords do not match",
    });
  }
  let role;
  if (selectedRole === "talent") {
    role = "talent";
  } else if (selectedRole === "employer") {
    role = "employer";
  } else {
    return res.status(400).json({ message: "Please select a valid role" });
  }

  try {
    await connection.beginTransaction();

    const [existingUser] = await connection.query(
      "select email from users where email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return res.status(400).send({
        message: "That email is already in use",
      });
    }
    let hashedPassword = await bcrypt.hash(password, 12);

    const otp = generateOTP();
    await redis.set(`otp:${email}`, otp, "EX", 300);

    const sql = "insert into users set ?";
    const values = {
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      last_token_reset: role === "talent" ? new Date() : null,
    };

    const [results] = await connection.query(sql, values);
    if (!results) {
      return res.status(500).send({
        message: "Internal server error",
      });
    }
    if (results) {
      // Auto-create employer profile placeholder so employer routes work immediately
      if (role === "employer") {
        const username = `employer_${results.insertId}`;
        await connection.query(
          "INSERT INTO employers (user_id, company_name, username, location) VALUES (?, ?, ?, '')",
          [results.insertId, name, username]
        );
      }
      await transporter.sendMail({
        from: `"ETN Company" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your ETN Verification Code",
        text: `Your OTP is: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <table align="center" width="100%" max-width="600px" style="background: #ffffff; border-radius: 8px; padding: 20px;">
              <tr>
                <td align="center">
                  <h2 style="color: #2c3e50; margin-bottom: 10px;">ETN Company</h2>
                  <p style="color: #555;">Your One-Time Password (OTP)</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <div style="
                    display: inline-block;
                    padding: 15px 25px;
                    font-size: 24px;
                    letter-spacing: 5px;
                    font-weight: bold;
                    color: #ffffff;
                    background-color: #007bff;
                    border-radius: 6px;
                  ">
                    ${otp}
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="color: #777; font-size: 14px;">
                    This code is valid for 5 minutes.
                  </p>
                  <p style="color: #777; font-size: 14px;">
                    Do not share this code with anyone.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 20px;">
                  <p style="font-size: 12px; color: #aaa;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </div>
        `,
      });
      await connection.commit();

      return res.status(200).send({
        message: "User registered successfully",
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "unexpected error occureds",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const redisOtp = await redis.get(`otp:${email}`);

    const sql = "select * from users where email = ?";
    const values = [email];

    const [rows] = await db.query(sql, values);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }
    if (!redisOtp || otp !== redisOtp) {
      return res.status(400).json({
        message: "Invalid OTP or expired",
      });
    }
    await redis.del(`otp:${email}`);

    const updateSql = "update users set is_verified = ? where email = ?";
    const updateValues = [true, email];

    const [result] = await db.query(updateSql, updateValues);
    if (result.affectedRows === 0) {
      return res.status(500).json({
        message: "Failed to verify OTP",
      });
    }
    // Only create tokens for talents
    if (user.role === "talent") {
      const [existingToken] = await db.query(
        "select * from tokens where talent_id = ?",
        [user.id],
      );

      if (existingToken.length === 0) {
        await db.query(
          "insert into tokens (talent_id , balance , last_token_reset) values(? , ? , NOW())",
          [user.id, 100],
        );
        await db.query(
          "INSERT INTO token_transactions (talent_id, amount, type , reason) VALUES (?, ?, ?, ?)",
          [user.id, 100, "credit", "signup bonus"],
        );
      }
    }

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const [users] = await db.query("select * from users where email = ?", [
      email,
    ]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        message: "User already verified",
      });
    }

    const otp = generateOTP();
    await redis.set(`otp:${email}`, otp, "EX", 300);

    await transporter.sendMail({
      from: `"ETN Company" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ETN Verification Code",
      text: `Your OTP is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <table align="center" width="100%" max-width="600px" style="background: #ffffff; border-radius: 8px; padding: 20px;">
            <tr>
              <td align="center">
                <h2 style="color: #2c3e50; margin-bottom: 10px;">ETN Company</h2>
                <p style="color: #555;">Your One-Time Password (OTP)</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 20px 0;">
                <div style="
                  display: inline-block;
                  padding: 15px 25px;
                  font-size: 24px;
                  letter-spacing: 5px;
                  font-weight: bold;
                  color: #ffffff;
                  background-color: #007bff;
                  border-radius: 6px;
                ">
                  ${otp}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="color: #777; font-size: 14px;">
                  This code is valid for 5 minutes.
                </p>
                <p style="color: #777; font-size: 14px;">
                  Do not share this code with anyone.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 20px;">
                <p style="font-size: 12px; color: #aaa;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res.status(500).json({
      message: "Error resending OTP",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  const connection = await db.getConnection();
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  // Password length validation
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  // Sanitize email (lowercase and trim)
  const sanitizedEmail = email.toLowerCase().trim();

  // Rate limiting: Check for too many failed attempts
  const loginAttemptsKey = `login_attempts:${sanitizedEmail}`;
  const attempts = await redis.get(loginAttemptsKey);
  const maxAttempts = 5;

  if (attempts && parseInt(attempts) >= maxAttempts) {
    const lockoutTime = await redis.ttl(loginAttemptsKey);
    return res.status(429).json({
      message: `Too many failed login attempts. Please try again in ${lockoutTime} seconds.`,
    });
  }

  try {
    await connection.beginTransaction();
    const sql = "select * from users where email = ?";

    const [result] = await connection.query(sql, [sanitizedEmail]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result[0];

    const Match = await bcrypt.compare(password, user.password);

    if (!Match) {
      // Increment failed attempts
      const currentAttempts = await redis.incr(loginAttemptsKey);
      if (currentAttempts === 1) {
        await redis.expire(loginAttemptsKey, 900); // 15 minutes lockout
      }

      return res.status(400).json({
        message: "Invalid password",
      });
    }

    if (!user.is_verified) {
      return res.status(400).json({
        message: "User not verified, please verify your email",
      });
    }

    // Clear failed attempts on successful login
    await redis.del(loginAttemptsKey);

    const token = generateToken(user);

    await connection.commit();

    return res.status(200).json({
      message: "User logged in successfully",
      token,
      role: user.role,
      user_id: user.id,
      name: user.name,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

exports.logout = async (req, res) => {
  try {
    // Get token from request headers
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      // Optionally: Add token to blacklist in Redis for session invalidation
      // await redis.set(`blacklist:${token}`, '1', 'EX', 3600); // 1 hour expiry
    }

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error during logout",
      error: error.message,
    });
  }
};
