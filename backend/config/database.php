<?php
/**
 * SafarSathi Bus Ticket Booking - Database Configuration
 * Supports MySQL (Production / Hostinger / XAMPP) with PDO prepared statements,
 * error handling, and optional SQLite fallback for local automated testing.
 */

// Error handling settings (safe for JSON REST APIs)
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// Load environment variables from .env file if present
$envFile = dirname(__DIR__) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            // Remove optional quotes
            if (preg_match('/^"(.*)"$/', $val, $m) || preg_match("/^'(.*)'$/", $val, $m)) {
                $val = $m[1];
            }
            if (!getenv($key)) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }
}

// Database Credentials
define('DB_DRIVER', getenv('DB_DRIVER') ?: 'mysql');
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'safarsathi_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'safarsathi_super_secret_jwt_key_2026_xyz');

/**
 * Returns a configured PDO instance
 * @return PDO
 */
function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $driver = strtolower(DB_DRIVER);

    if ($driver === 'sqlite') {
        $sqlitePath = dirname(__DIR__) . '/database.sqlite';
        $needsInit = !file_exists($sqlitePath);
        $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        if ($needsInit) {
            initSqliteDatabase($pdo);
        }
        return $pdo;
    }

    // Default: MySQL PDO Connection
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        autoInitDatabase($pdo);
        return $pdo;
    } catch (PDOException $e) {
        // If database doesn't exist, try creating it
        if ($e->getCode() == 1049) {
            try {
                $dsnWithoutDB = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
                $tempPdo = new PDO($dsnWithoutDB, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                autoInitDatabase($pdo);
                return $pdo;
            } catch (Exception $ex) {
                // If MySQL completely fails locally, fallback to SQLite if in development
                if (getenv('APP_ENV') === 'development' || !getenv('APP_ENV')) {
                    return fallbackToSqlite();
                }
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $ex->getMessage()
                ]);
                exit;
            }
        }

        // Connection refused or server down
        if (getenv('APP_ENV') === 'development' || !getenv('APP_ENV')) {
            return fallbackToSqlite();
        }

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }
}

/**
 * Fallback to SQLite if MySQL is not running on local machine
 */
function fallbackToSqlite() {
    static $sqlitePdo = null;
    if ($sqlitePdo !== null) return $sqlitePdo;

    $sqlitePath = dirname(__DIR__) . '/database.sqlite';
    $isNew = !file_exists($sqlitePath);
    $sqlitePdo = new PDO("sqlite:" . $sqlitePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    if ($isNew) {
        initSqliteDatabase($sqlitePdo);
    }
    return $sqlitePdo;
}

/**
 * Auto-creates MySQL tables and seeds sample data if needed
 */
function autoInitDatabase($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($check->rowCount() === 0) {
            $schemaFile = dirname(__DIR__) . '/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        // Table check failed silently
    }
}

/**
 * Auto-creates SQLite schema if falling back
 */
function initSqliteDatabase($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            wallet_balance REAL DEFAULT 150.00,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS buses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_name TEXT NOT NULL,
            bus_number TEXT,
            bus_type TEXT DEFAULT 'AC Sleeper (2+1)',
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            duration TEXT DEFAULT '10h 00m',
            fare REAL NOT NULL,
            rating REAL DEFAULT 4.5,
            seats_capacity INTEGER DEFAULT 24,
            amenities TEXT,
            boarding_points TEXT,
            dropping_points TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pnr TEXT UNIQUE NOT NULL,
            user_id INTEGER,
            bus_id INTEGER NOT NULL,
            passenger_name TEXT NOT NULL,
            passenger_email TEXT NOT NULL,
            passenger_phone TEXT,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            seat_no TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            base_fare REAL DEFAULT 0.00,
            tax_fare REAL DEFAULT 0.00,
            addons_fare REAL DEFAULT 0.00,
            discount_amount REAL DEFAULT 0.00,
            total_fare REAL NOT NULL,
            addons TEXT,
            passengers_detail TEXT,
            status TEXT DEFAULT 'Confirmed',
            payment_status TEXT DEFAULT 'Paid',
            payment_method TEXT DEFAULT 'Online',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS seat_holds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bus_id INTEGER NOT NULL,
            travel_date TEXT NOT NULL,
            seat_no TEXT NOT NULL,
            hold_token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bus_id, travel_date, seat_no)
        );

        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            reference TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            discount_amount REAL NOT NULL,
            discount_type TEXT DEFAULT 'flat',
            min_spend REAL DEFAULT 0.00,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pnr TEXT NOT NULL,
            user_id INTEGER,
            bus_id INTEGER,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS operators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agency_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            fleet_size TEXT DEFAULT '1',
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            agency_shop TEXT NOT NULL,
            phone TEXT NOT NULL,
            city TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Seed default admin (No hardcoded buses; all fleet buses are added dynamically by admin)
    $adminHash = password_hash('amir2010khan', PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT OR IGNORE INTO users (id, name, email, phone, password, role, wallet_balance) VALUES (1, 'Admin', 'admin@safarsathi.com', '9876543210', ?, 'admin', 5000.00)");
    $stmt->execute([$adminHash]);

    // Seed coupons
    $sampleCoupons = [
        [1, 'FIRST50', 'FLAT ₹200 OFF', 'Valid on first bus booking for new users', 200.00, 'flat', 500.00, 1],
        [2, 'TRAVELGO', 'NEW USER SPECIAL', 'Get ₹150 instant discount on any booking', 150.00, 'flat', 400.00, 1],
        [3, 'FIRST20', 'FLAT 20% OFF', 'Get 20% discount on your first booking with TravelGo', 20.00, 'percent', 600.00, 1],
        [4, 'FESTIVE300', 'SAVE UP TO ₹300', 'Applicable on bookings above ₹1200 across all routes', 300.00, 'flat', 1200.00, 1],
        [5, 'WEEKEND15', '15% CASHBACK', 'Book Saturday or Sunday travels and enjoy instant discount', 15.00, 'percent', 700.00, 1],
        [6, 'GROUP500', 'FLAT ₹500 OFF', 'Valid when booking 4 or more seats in a single booking', 500.00, 'flat', 2000.00, 1]
    ];
    $couponStmt = $pdo->prepare("INSERT OR IGNORE INTO coupons (id, code, title, description, discount_amount, discount_type, min_spend, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($sampleCoupons as $c) {
        $couponStmt->execute($c);
    }
}

