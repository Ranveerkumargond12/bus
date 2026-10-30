const mysql = require('mysql2/promise');

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '10760618608ffmax1' // 👈 Aapka exact MySQL password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS safarsathi_db;`);
    await connection.query(`USE safarsathi_db;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Force update admin user
    await connection.query(`DELETE FROM users WHERE LOWER(email) = 'admin@safarsathi.com';`);

    await connection.query(`
      INSERT INTO users (name, email, password, role) 
      VALUES ('System Admin', 'admin@safarsathi.com', 'admin123', 'admin');
    `);

    console.log("==========================================");
    console.log("✅ DATABASE SETUP SUCCESSFUL WITH PASSWORD!");
    console.log("Admin Email    : admin@safarsathi.com");
    console.log("Admin Password : admin123");
    console.log("==========================================");

    await connection.end();
  } catch (err) {
    console.error("❌ Setup Failed:", err.message);
  }
}

setupDatabase();