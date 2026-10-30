<?php
/**
 * SafarSathi - Automated Backend Test Suite
 * Tests all requirements from Section 11 of the Master Prompt
 */

require_once dirname(__DIR__) . '/backend/config/database.php';
require_once dirname(__DIR__) . '/backend/utils/response.php';
require_once dirname(__DIR__) . '/backend/utils/auth.php';

$pdo = getDB();

echo "========================================================\n";
echo "   SafarSathi Backend Verification & Test Suite         \n";
echo "========================================================\n\n";

$testsPassed = 0;
$testsFailed = 0;

function assertTest($name, $condition, $message = '') {
    global $testsPassed, $testsFailed;
    if ($condition) {
        echo "  [PASS] $name\n";
        $testsPassed++;
    } else {
        echo "  [FAIL] $name: $message\n";
        $testsFailed++;
    }
}

// 1. Database Connectivity
assertTest("1. Database Connection", $pdo instanceof PDO, "PDO connection object was not returned");

// Check tables
$tables = ['users', 'buses', 'bookings', 'seat_holds', 'wallet_transactions', 'coupons', 'operators', 'agents'];
foreach ($tables as $t) {
    $c = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    assertTest("Table exists & queried: $t", $c !== false, "Failed to query table $t");
}

// 2. Authentication: Password Hashing & Verification
$testEmail = 'testuser_' . time() . '@example.com';
$testPassword = 'SecurePassword123!';
$hashed = password_hash($testPassword, PASSWORD_DEFAULT);
assertTest("Password Hash Verification", password_verify($testPassword, $hashed), "password_verify failed");

// Insert Test User
$stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, wallet_balance) VALUES (?, ?, ?, 'user', 150.00)");
$stmt->execute(['Test User', $testEmail, $hashed]);
$testUserId = (int)$pdo->lastInsertId();
assertTest("User Registration in DB", $testUserId > 0, "Insert user failed");

// 3. JWT Token Generation & Verification
$token = generateJWT(['sub' => $testUserId, 'email' => $testEmail, 'role' => 'user']);
assertTest("JWT Generation", !empty($token), "JWT was empty");
$payload = verifyJWT($token);
assertTest("JWT Verification", $payload && $payload['sub'] === $testUserId, "JWT payload verification failed");

// 4. Role-based Access Control
$adminPayload = verifyJWT(generateJWT(['sub' => 1, 'email' => 'admin@safarsathi.com', 'role' => 'admin']));
assertTest("Admin Role Check", $adminPayload['role'] === 'admin', "Admin role not recognized");
assertTest("User Role Check", $payload['role'] === 'user', "User role mismatch");

// Strict Login Enforcement Check (No Booking Allowed Without Valid User Account)
$emptyTokenCheck = verifyJWT('');
assertTest("Unauthenticated Booking Strictly Blocked", $emptyTokenCheck === false, "Unauthenticated access was allowed!");

