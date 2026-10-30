<?php
/**
 * SafarSathi - Reviews API Handler
 * Handles ratings and reviews for journeys
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleReviewsRoutes($method, $segments, $input) {
    $pdo = getDB();

    // POST /api/reviews
    if ($method === 'POST') {
        $pnr = trim($input['pnr'] ?? '');
        $rating = (int)($input['rating'] ?? 5);
        $comment = trim($input['comment'] ?? $input['feedback'] ?? '');

        if (empty($pnr)) {
            sendError('PNR is required to submit a review', 400);
        }

        if ($rating < 1 || $rating > 5) {
            sendError('Rating must be between 1 and 5 stars', 400);
        }

        // Check if booking exists
        $bStmt = $pdo->prepare("SELECT id, user_id, bus_id FROM bookings WHERE pnr = ?");
        $bStmt->execute([$pnr]);
        $booking = $bStmt->fetch();

        $userId = $booking ? $booking['user_id'] : null;
        $busId = $booking ? $booking['bus_id'] : null;

        $stmt = $pdo->prepare("
            INSERT INTO reviews (pnr, user_id, bus_id, rating, comment)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$pnr, $userId, $busId, $rating, $comment]);

        sendResponse([
            'success' => true,
            'message' => 'Thank you for your rating and feedback!'
        ], 201);
    }

    // GET /api/reviews
    if ($method === 'GET') {
        $busId = (int)($_GET['busId'] ?? 0);
        if ($busId > 0) {
            $stmt = $pdo->prepare("SELECT * FROM reviews WHERE bus_id = ? ORDER BY created_at DESC LIMIT 20");
            $stmt->execute([$busId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20");
        }
        sendResponse(['success' => true, 'reviews' => $stmt->fetchAll()]);
    }

    sendError('Reviews endpoint not found', 404);
}

