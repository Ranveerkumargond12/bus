const mysql = require('mysql2');
require('dotenv').config(); // .env file ko load karne ke liye

// MySQL Pool Connection using Environment Variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '10760618608ffmax1',
  database: process.env.DB_NAME || 'safarsathi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();