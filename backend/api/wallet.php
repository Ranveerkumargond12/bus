<?php
/**
 * SafarSathi - Wallet API Handler
 * Handles wallet balance, fund addition, and transaction history
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleWalletRoutes($method, $segments, $input) {
    $pdo = getDB();
    $seg1 = $segments[1] ?? '';

    // GET /api/wallet
    if ($method === 'GET') {
        $currentUser = getCurrentUser();
        $email = trim($_GET['email'] ?? ($currentUser['email'] ?? ''));

        if ($currentUser) {
            $userId = $currentUser['id'];
        } elseif (!empty($email)) {
            $uStmt = $pdo->prepare("SELECT id, wallet_balance FROM users WHERE email = ?");
            $uStmt->execute([$email]);
            $uRow = $uStmt->fetch();
            $userId = $uRow ? (int)$uRow['id'] : null;
        } else {
            // Guest default response
            sendResponse([
                'success' => true,
                'wallet_balance' => 150.00,
                'transactions' => [
                    ['title' => 'Sign-up Bonus', 'type' => 'Credit', 'amount' => 150.00, 'date' => 'Initial']
                ]
            ]);
        }

        if (!$userId) {
            sendResponse([
                'success' => true,
                'wallet_balance' => 0.00,
                'transactions' => []
            ]);
        }

        // Get latest balance
        $bStmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
        $bStmt->execute([$userId]);
        $balance = (float)$bStmt->fetchColumn();

        // Get transaction history
        $txStmt = $pdo->prepare("
            SELECT id, type, title, amount, reference, created_at,
                   DATE_FORMAT(created_at, '%b %d, %Y') as formatted_date
            FROM wallet_transactions 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $txStmt->execute([$userId]);
        $transactions = $txStmt->fetchAll();

        sendResponse([
            'success' => true,
            'wallet_balance' => $balance,
            'transactions' => $transactions
        ]);
    }

    // POST /api/wallet/add-money
    if ($method === 'POST') {
        $currentUser = getCurrentUser();
        $amount = (float)($input['amount'] ?? 0);
        $methodName = trim($input['method'] ?? 'UPI / QR');
        $email = trim($input['email'] ?? ($currentUser['email'] ?? ''));

        if ($amount <= 0) {
            sendError('Please enter a valid amount greater than 0', 400);
        }

        $userId = $currentUser['id'] ?? null;
        if (!$userId && !empty($email)) {
            $uStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $uStmt->execute([$email]);
            $userId = $uStmt->fetchColumn();
        }

        if (!$userId) {
            sendError('User authentication required to recharge wallet', 401);
        }

        $pdo->beginTransaction();
        try {
            // Credit wallet
            $upStmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
            $upStmt->execute([$amount, $userId]);

            // Record transaction
            $txRef = 'WAL-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
            $txStmt = $pdo->prepare("
                INSERT INTO wallet_transactions (user_id, type, title, amount, reference)
                VALUES (?, 'Credit', ?, ?, ?)
            ");
            $txStmt->execute([$userId, "Added via $methodName", $amount, $txRef]);

            // Get updated balance
            $newBalStmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
            $newBalStmt->execute([$userId]);
            $newBalance = (float)$newBalStmt->fetchColumn();

            $pdo->commit();

            sendResponse([
                'success' => true,
                'message' => "Successfully added ₹$amount to your wallet via $methodName.",
                'wallet_balance' => $newBalance,
                'reference' => $txRef
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError('Failed to add money: ' . $e->getMessage(), 500);
        }
    }

    sendError('Wallet endpoint not found', 404);
}

