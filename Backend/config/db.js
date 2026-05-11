// db.js
const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,

  ssl: {
    rejectUnauthorized: false,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("❌ MySQL Pool Error:", err);
});

// Use promise version (BEST PRACTICE)
const promisePool = pool.promise();

module.exports = promisePool;