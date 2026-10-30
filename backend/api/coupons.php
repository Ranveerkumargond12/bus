<?php
/**
 * SafarSathi - Coupons & Offers API Handler
 * Handles promo coupon listing and validation
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

function handleCouponsRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';

    // GET /api/coupons
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM coupons WHERE active = 1 ORDER BY id ASC");
        sendResponse(['success' => true, 'coupons' => $stmt->fetchAll()]);
    }

    // POST /api/coupons/apply or POST /api/coupons/validate
    if ($method === 'POST') {
        $code = trim(strtoupper($input['code'] ?? ''));
        $totalFare = (float)($input['total_fare'] ?? $input['fare'] ?? 0);

        if (empty($code)) {
            sendError('Please enter a coupon code', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND active = 1");
        $stmt->execute([$code]);
        $coupon = $stmt->fetch();

        if (!$coupon) {
            sendError('Invalid or expired coupon code', 404);
        }

        $minSpend = (float)$coupon['min_spend'];
        if ($totalFare < $minSpend) {
            sendError("This coupon requires a minimum booking fare of ₹$minSpend", 400);
        }

        $discount = 0.00;
        if ($coupon['discount_type'] === 'percent') {
            $discount = round(($totalFare * (float)$coupon['discount_amount']) / 100, 2);
        } else {
            $discount = (float)$coupon['discount_amount'];
        }

        $discount = min($discount, $totalFare);
        $finalFare = max(0, $totalFare - $discount);

        sendResponse([
            'success' => true,
            'message' => "Coupon '$code' applied successfully!",
            'code' => $code,
            'discount' => $discount,
            'originalFare' => $totalFare,
            'finalFare' => $finalFare
        ]);
    }

    sendError('Coupons endpoint not found', 404);
}

