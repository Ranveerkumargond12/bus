<?php
/**
 * SafarSathi - Seats & Availability API Handler
 * Handles real-time booked seats retrieval and temporary seat holding
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleSeatsRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';

    // Clean up expired seat holds
    try {
        $pdo->exec("DELETE FROM seat_holds WHERE expires_at < CURRENT_TIMESTAMP");
    } catch (Exception $e) {}

    // GET /api/booked-seats or GET /api/seats
    if ($method === 'GET') {
        $busId = (int)($_GET['busId'] ?? $_GET['bus_id'] ?? 0);
        $date = trim($_GET['date'] ?? $_GET['travelDate'] ?? '');

        if ($busId <= 0 || empty($date)) {
            sendError('busId and date parameters are required', 400);
        }

        // 1. Fetch confirmed/active bookings
        $stmt = $pdo->prepare("
            SELECT seat_no 
            FROM bookings 
            WHERE bus_id = ? AND DATE(travel_date) = DATE(?) AND status != 'Cancelled'
        ");
        $stmt->execute([$busId, $date]);
        $rows = $stmt->fetchAll();

        $occupiedSeats = [];
        foreach ($rows as $r) {
            if (!empty($r['seat_no'])) {
                $seats = explode(',', (string)$r['seat_no']);
                foreach ($seats as $s) {
                    $sClean = strtoupper(trim($s));
                    if ($sClean !== '') {
                        $occupiedSeats[] = $sClean;
                    }
                }
            }
        }

        // 2. Fetch active temporary holds (excluding current user's token if supplied)
        $excludeToken = trim($_GET['hold_token'] ?? '');
        $holdSql = "SELECT seat_no FROM seat_holds WHERE bus_id = ? AND DATE(travel_date) = DATE(?) AND expires_at > CURRENT_TIMESTAMP";
        $holdParams = [$busId, $date];
        if (!empty($excludeToken)) {
            $holdSql .= " AND hold_token != ?";
            $holdParams[] = $excludeToken;
        }

        $holdStmt = $pdo->prepare($holdSql);
        $holdStmt->execute($holdParams);
        $holdRows = $holdStmt->fetchAll();
        foreach ($holdRows as $hr) {
            $sClean = trim($hr['seat_no']);
            if ($sClean !== '') {
                $occupiedSeats[] = $sClean;
            }
        }

        sendResponse(array_values(array_unique($occupiedSeats)));
    }

    // POST /api/seats/hold - Reserve seats temporarily for 10 minutes
    if ($method === 'POST' && ($seg1 === 'hold' || $seg1 === '')) {
        $busId = (int)($input['bus_id'] ?? $input['busId'] ?? 0);
        $travelDate = trim($input['travel_date'] ?? $input['travelDate'] ?? '');
        $seats = $input['seats'] ?? $input['seat_numbers'] ?? [];

        if (is_string($seats)) {
            $seats = array_filter(array_map('trim', explode(',', $seats)));
        }

        if ($busId <= 0 || empty($travelDate) || empty($seats)) {
            sendError('bus_id, travel_date, and seats array are required', 400);
        }

        // Check if any seat is already booked in bookings table
        $bookedStmt = $pdo->prepare("
            SELECT seat_no FROM bookings 
            WHERE bus_id = ? AND DATE(travel_date) = DATE(?) AND status != 'Cancelled'
        ");
        $bookedStmt->execute([$busId, $travelDate]);
        $existingBookings = $bookedStmt->fetchAll();
        $allBooked = [];
        foreach ($existingBookings as $eb) {
            foreach (explode(',', $eb['seat_no']) as $s) {
                if (trim($s) !== '') $allBooked[trim($s)] = true;
            }
        }

        foreach ($seats as $seat) {
            if (isset($allBooked[$seat])) {
                sendError("Seat $seat is already booked by another passenger. Please choose another seat.", 409);
            }
        }

        // Create hold token and set 10 minute expiry
        $holdToken = 'HOLD-' . bin2hex(random_bytes(16));
        $expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 minutes

        $insertHold = $pdo->prepare("
            INSERT INTO seat_holds (bus_id, travel_date, seat_no, hold_token, expires_at)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE hold_token = VALUES(hold_token), expires_at = VALUES(expires_at)
        ");

        foreach ($seats as $seat) {
            try {
                $insertHold->execute([$busId, $travelDate, $seat, $holdToken, $expiresAt]);
            } catch (Exception $e) {
                // If SQLite or duplicate error
            }
        }

        sendResponse([
            'success' => true,
            'message' => 'Seats held for 10 minutes',
            'hold_token' => $holdToken,
            'expires_at' => $expiresAt,
            'duration_seconds' => 600
        ]);
    }

    sendError('Seat endpoint not found', 404);
}

