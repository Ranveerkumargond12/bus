<?php
/**
 * SafarSathi - Authentication & JWT Helper
 * Lightweight, zero-dependency HMAC-SHA256 token generator and authenticator.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

/**
 * Base64 URL encode
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 ? strlen($data) + (4 - strlen($data) % 4) : strlen($data), '=', STR_PAD_RIGHT));
}

/**
 * Generate a signed JWT token
 * 
 * @param array $payload Token data (sub, email, role, etc.)
 * @param int $expirySeconds Expiration in seconds (default 7 days)
 * @return string
 */
function generateJWT(array $payload, $expirySeconds = 604800) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + $expirySeconds;

    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode(json_encode($payload));

    $signature = hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);

    return "$base64Header.$base64Payload.$base64Signature";
}

/**
 * Verify a JWT token
 * 
 * @param string $token
 * @return array|false Payload if valid, false if invalid/expired
 */
function verifyJWT($token) {
    if (empty($token)) return false;

    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    list($base64Header, $base64Payload, $base64Signature) = $parts;

    $expectedSignature = base64UrlEncode(hash_hmac('sha256', "$base64Header.$base64Payload", JWT_SECRET, true));

    if (!hash_equals($expectedSignature, $base64Signature)) {
        return false;
    }

    $payload = json_decode(base64UrlDecode($base64Payload), true);
    if (!is_array($payload)) return false;

    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Token expired
    }

    return $payload;
}

/**
 * Extracts Bearer token from HTTP headers
 * 
 * @return string|null
 */
function getBearerToken() {
    $header = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $header = trim($headers['Authorization']);
        } elseif (isset($headers['authorization'])) {
            $header = trim($headers['authorization']);
        }
    }

    if (!empty($header)) {
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
    }

    // Fallback: check query param 'token'
    if (isset($_GET['token']) && !empty($_GET['token'])) {
        return $_GET['token'];
    }

    return null;
}

/**
 * Resolves currently authenticated user from Bearer token
 * 
 * @return array|null
 */
function getCurrentUser() {
    static $currentUser = null;
    if ($currentUser !== null) {
        return $currentUser;
    }

    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $payload = verifyJWT($token);
    if (!$payload || !isset($payload['sub'])) {
        return null;
    }

    $pdo = getDB();

    // Check if logged-in session is a Bus Conductor
    if (($payload['role'] ?? '') === 'conductor') {
        $busId = (int)($payload['bus_id'] ?? $payload['sub']);
        $bStmt = $pdo->prepare("SELECT * FROM buses WHERE id = ?");
        $bStmt->execute([$busId]);
        $bus = $bStmt->fetch();
        if ($bus) {
            $currentUser = [
                'id' => (int)$bus['id'],
                'bus_id' => (int)$bus['id'],
                'bus_name' => $bus['bus_name'],
                'bus_number' => $bus['bus_number'],
                'name' => !empty($bus['conductor_name']) ? $bus['conductor_name'] : ($bus['bus_name'] . ' Conductor'),
                'email' => !empty($bus['conductor_phone']) ? $bus['conductor_phone'] : ($bus['bus_number'] ?? ''),
                'phone' => $bus['conductor_phone'] ?? '',
                'role' => 'conductor'
            ];
            return $currentUser;
        }
        return null;
    }

    $stmt = $pdo->prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?");
    $stmt->execute([(int)$payload['sub']]);
    $user = $stmt->fetch();

    if ($user) {
        $currentUser = $user;
        return $user;
    }

    return null;
}

/**
 * Requires authentication; returns user or sends 401
 * 
 * @return array
 */
function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Unauthorized. Please log in to continue.', 401);
    }
    return $user;
}

/**
 * Requires a specific role (e.g. 'admin'); sends 403 if unauthorized
 * 
 * @param string $requiredRole
 * @return array
 */
function requireRole($requiredRole) {
    $user = requireAuth();
    if (strtolower($user['role']) !== strtolower($requiredRole)) {
        sendError('Forbidden. Insufficient permissions.', 403);
    }
    return $user;
}

