const mysql = require('mysql2');
const dotenv = require('dotenv')

dotenv.config({ path: "./.env" })


const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT,
    ssl:{
      rejectUnauthorized: false
    }
})



pool.getConnection((error) => {
  if (error) {
    console.log("Database connection failed:", error);
  } else {
    console.log("Connected to the database.");
  }
})

module.exports = pool
