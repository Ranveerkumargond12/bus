<?php
/**
 * Safar Sathi - Database & API Configuration for Hostinger
 * 
 * Hostinger hPanel -> Databases -> MySQL Databases me se credentials yahan enter karein.
 */

// Error reporting off for production (JSON output only)
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

// Database Credentials for Hostinger
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'u798858760_user');
define('DB_PASS', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : 'DeepAk@2031');
define('DB_NAME', getenv('DB_NAME') ?: 'u798858760_safarsathi123');

/**
 * Send JSON Response with CORS & Headers
 */
function sendJson($data, $statusCode = 200) {
    // Remove any previous output buffer
    if (ob_get_length()) ob_clean();
    
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Handle CORS Preflight OPTIONS Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJson(['status' => 'ok'], 200);
}

/**
 * Establish Database Connection using PDO
 */
function getDB() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // Auto create tables if not exists on first run
        autoInitDatabase($pdo);
        
        return $pdo;
    } catch (PDOException $e) {
        // If database doesn't exist, try connecting without dbname and create it
        if ($e->getCode() == 1049) {
            try {
                $dsnWithoutDB = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
                $tempPdo = new PDO($dsnWithoutDB, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                
                $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
                autoInitDatabase($pdo);
                return $pdo;
            } catch (Exception $ex) {
                sendJson(['success' => false, 'message' => 'Database Creation Failed: ' . $ex->getMessage()], 500);
            }
        }
        sendJson(['success' => false, 'message' => 'Database Connection Failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Auto-create tables & default admin user (Matches server.js behavior)
 */
function autoInitDatabase($pdo) {
    // 1. Users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 2. Default Admin
    $adminEmail = 'admin@safarsathi.com';
    $checkAdmin = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $checkAdmin->execute([$adminEmail]);
    if (!$checkAdmin->fetch()) {
        $insertAdmin = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
        $insertAdmin->execute(['Admin', $adminEmail, 'amir2010khan', 'admin']);
    }

    // 3. Buses table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS buses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bus_name VARCHAR(255) NOT NULL,
            bus_number VARCHAR(100),
            source VARCHAR(100) NOT NULL,
            destination VARCHAR(100) NOT NULL,
            departure_time VARCHAR(50),
            arrival_time VARCHAR(50),
            fare DECIMAL(10, 2) NOT NULL,
            seats_capacity INT DEFAULT 36,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Seed sample buses if table is empty
    $checkBuses = $pdo->query("SELECT COUNT(*) as count FROM buses");
    $busCount = $checkBuses->fetchColumn();
    if ($busCount == 0) {
        $sampleBuses = [
            ['IntrCity SmartBus', 'MH-01-AB-1234', 'Mumbai', 'Goa', '09:00 PM', '07:30 AM', 1200.00],
            ['Zingbus Express', 'MH-02-CD-5678', 'Mumbai', 'Goa', '10:15 PM', '08:45 AM', 950.00],
            ['VRL Travels Volvo AC', 'KA-01-EF-9012', 'Bangalore', 'Hyderabad', '08:30 PM', '06:00 AM', 1400.00],
            ['SRS Travels Sleeper', 'KA-04-GH-3456', 'Bangalore', 'Chennai', '10:00 PM', '05:30 AM', 800.00],
            ['Orange Travels Multi-Axle', 'TS-09-IJ-7890', 'Hyderabad', 'Mumbai', '07:00 PM', '08:00 AM', 1600.00],
            ['KSRTC Airavat Club Class', 'KL-15-KL-2345', 'Kochi', 'Bangalore', '08:00 PM', '06:30 AM', 1150.00],
            ['Hans Travels Premium', 'MP-09-MN-6789', 'Delhi', 'Jaipur', '06:00 AM', '11:30 AM', 650.00],
            ['Rishabh Travels Gold', 'RJ-14-OP-1122', 'Delhi', 'Udaipur', '09:30 PM', '08:00 AM', 1100.00]
        ];
        $insertBus = $pdo->prepare("INSERT INTO buses (bus_name, bus_number, source, destination, departure_time, arrival_time, fare) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($sampleBuses as $b) {
            $insertBus->execute($b);
        }
    }

    // 4. Bookings table
    $pdo->exec("
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
            status VARCHAR(50) DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 5. Agents table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS agents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            agency_shop VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            city VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 6. Operators table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS operators (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agency_name VARCHAR(255) NOT NULL,
            owner_name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            fleet_size VARCHAR(50) DEFAULT '1',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}
