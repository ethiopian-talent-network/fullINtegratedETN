const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config({ path: "./.env" });
const db = require("../config/db").promise();
const redis = require("../config/redis");

const nodemailer = require("nodemailer");
const crypto = require("crypto");
const transporter = nodemailer.createTransport({
  service: "gmail",
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
    let hashedPassword = await bcrypt.hash(password, 8);

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
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP",
        text: otp,
      });
      await connection.commit();

      return res.status(200).send({
        message: "User registered successfully",
      });
    }
  } catch (error) {
    console.log(error);
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
    const [existingToken] = await db.query(
      "select * from tokens where talent_id = ?",
      [user.id],
    );

    if (user.role === "talent" || existingToken.length === 0) {
      await db.query(
        "insert into tokens (talent_id , balance , last_token_reset) values(? , ? , NOW())",
        [user.id, 100],
      );
      await db.query(
        "INSERT INTO token_transactions (talent_id, amount, type , reason) VALUES (?, ?, ?, ?)",
        [user.id, 100, "credit", "signup bonus"],
      );
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
  const { email } = req.body;
  const otp = generateOTP();

  const sql = "select * from users where email = ?";
  db.query(sql, [email], async (error, results) => {
    if (error) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
    const user = results[0];

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
    if (results) {
      await redis.set(`otp:${email}`, otp, "EX", 300);

      await transporter.sendMail({
        from: "aberashtolesab@gmail.com",
        to: email,
        subject: "OTP",
        text: `Your OTP is ${otp}`,
      });
    }
  });
};

exports.login = async (req, res) => {
  const connection = await db.getConnection();
  const { email, password } = req.body;

  try {
    await connection.beginTransaction();
    const sql = "select * from users where email = ?";

    const [result] = await connection.query(sql, [email]);

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result[0];

    const Match = await bcrypt.compare(password, user.password);

    if (!Match) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    if (!user.is_verified) {
      return res.status(400).json({
        message: "User not verified, please verify your email",
      });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    await connection.commit();

    return res.status(200).json({
      message: "User logged in successfully",
      token,
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
