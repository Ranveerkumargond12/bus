<?php
/**
 * SafarSathi - Operators API Handler
 * Handles bus operator registration, listing, and deletion
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleOperatorsRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';

    // POST /api/operators (Registration open to public or operators)
    if ($method === 'POST') {
        $agencyName = trim($input['agency_name'] ?? '');
        $ownerName = trim($input['owner_name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $fleetSize = trim($input['fleet_size'] ?? '1');

        if (empty($agencyName) || empty($ownerName) || empty($phone)) {
            sendError('Agency Name, Owner Name, and Phone Number are required!', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO operators (agency_name, owner_name, phone, fleet_size)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$agencyName, $ownerName, $phone, $fleetSize]);

        sendResponse([
            'success' => true,
            'message' => 'Bus Operator registered successfully! Our fleet team will contact you shortly.',
            'operator_id' => (int)$pdo->lastInsertId()
        ], 201);
    }

    // GET /api/operators (Admin list)
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM operators ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    }

    // DELETE /api/operators/:id (Admin only)
    if ($method === 'DELETE' && !empty($seg1)) {
        requireRole('admin');
        $id = (int)$seg1;
        $stmt = $pdo->prepare("DELETE FROM operators WHERE id = ?");
        $stmt->execute([$id]);

        sendResponse([
            'success' => true,
            'message' => 'Operator deleted successfully'
        ]);
    }

    sendError('Operator endpoint not found', 404);
}

