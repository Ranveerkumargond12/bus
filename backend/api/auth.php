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

        if ($email === 'admin@safarsathi.com') {
            sendError('This email is reserved for Administrator. Only User/Passenger accounts can be created here.', 400);
        }

        // Check if email already registered
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendError('This email is already registered! Please login.', 400);
        }

        // Strictly force 'user' role for all Sign Up registrations
        $role = 'user';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $insertStmt = $pdo->prepare("
            INSERT INTO users (name, email, phone, password, role) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $insertStmt->execute([$name, $email, $phone, $hashedPassword, $role]);
        $userId = (int)$pdo->lastInsertId();

        $userData = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => $role
        ];

        $token = generateJWT([
            'sub' => $userId,
            'email' => $email,
            'role' => $role
        ]);

        sendResponse([
            'success' => true,
            'message' => 'Registration successful!',
            'token' => $token,
            'user' => $userData
        ], 201);
    }

    // POST /api/auth/login or POST /api/login
    if ($method === 'POST' && ($action === 'login' || $action === '')) {
        $rawIdentifier = trim($input['email'] ?? $input['identifier'] ?? $input['mobile'] ?? '');
        $identifier = strtolower($rawIdentifier);
        $password = trim($input['password'] ?? '');

        if (empty($identifier) || empty($password)) {
            sendError('Please enter your Login ID / Email / Mobile and Password.', 400);
        }

        // 1. Check regular users / admin in users table
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?");
        $stmt->execute([$identifier, $rawIdentifier]);
        $user = $stmt->fetch();

        if ($user) {
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

            if ($passwordMatches) {
                $userData = [
                    'id' => (int)$user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'phone' => $user['phone'],
                    'role' => $user['role']
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
        }

        // 2. Check Bus Conductors in buses table (match by Conductor Phone/ID, Conductor Name, Bus Number, or Bus Name)
        $busStmt = $pdo->prepare("
            SELECT * FROM buses 
            WHERE status = 'Active' 
              AND (
                  LOWER(TRIM(COALESCE(conductor_phone, ''))) = ? 
                  OR LOWER(TRIM(COALESCE(conductor_name, ''))) = ? 
                  OR LOWER(TRIM(COALESCE(bus_number, ''))) = ?
                  OR LOWER(TRIM(COALESCE(bus_name, ''))) = ?
              )
        ");
        $busStmt->execute([$identifier, $identifier, $identifier, $identifier]);
        $matchingBuses = $busStmt->fetchAll();

        $matchedBus = null;
        foreach ($matchingBuses as $b) {
            $expectedPin = !empty($b['conductor_pin']) ? trim($b['conductor_pin']) : '1234';
            if ($password === $expectedPin) {
                $matchedBus = $b;
                break;
            }
        }

        if ($matchedBus) {
            $conductorName = !empty($matchedBus['conductor_name'])
                ? $matchedBus['conductor_name']
                : ($matchedBus['bus_name'] . ' Conductor');

            $userData = [
                'id' => (int)$matchedBus['id'],
                'bus_id' => (int)$matchedBus['id'],
                'bus_name' => $matchedBus['bus_name'],
                'bus_number' => $matchedBus['bus_number'],
                'name' => $conductorName,
                'email' => !empty($matchedBus['conductor_phone']) ? $matchedBus['conductor_phone'] : ($matchedBus['bus_number'] ?? ''),
                'phone' => $matchedBus['conductor_phone'] ?? '',
                'role' => 'conductor'
            ];

            $token = generateJWT([
                'sub' => (int)$matchedBus['id'],
                'bus_id' => (int)$matchedBus['id'],
                'name' => $conductorName,
                'role' => 'conductor'
            ]);

            sendResponse([
                'success' => true,
                'message' => 'Conductor login successful!',
                'token' => $token,
                'user' => $userData
            ]);
        }

        sendError('Invalid Login ID / Email or Password!', 401);
    }

    // GET /api/auth/me or GET /api/me
    if ($method === 'GET' && ($action === 'me' || $action === 'profile')) {
        $user = requireAuth();
        sendResponse([
            'success' => true,
            'user' => [
                'id' => (int)$user['id'],
                'bus_id' => isset($user['bus_id']) ? (int)$user['bus_id'] : null,
                'bus_name' => $user['bus_name'] ?? null,
                'bus_number' => $user['bus_number'] ?? null,
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role' => $user['role']
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