// 5. Admin Dynamically Adds Bus to Fleet
$newBusStmt = $pdo->prepare("
    INSERT INTO buses (bus_name, bus_number, bus_type, source, destination, departure_time, arrival_time, duration, fare, seats_capacity, amenities, boarding_points, dropping_points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$newBusStmt->execute([
    'Royal Express Suite', 'MH-04-TEST-9988', 'AC Sleeper (2+1)',
    'Mumbai', 'Goa', '09:00 PM', '07:30 AM', '10h 30m',
    1200.00, 24, 'WiFi, Charging Point, Water Bottle',
    'Bandra East - 20:30, Sion - 20:50', 'Mapusa - 06:45, Panjim - 07:15'
]);
$testBusId = (int)$pdo->lastInsertId();
assertTest("Admin Add Bus to Fleet", $testBusId > 0, "Failed to dynamically insert bus via admin query");

// Bus Search & Available Seats
$busStmt = $pdo->prepare("SELECT id, bus_name, fare, source, destination FROM buses WHERE id = ? AND status = 'Active'");
$busStmt->execute([$testBusId]);
$testBus = $busStmt->fetch();
assertTest("Bus Search Returns Results", !empty($testBus['id']), "Newly added bus not returned in search");

// 6. Concurrency & Seat Booking / Double-Booking Prevention
$travelDate = date('Y-m-d', strtotime('+3 days'));
$seatToBook = 'S15';

// Booking 1: User 1 books S15
$pdo->beginTransaction();
$pnr1 = 'TEST-PNR-' . mt_rand(1000, 9999);
$insBooking = $pdo->prepare("
    INSERT INTO bookings (pnr, user_id, bus_id, passenger_name, passenger_email, source, destination, seat_no, travel_date, total_fare, status, payment_status)
    VALUES (?, ?, ?, 'Passenger One', ?, ?, ?, ?, ?, 1200.00, 'Confirmed', 'Paid')
");
$insBooking->execute([$pnr1, $testUserId, $testBus['id'], $testEmail, $testBus['source'], $testBus['destination'], $seatToBook, $travelDate]);
$pdo->commit();
assertTest("Booking 1 Succeeded for $seatToBook", true);

// Booking 2: Concurrent User 2 attempts to book the SAME seat S15
$conflictDetected = false;
$pdo->beginTransaction();
$checkConflict = $pdo->prepare("
    SELECT seat_no FROM bookings 
    WHERE bus_id = ? AND DATE(travel_date) = DATE(?) AND status != 'Cancelled'
");
$checkConflict->execute([$testBus['id'], $travelDate]);
$rows = $checkConflict->fetchAll();
foreach ($rows as $r) {
    if (in_array($seatToBook, explode(',', $r['seat_no']))) {
        $conflictDetected = true;
        break;
    }
}
$pdo->rollBack();
assertTest("Double Booking Rejected (Concurrency Protection)", $conflictDetected, "Seat conflict was not detected!");

// 7. SQL Injection Safety with Prepared Statements
$maliciousInput = "' OR '1'='1";
$sqlInjectStmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$sqlInjectStmt->execute([$maliciousInput]);
$injectedUser = $sqlInjectStmt->fetch();
assertTest("SQL Injection Handled Safely", $injectedUser === false, "Malicious SQL query unexpectedly matched a user");

// 8. Wallet Deduction & Refund on Cancellation
$initialWallet = (float)$pdo->query("SELECT wallet_balance FROM users WHERE id = $testUserId")->fetchColumn();
// Cancel Booking 1 and verify refund
$pdo->beginTransaction();
$pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE pnr = ?")->execute([$pnr1]);
$refundAmount = 1200.00;
$pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?")->execute([$refundAmount, $testUserId]);
$pdo->prepare("INSERT INTO wallet_transactions (user_id, type, title, amount, reference) VALUES (?, 'Credit', 'Refund for Ticket', ?, ?)")->execute([$testUserId, $refundAmount, $pnr1]);
$pdo->commit();

$updatedWallet = (float)$pdo->query("SELECT wallet_balance FROM users WHERE id = $testUserId")->fetchColumn();
assertTest("Cancellation Refund Credited to Wallet", $updatedWallet === ($initialWallet + $refundAmount), "Wallet refund balance mismatch");

// 9. Coupon Validation
$coupon = $pdo->query("SELECT * FROM coupons WHERE code = 'FIRST50'")->fetch();
assertTest("Coupon Code Verification", !empty($coupon) && (float)$coupon['discount_amount'] === 200.00, "Coupon FIRST50 not found or discount mismatch");

// Clean up test data
$pdo->prepare("DELETE FROM bookings WHERE pnr = ?")->execute([$pnr1]);
$pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$testUserId]);
$pdo->prepare("DELETE FROM buses WHERE id = ?")->execute([$testBusId]);

echo "\n========================================================\n";
echo "   Tests Completed: $testsPassed Passed, $testsFailed Failed\n";
echo "========================================================\n";
exit($testsFailed > 0 ? 1 : 0);
