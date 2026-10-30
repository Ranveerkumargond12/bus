<?php
/**
 * SafarSathi - Admin Management & Analytics API Handler
 * Handles dashboard KPI statistics, user management, and administrative actions
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleAdminRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';
    $seg2 = $segments[2] ?? '';

    // Enforce Admin Role
    requireRole('admin');

    // GET /api/admin/stats or GET /api/admin/dashboard
    if ($method === 'GET' && ($seg1 === 'stats' || $seg1 === 'dashboard' || empty($seg1))) {
        // Total Confirmed Revenue (excluding cancelled bookings)
        $revStmt = $pdo->query("
            SELECT COALESCE(SUM(total_fare), 0) as total_revenue, COUNT(*) as total_bookings 
            FROM bookings 
            WHERE status != 'Cancelled'
        ");
        $revData = $revStmt->fetch();
        $totalRevenue = (float)$revData['total_revenue'];
        $totalBookings = (int)$revData['total_bookings'];

        // Total Buses
        $busCount = (int)$pdo->query("SELECT COUNT(*) FROM buses WHERE status = 'Active'")->fetchColumn();

        // Total Users
        $userCount = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

        // Recent 10 Bookings
        $recentBookingsStmt = $pdo->query("
            SELECT b.*, bus.bus_name, bus.bus_number
            FROM bookings b
            LEFT JOIN buses bus ON b.bus_id = bus.id
            ORDER BY b.created_at DESC
            LIMIT 10
        ");
        $recentBookings = $recentBookingsStmt->fetchAll();

        sendResponse([
            'success' => true,
            'stats' => [
                'total_revenue' => $totalRevenue,
                'total_bookings' => $totalBookings,
                'total_buses' => $busCount,
                'total_users' => $userCount
            ],
            'recent_bookings' => $recentBookings
        ]);
    }

    // GET /api/admin/users
    if ($method === 'GET' && $seg1 === 'users') {
        $stmt = $pdo->query("SELECT id, name, email, phone, role, wallet_balance, created_at FROM users ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    }

    // DELETE /api/admin/delete-user/:id or DELETE /api/admin/users/:id
    if ($method === 'DELETE' && ($seg1 === 'delete-user' || $seg1 === 'users') && !empty($seg2)) {
        $userId = (int)$seg2;
        if ($userId === 1) {
            sendError('Primary super-administrator cannot be deleted!', 400);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);

        sendResponse([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    // POST /api/admin/add-bus
    if ($method === 'POST' && $seg1 === 'add-bus') {
        require_once __DIR__ . '/buses.php';
        handleBusesRoutes('POST', ['buses'], $input);
    }

    // POST or PUT /api/admin/update-bus/:id
    if (($method === 'POST' || $method === 'PUT') && ($seg1 === 'update-bus' || $seg1 === 'edit-bus')) {
        require_once __DIR__ . '/buses.php';
        handleBusesRoutes('POST', ['update-bus', $seg2], $input);
    }

    // DELETE /api/admin/delete-bus/:id
    if ($method === 'DELETE' && $seg1 === 'delete-bus' && !empty($seg2)) {
        require_once __DIR__ . '/buses.php';
        handleBusesRoutes('DELETE', ['buses', $seg2], $input);
    }

    sendError('Admin endpoint not found', 404);
}

