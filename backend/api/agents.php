<?php
/**
 * SafarSathi - Agents API Handler
 * Handles travel agent registration, listing, and deletion
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleAgentsRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';

    // POST /api/agents (Agent registration)
    if ($method === 'POST') {
        $fullName = trim($input['full_name'] ?? $input['name'] ?? '');
        $agencyShop = trim($input['agency_shop'] ?? $input['shop'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $city = trim($input['city'] ?? '');

        if (empty($fullName) || empty($agencyShop) || empty($phone) || empty($city)) {
            sendError('Full Name, Agency/Shop Name, Phone, and City are all required!', 400);
        }

        $stmt = $pdo->prepare("
            INSERT INTO agents (full_name, agency_shop, phone, city)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$fullName, $agencyShop, $phone, $city]);

        sendResponse([
            'success' => true,
            'message' => 'Agent registration submitted successfully! We will reach out within 24 hours.',
            'agent_id' => (int)$pdo->lastInsertId()
        ], 201);
    }

    // GET /api/agents (Admin list)
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM agents ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    }

    // DELETE /api/agents/:id (Admin only)
    if ($method === 'DELETE' && !empty($seg1)) {
        requireRole('admin');
        $id = (int)$seg1;
        $stmt = $pdo->prepare("DELETE FROM agents WHERE id = ?");
        $stmt->execute([$id]);

        sendResponse([
            'success' => true,
            'message' => 'Agent deleted successfully'
        ]);
    }

    sendError('Agent endpoint not found', 404);
}

