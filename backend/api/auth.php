<?php
/**
 * SafarSathi - Auth API Handler
 * Handles registration, login, profile (/me), and logout
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/auth.php';

function handleAuthRoutes($method, $action, $input) {
    $pdo = getDB();

    // POST /api/auth/register or POST /api/register
    if ($method === 'POST' && ($action === 'register' || $action === '')) {
        $name = trim($input['name'] ?? '');
        $email = trim(strtolower($input['email'] ?? ''));
        $phone = trim($input['phone'] ?? $input['mobile'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($name) || empty($email) || empty($password)) {
            sendError('Name, email, and password are required!', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendError('Please enter a valid email address.', 400);
        }

        if (strlen($password) < 6) {
            sendError('Password must be at least 6 characters long.', 400);
        }

        // Check if email already registered
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendError('This email is already registered! Please login.', 400);
        }

        // Determine role (admin for default email or user)
        $role = ($email === 'admin@safarsathi.com') ? 'admin' : 'user';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $initialWallet = 150.00;

        $insertStmt = $pdo->prepare("
            INSERT INTO users (name, email, phone, password, role, wallet_balance) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $insertStmt->execute([$name, $email, $phone, $hashedPassword, $role, $initialWallet]);
        $userId = (int)$pdo->lastInsertId();

        // Record initial wallet bonus transaction
        $txStmt = $pdo->prepare("
            INSERT INTO wallet_transactions (user_id, type, title, amount, reference)
            VALUES (?, 'Credit', 'Welcome Sign-up Bonus', ?, 'SIGNUP-BONUS')
        ");
        $txStmt->execute([$userId, $initialWallet]);

        $userData = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'wallet_balance' => $initialWallet
        ];

        $token = generateJWT([
            'sub' => $userId,
            'email' => $email,
            'role' => $role
        ]);

        sendResponse([
            'success' => true,
            'message' => 'Registration successful! Welcome bonus of ₹150 added to your wallet.',
            'token' => $token,
            'user' => $userData
        ], 201);
    }

    // POST /api/auth/login or POST /api/login
    if ($method === 'POST' && ($action === 'login' || $action === '')) {
        $identifier = trim(strtolower($input['email'] ?? $input['identifier'] ?? $input['mobile'] ?? ''));
        $password = trim($input['password'] ?? '');

        if (empty($identifier) || empty($password)) {
            sendError('Please enter your email or mobile and password.', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR phone = ?");
        $stmt->execute([$identifier, $identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('Invalid email/mobile or password!', 401);
        }

        // Verify password with hash, with automatic upgrade for legacy plaintext records
        $passwordMatches = false;
        if (password_verify($password, $user['password'])) {
            $passwordMatches = true;
        } elseif ($user['password'] === $password) {
            // Legacy plaintext match: automatically rehash and save!
            $passwordMatches = true;
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $upgradeStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $upgradeStmt->execute([$newHash, $user['id']]);
        }

        if (!$passwordMatches) {
            sendError('Invalid email/mobile or password!', 401);
        }

        $userData = [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'wallet_balance' => (float)$user['wallet_balance']
        ];

        $token = generateJWT([
            'sub' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ]);

        sendResponse([
            'success' => true,
            'message' => 'Login successful!',
            'token' => $token,
            'user' => $userData
        ]);
    }

    // GET /api/auth/me or GET /api/me
    if ($method === 'GET' && ($action === 'me' || $action === 'profile')) {
        $user = requireAuth();
        sendResponse([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role' => $user['role'],
                'wallet_balance' => (float)$user['wallet_balance']
            ]
        ]);
    }

    // POST /api/auth/logout or POST /api/logout
    if ($method === 'POST' && $action === 'logout') {
        sendResponse([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }

    sendError('Auth endpoint not found', 404);
}

