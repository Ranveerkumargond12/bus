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

    // GET /api/buses/popular-routes (Dynamic: from real buses + intermediate stops added by admin)
    if ($method === 'GET' && ($seg1 === 'popular-routes' || ($segments[0] ?? '') === 'popular-routes')) {
        $stmt = $pdo->query("SELECT * FROM buses WHERE status = 'Active' ORDER BY id ASC");
        $allBuses = $stmt->fetchAll();

        $routesMap = [];
        $allStopNames = [];

        foreach ($allBuses as $b) {
            $src = trim($b['source'] ?? '');
            $dst = trim($b['destination'] ?? '');
            $fullFare = (float)($b['fare'] ?? 0);
            $dur = $b['duration'] ?: '10h 00m';

            if ($src !== '') $allStopNames[strtolower($src)] = $src;
            if ($dst !== '') $allStopNames[strtolower($dst)] = $dst;

            if ($src !== '' && $dst !== '') {
                $key = strtolower($src . '->' . $dst);
                if (!isset($routesMap[$key])) {
                    $routesMap[$key] = [
                        'from' => $src,
                        'to' => $dst,
                        'minPrice' => $fullFare,
                        'duration' => $dur,
                        'bus_count' => 1
                    ];
                } else {
                    $routesMap[$key]['minPrice'] = min($routesMap[$key]['minPrice'], $fullFare);
                    $routesMap[$key]['bus_count']++;
                }
            }

            $stops = json_decode($b['route_stops'] ?? '[]', true) ?: [];
            foreach ($stops as $st) {
                $stName = trim($st['stop_name'] ?? '');
                $stFare = (float)($st['fare'] ?? 0);
                if ($stName === '') continue;
                $allStopNames[strtolower($stName)] = $stName;

                if ($src !== '' && $stFare > 0) {
                    $sKey = strtolower($src . '->' . $stName);
                    if (!isset($routesMap[$sKey])) {
                        $routesMap[$sKey] = [
                            'from' => $src,
                            'to' => $stName,
                            'minPrice' => $stFare,
                            'duration' => $st['distance'] ?: 'Via Stop',
                            'bus_count' => 1
                        ];
                    } else {
                        $routesMap[$sKey]['minPrice'] = min($routesMap[$sKey]['minPrice'], $stFare);
                        $routesMap[$sKey]['bus_count']++;
                    }
                }
            }
        }

        $popular = array_values($routesMap);
        foreach ($popular as &$item) {
            $count = (int)$item['bus_count'];
            $item['frequency'] = $count . ($count > 1 ? '+ Buses Daily' : ' Bus Daily');
        }

        sendResponse([
            'success' => true,
            'data' => array_slice($popular, 0, 12),
            'all_stops' => array_values($allStopNames)
        ]);
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
            $bus['route_stops'] = json_decode($bus['route_stops'] ?? '[]', true) ?: [];
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
            $sql .= " AND (LOWER(source) LIKE ? OR LOWER(COALESCE(route_stops, '')) LIKE ? OR LOWER(COALESCE(boarding_points, '')) LIKE ?)";
            $params[] = '%' . strtolower($source) . '%';
            $params[] = '%' . strtolower($source) . '%';
            $params[] = '%' . strtolower($source) . '%';
        }
        if (!empty($destination)) {
            $sql .= " AND (LOWER(destination) LIKE ? OR LOWER(COALESCE(route_stops, '')) LIKE ? OR LOWER(COALESCE(dropping_points, '')) LIKE ?)";
            $params[] = '%' . strtolower($destination) . '%';
            $params[] = '%' . strtolower($destination) . '%';
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

        $filteredBuses = [];
        foreach ($buses as $bItem) {
            $bItem['route_stops'] = json_decode($bItem['route_stops'] ?? '[]', true) ?: [];

            // Build ordered stops chain: [Origin, ...route_stops, Destination]
            $chain = [
                [
                    'stop_name' => $bItem['source'],
                    'fare' => 0.0,
                    'distance' => '0 KM'
                ]
            ];
            foreach ($bItem['route_stops'] as $rs) {
                if (!empty($rs['stop_name'])) {
                    $chain[] = [
                        'stop_name' => $rs['stop_name'],
                        'fare' => (float)($rs['fare'] ?? 0),
                        'distance' => $rs['distance'] ?? ''
                    ];
                }
            }
            $chain[] = [
                'stop_name' => $bItem['destination'],
                'fare' => (float)$bItem['fare'],
                'distance' => $bItem['distance'] ?? ''
            ];

            $fromIdx = 0;
            $toIdx = count($chain) - 1;

            if (!empty($source)) {
                $foundFrom = -1;
                foreach ($chain as $idx => $cStop) {
                    if (stripos($cStop['stop_name'], $source) !== false) {
                        $foundFrom = $idx;
                        break;
                    }
                }
                if ($foundFrom !== -1) $fromIdx = $foundFrom;
            }

            if (!empty($destination)) {
                $foundTo = -1;
                foreach ($chain as $idx => $cStop) {
                    if ($idx > $fromIdx && stripos($cStop['stop_name'], $destination) !== false) {
                        $foundTo = $idx;
                        break;
                    }
                }
                if ($foundTo === -1) {
                    foreach ($chain as $idx => $cStop) {
                        if (stripos($cStop['stop_name'], $destination) !== false) {
                            $foundTo = $idx;
                            break;
                        }
                    }
                }
                if ($foundTo !== -1) $toIdx = $foundTo;
            }

            // If both source & destination were specified on a multi-stop route, ensure boarding comes before dropping
            if (!empty($source) && !empty($destination) && count($chain) > 2 && $fromIdx >= $toIdx) {
                continue;
            }

            $fromStopObj = $chain[$fromIdx];
            $toStopObj = $chain[$toIdx];
            $diffFare = (float)$toStopObj['fare'] - (float)$fromStopObj['fare'];

            $bItem['matched_from'] = $fromStopObj['stop_name'];
            $bItem['matched_to'] = $toStopObj['stop_name'];
            $bItem['matched_fare'] = $diffFare > 0 ? $diffFare : ((float)$toStopObj['fare'] > 0 ? (float)$toStopObj['fare'] : (float)$bItem['fare']);
            $bItem['matched_distance'] = !empty($toStopObj['distance']) ? $toStopObj['distance'] : ($bItem['distance'] ?? '');

            $filteredBuses[] = $bItem;
        }
        $buses = $filteredBuses;

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
        $conductorName = trim($input['conductor_name'] ?? '');
        $conductorPhone = trim($input['conductor_phone'] ?? '');
        $conductorPin = trim($input['conductor_pin'] ?? '1234');
        $distance = trim($input['distance'] ?? '');
        $routeStops = $input['route_stops'] ?? [];
        $routeStopsJson = is_array($routeStops) ? json_encode($routeStops, JSON_UNESCAPED_UNICODE) : (string)$routeStops;

        if (empty($busName) || empty($source) || empty($destination) || $fare <= 0) {
            sendError('Bus Name, Source, Destination, and valid Fare (> 0) are required!', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO buses (bus_name, bus_number, bus_type, source, destination, departure_time, arrival_time, duration, fare, seats_capacity, amenities, boarding_points, dropping_points, conductor_name, conductor_phone, conductor_pin, distance, route_stops)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$busName, $busNumber, $busType, $source, $destination, $depTime, $arrTime, $duration, $fare, $capacity, $amenities, $boarding, $dropping, $conductorName, $conductorPhone, $conductorPin, $distance, $routeStopsJson]);

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
        $conductorName = trim($input['conductor_name'] ?? '');
        $conductorPhone = trim($input['conductor_phone'] ?? '');
        $conductorPin = trim($input['conductor_pin'] ?? '1234');
        $distance = trim($input['distance'] ?? '');
        $routeStops = $input['route_stops'] ?? [];
        $routeStopsJson = is_array($routeStops) ? json_encode($routeStops, JSON_UNESCAPED_UNICODE) : (string)$routeStops;
        $status = trim($input['status'] ?? 'Active');

        if (empty($busName) || empty($source) || empty($destination) || $fare <= 0) {
            sendError('Bus Name, Source, Destination, and valid Fare (> 0) are required!', 400);
        }

        $stmt = $pdo->prepare("
            UPDATE buses 
            SET bus_name = ?, bus_number = ?, bus_type = ?, source = ?, destination = ?, 
                departure_time = ?, arrival_time = ?, duration = ?, fare = ?, 
                seats_capacity = ?, amenities = ?, boarding_points = ?, dropping_points = ?,
                conductor_name = ?, conductor_phone = ?, conductor_pin = ?, distance = ?, route_stops = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([$busName, $busNumber, $busType, $source, $destination, $depTime, $arrTime, $duration, $fare, $capacity, $amenities, $boarding, $dropping, $conductorName, $conductorPhone, $conductorPin, $distance, $routeStopsJson, $status, $busId]);

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

