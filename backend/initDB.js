const mysql = require('mysql2');

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '10760618608ffmax1' // Aapka MySQL password
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    console.log('👉 Make sure MySQL/XAMPP Server start ho!');
    return;
  }
  console.log('✅ Connected to MySQL Server!');

  // Queries ko Sequential execute karenge
  db.query(`CREATE DATABASE IF NOT EXISTS safarsathi_db;`, (err) => {
    if (err) return console.error('❌ Database Creation Error:', err.message);

    db.changeUser({ database: 'safarsathi_db' }, (err) => {
      if (err) return console.error('❌ Database Switch Error:', err.message);
      console.log('✅ Using Database: safarsathi_db');

      const queries = [
        // 1. Users Table
        `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        // 2. Buses Table
        `CREATE TABLE IF NOT EXISTS buses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bus_name VARCHAR(100) NOT NULL,
          bus_number VARCHAR(50) NOT NULL,
          source VARCHAR(50) NOT NULL,
          destination VARCHAR(50) NOT NULL,
          departure_time VARCHAR(20) NOT NULL,
          arrival_time VARCHAR(20) NOT NULL,
          fare DECIMAL(10, 2) NOT NULL,
          seats_capacity INT DEFAULT 36,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        // 3. Bookings Table
        `CREATE TABLE IF NOT EXISTS bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pnr VARCHAR(20) UNIQUE NOT NULL,
          user_id INT,
          bus_id INT,
          passenger_name VARCHAR(100) NOT NULL,
          passenger_email VARCHAR(100) NOT NULL,
          source VARCHAR(50) NOT NULL,
          destination VARCHAR(50) NOT NULL,
          seat_no VARCHAR(100) NOT NULL,
          travel_date DATE,
          total_fare DECIMAL(10, 2) NOT NULL,
          booking_date DATE DEFAULT (CURRENT_DATE),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
        );`,

        // 4. Operators Table
        `CREATE TABLE IF NOT EXISTS operators (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agency_name VARCHAR(255) NOT NULL,
          owner_name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          fleet_size VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        // 5. Agents Table
        `CREATE TABLE IF NOT EXISTS agents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          agency_shop VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          city VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`,

        // 6. Default Admin User Insert
        `INSERT INTO users (name, email, password, role) 
         VALUES ('Admin', 'admin@safarsathi.com', 'admin123', 'admin')
         ON DUPLICATE KEY UPDATE id=id;`
      ];

      // Sequential Execution Loop
      let index = 0;
      function executeNext() {
        if (index < queries.length) {
          db.query(queries[index], (err) => {
            if (err) console.error(`❌ Query ${index + 1} Error:`, err.message);
            index++;
            executeNext();
          });
        } else {
          console.log('🎉 Safar Sathi Database aur All Tables Successfully Ban Gaye Hain!');
          db.end();
        }
      }

      executeNext();
    });
  });
});