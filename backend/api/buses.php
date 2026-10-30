<?php
/**
 * SafarSathi - Buses & Routes API Handler
 * Handles searching, listing, filtering, and admin bus management
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleBusesRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';
    $seg2 = $segments[2] ?? '';

    // GET /api/buses/popular-routes (Dynamic: from real buses added by admin)
    if ($method === 'GET' && ($seg1 === 'popular-routes' || ($segments[0] ?? '') === 'popular-routes')) {
        $stmt = $pdo->query("
            SELECT source as `from`, destination as `to`, 
                   MIN(fare) as minPrice, 
                   MIN(duration) as duration, 
                   COUNT(*) as bus_count
            FROM buses 
            WHERE status = 'Active'
            GROUP BY source, destination
            ORDER BY bus_count DESC, minPrice ASC
            LIMIT 6
        ");
        $popular = $stmt->fetchAll();
        foreach ($popular as &$item) {
            $count = (int)$item['bus_count'];
            $item['frequency'] = $count . ($count > 1 ? '+ Buses Daily' : ' Bus Daily');
        }
        sendResponse(['success' => true, 'data' => $popular]);
    }

    // GET /api/buses or GET /api/buses/:id
    if ($method === 'GET') {
        // If numeric ID in segment 1 (e.g. /api/buses/3)
        if (is_numeric($seg1)) {
            $busId = (int)$seg1;
            $stmt = $pdo->prepare("SELECT * FROM buses WHERE id = ?");
            $stmt->execute([$busId]);
            $bus = $stmt->fetch();
            if (!$bus) {
                sendError('Bus not found', 404);
            }
            sendResponse(['success' => true, 'bus' => $bus]);
        }

        // List & Search Buses
        $source = trim($_GET['source'] ?? $_GET['from'] ?? '');
        $destination = trim($_GET['destination'] ?? $_GET['to'] ?? '');
        $travelDate = trim($_GET['date'] ?? $_GET['travelDate'] ?? '');
        $busType = trim($_GET['busType'] ?? $_GET['type'] ?? '');
        $maxPrice = isset($_GET['maxPrice']) ? (float)$_GET['maxPrice'] : 0;

        $sql = "SELECT * FROM buses WHERE status = 'Active'";
        $params = [];

        if (!empty($source)) {
            $sql .= " AND LOWER(source) LIKE ?";
            $params[] = '%' . strtolower($source) . '%';
        }
        if (!empty($destination)) {
            $sql .= " AND LOWER(destination) LIKE ?";
            $params[] = '%' . strtolower($destination) . '%';
        }
        if (!empty($busType) && strtolower($busType) !== 'all' && strtolower($busType) !== 'all types') {
            $sql .= " AND LOWER(bus_type) LIKE ?";
            $params[] = '%' . strtolower($busType) . '%';
        }
        if ($maxPrice > 0) {
            $sql .= " AND fare <= ?";
            $params[] = $maxPrice;
        }

        $sql .= " ORDER BY fare ASC, id ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $buses = $stmt->fetchAll();

        // Calculate available seats per bus for the requested date
        if (!empty($travelDate)) {
            $bookedStmt = $pdo->prepare("
                SELECT bus_id, seat_no 
                FROM bookings 
                WHERE DATE(travel_date) = DATE(?) AND status != 'Cancelled'
            ");
            $bookedStmt->execute([$travelDate]);
            $bookedRows = $bookedStmt->fetchAll();

            $bookedCountByBus = [];
            foreach ($bookedRows as $row) {
                $bId = $row['bus_id'];
                $seats = explode(',', (string)$row['seat_no']);
                $cnt = 0;
                foreach ($seats as $s) {
                    if (trim($s) !== '') $cnt++;
                }
                $bookedCountByBus[$bId] = ($bookedCountByBus[$bId] ?? 0) + $cnt;
            }

            foreach ($buses as &$bus) {
                $capacity = (int)($bus['seats_capacity'] ?: 24);
                $occupied = $bookedCountByBus[$bus['id']] ?? 0;
                $bus['available_seats'] = max(0, $capacity - $occupied);
            }
        } else {
            foreach ($buses as &$bus) {
                $bus['available_seats'] = (int)($bus['seats_capacity'] ?: 24);
            }
        }

        sendResponse($buses);
    }

    // POST /api/buses or POST /api/admin/add-bus (Admin only)
    if ($method === 'POST') {
        requireRole('admin');

        $busName = trim($input['bus_name'] ?? '');
        $busNumber = trim($input['bus_number'] ?? '');
        $busType = trim($input['bus_type'] ?? 'AC Sleeper (2+1)');
        $source = trim($input['source'] ?? '');
        $destination = trim($input['destination'] ?? '');
        $depTime = trim($input['departure_time'] ?? '');
        $arrTime = trim($input['arrival_time'] ?? '');
        $duration = trim($input['duration'] ?? '10h 00m');
        $fare = (float)($input['fare'] ?? 0);
        $capacity = (int)($input['seats_capacity'] ?? 24);
        $amenities = trim($input['amenities'] ?? 'WiFi, Charging Point, Blanket, Water Bottle');
        $boarding = trim($input['boarding_points'] ?? 'Main Bus Stand');
        $dropping = trim($input['dropping_points'] ?? 'City Center');

        if (empty($busName) || empty($source) || empty($destination) || $fare <= 0) {
            sendError('Bus Name, Source, Destination, and valid Fare (> 0) are required!', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO buses (bus_name, bus_number, bus_type, source, destination, departure_time, arrival_time, duration, fare, seats_capacity, amenities, boarding_points, dropping_points)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$busName, $busNumber, $busType, $source, $destination, $depTime, $arrTime, $duration, $fare, $capacity, $amenities, $boarding, $dropping]);

        sendResponse([
            'success' => true,
            'message' => 'Bus added successfully to fleet!',
            'bus_id' => (int)$pdo->lastInsertId()
        ], 201);
    }

    // PUT /api/buses/:id or POST /api/admin/update-bus/:id (Admin only)
    if ($method === 'PUT' || ($method === 'POST' && ($seg1 === 'update-bus' || $seg1 === 'edit-bus' || ($segments[0] ?? '') === 'update-bus'))) {
        requireRole('admin');

        $busId = is_numeric($seg1) ? (int)$seg1 : (is_numeric($seg2) ? (int)$seg2 : (int)($input['id'] ?? 0));
        if ($busId <= 0) {
            sendError('Valid Bus ID is required for update', 400);
        }

        $busName = trim($input['bus_name'] ?? '');
        $busNumber = trim($input['bus_number'] ?? '');
        $busType = trim($input['bus_type'] ?? 'AC Sleeper (2+1)');
        $source = trim($input['source'] ?? '');
        $destination = trim($input['destination'] ?? '');
        $depTime = trim($input['departure_time'] ?? '');
        $arrTime = trim($input['arrival_time'] ?? '');
        $duration = trim($input['duration'] ?? '10h 00m');
        $fare = (float)($input['fare'] ?? 0);
        $capacity = (int)($input['seats_capacity'] ?? 24);
        $amenities = trim($input['amenities'] ?? 'WiFi, Charging Point, Blanket, Water Bottle');
        $boarding = trim($input['boarding_points'] ?? 'Main Bus Stand');
        $dropping = trim($input['dropping_points'] ?? 'City Center');
        $status = trim($input['status'] ?? 'Active');

        if (empty($busName) || empty($source) || empty($destination) || $fare <= 0) {
            sendError('Bus Name, Source, Destination, and valid Fare (> 0) are required!', 400);
        }

        $stmt = $pdo->prepare("
            UPDATE buses 
            SET bus_name = ?, bus_number = ?, bus_type = ?, source = ?, destination = ?, 
                departure_time = ?, arrival_time = ?, duration = ?, fare = ?, 
                seats_capacity = ?, amenities = ?, boarding_points = ?, dropping_points = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([$busName, $busNumber, $busType, $source, $destination, $depTime, $arrTime, $duration, $fare, $capacity, $amenities, $boarding, $dropping, $status, $busId]);

        sendResponse([
            'success' => true,
            'message' => 'Bus updated successfully in fleet!'
        ]);
    }

    // DELETE /api/buses/:id or DELETE /api/admin/delete-bus/:id (Admin only)
    if ($method === 'DELETE') {
        requireRole('admin');

        $busId = is_numeric($seg1) ? (int)$seg1 : (is_numeric($seg2) ? (int)$seg2 : 0);
        if ($busId <= 0) {
            sendError('Valid Bus ID is required for deletion', 400);
        }

        $stmt = $pdo->prepare("DELETE FROM buses WHERE id = ?");
        $stmt->execute([$busId]);

        sendResponse([
            'success' => true,
            'message' => 'Bus deleted successfully'
        ]);
    }

    sendError('Bus endpoint not found', 404);
}

