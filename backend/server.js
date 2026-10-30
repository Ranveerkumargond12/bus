const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Frontend folder ko static serve karne ke liye
app.use(express.static(path.join(__dirname, '../frontend')));

// MySQL Cloud Database Connection
const dbConfig = process.env.MYSQL_URL || process.env.DATABASE_URL ? {
  uri: process.env.MYSQL_URL || process.env.DATABASE_URL
} : {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'safarsathi_db',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error('❌ Database Connection Failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL Database');
    
    // AUTO CREATE TABLES & DEFAULT ADMIN
    db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (!err) {
        const adminEmail = 'admin@safarsathi.com';
        const adminPassword = 'amir2010khan';
        db.query('SELECT * FROM users WHERE email = ?', [adminEmail], (err, results) => {
          if (!err && results.length === 0) {
            db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', ['Admin', adminEmail, adminPassword, 'admin'], () => {});
          }
        });
      }
    });

    db.query(`
      CREATE TABLE IF NOT EXISTS buses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bus_name VARCHAR(255) NOT NULL,
          bus_number VARCHAR(100),
          source VARCHAR(100) NOT NULL,
          destination VARCHAR(100) NOT NULL,
          departure_time VARCHAR(50),
          arrival_time VARCHAR(50),
          fare DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {});

    db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pnr VARCHAR(100),
          user_id VARCHAR(50),
          bus_id VARCHAR(50),
          passenger_name VARCHAR(255),
          passenger_email VARCHAR(255),
          source VARCHAR(100),
          destination VARCHAR(100),
          seat_no VARCHAR(255),
          travel_date DATE,
          total_fare DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {});

    db.query(`
      CREATE TABLE IF NOT EXISTS agents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          agency_shop VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          city VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {});

    db.query(`
      CREATE TABLE IF NOT EXISTS operators (
          id INT AUTO_INCREMENT PRIMARY KEY,
          agency_name VARCHAR(255) NOT NULL,
          owner_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          fleet_size VARCHAR(50) DEFAULT '1',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {});
  }
});

// AUTHENTICATION APIS
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required!' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length > 0) return res.status(400).json({ success: false, message: 'This email is already registered!' });

    const role = (email === 'admin@safarsathi.com') ? 'admin' : 'user';
    db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, password, role], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Registration successful!', user: { id: result.insertId, name, email, role } });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length > 0) {
      const user = results[0];
      res.json({ success: true, message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password!' });
    }
  });
});

// BUSES & BOOKING APIS
app.get('/api/buses', (req, res) => {
  const { source, destination } = req.query;
  let sql = 'SELECT * FROM buses';
  let params = [];
  if (source && destination) {
    sql += ' WHERE source LIKE ? AND destination LIKE ?';
    params = [`%${source}%`, `%${destination}%`];
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

app.get('/api/booked-seats', (req, res) => {
  const { busId, date } = req.query;
  if (!busId || !date) return res.status(400).json({ success: false, message: 'busId and date are required' });

  db.query('SELECT seat_no FROM bookings WHERE bus_id = ? AND DATE(travel_date) = DATE(?)', [busId, date], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    let bookedSeats = [];
    results.forEach(row => {
      if (row.seat_no) bookedSeats.push(...String(row.seat_no).split(','));
    });
    res.json(bookedSeats);
  });
});

app.get('/api/my-bookings', (req, res) => {
  const { email } = req.query;
  let sql = 'SELECT * FROM bookings';
  let params = [];
  if (email) {
    sql += ' WHERE passenger_email = ?';
    params.push(email);
  }
  sql += ' ORDER BY created_at DESC';
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

app.post('/api/bookings', (req, res) => {
  const { pnr, user_id, bus_id, passenger_name, passenger_email, source, destination, seat_no, travel_date, total_fare } = req.body;
  const sql = `INSERT INTO bookings (pnr, user_id, bus_id, passenger_name, passenger_email, source, destination, seat_no, travel_date, total_fare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [pnr, user_id, bus_id, passenger_name, passenger_email, source, destination, seat_no, travel_date, total_fare], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Booking successful!', bookingId: result.insertId });
  });
});

// AGENTS & OPERATORS APIS
app.post('/api/agents', (req, res) => {
  const fullName = req.body.full_name || req.body.name;
  const agencyShop = req.body.agency_shop || req.body.shop;
  const phone = req.body.phone;
  const city = req.body.city;

  if (!fullName || !agencyShop || !phone || !city) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields!' });
  }

  db.query('INSERT INTO agents (full_name, agency_shop, phone, city) VALUES (?, ?, ?, ?)', [fullName, agencyShop, phone, city], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Agent Registered Successfully!' });
  });
});

app.get('/api/agents', (req, res) => {
  db.query('SELECT * FROM agents ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

app.delete('/api/agents/:id', (req, res) => {
  db.query('DELETE FROM agents WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Agent deleted successfully' });
  });
});

app.post('/api/operators', (req, res) => {
  const agencyName = req.body.agency_name;
  const ownerName = req.body.owner_name;
  const phone = req.body.phone;
  const fleetSize = req.body.fleet_size || '1';

  if (!agencyName || !ownerName || !phone) {
    return res.status(400).json({ success: false, message: 'Please fill all required details!' });
  }

  db.query('INSERT INTO operators (agency_name, owner_name, phone, fleet_size) VALUES (?, ?, ?, ?)', [agencyName, ownerName, phone, fleetSize], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Operator Registered Successfully!' });
  });
});

app.get('/api/operators', (req, res) => {
  db.query('SELECT * FROM operators ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

app.delete('/api/operators/:id', (req, res) => {
  db.query('DELETE FROM operators WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Operator deleted successfully' });
  });
});

// ADMIN MANAGEMENT APIS
app.post('/api/admin/add-bus', (req, res) => {
  const { bus_name, bus_number, source, destination, departure_time, arrival_time, fare } = req.body;
  db.query('INSERT INTO buses (bus_name, bus_number, source, destination, departure_time, arrival_time, fare) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [bus_name, bus_number, source, destination, departure_time, arrival_time, fare], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Bus Added Successfully' });
  });
});

app.delete('/api/admin/delete-bus/:id', (req, res) => {
  db.query('DELETE FROM buses WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Bus deleted successfully' });
  });
});

app.get('/api/admin/users', (req, res) => {
  db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

app.delete('/api/admin/delete-user/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'User deleted successfully' });
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});