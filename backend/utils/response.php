<?php
/**
 * SafarSathi - Response Helper
 * Standardizes API responses with HTTP status codes and CORS headers
 */

/**
 * Sends a JSON success response and exits
 * 
 * @param mixed $data Response payload or message
 * @param int $statusCode HTTP status code (default 200)
 */
function sendResponse($data, $statusCode = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    // CORS Headers
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');

    if (is_array($data) && !isset($data['success']) && $statusCode >= 200 && $statusCode < 300) {
        // If data is a list or map without explicit success key
        // leave it as is or wrap if desired
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Sends a standardized JSON error response
 * 
 * @param string $message Error message
 * @param int $statusCode HTTP status code (default 400)
 * @param mixed $details Optional extra error details
 */
function sendError($message, $statusCode = 400, $details = null) {
    $payload = [
        'success' => false,
        'message' => $message,
    ];
    if ($details !== null) {
        $payload['details'] = $details;
    }
    sendResponse($payload, $statusCode);
}

/**
 * Handle preflight OPTIONS request
 */
function handleCorsPreflight() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        sendResponse(['status' => 'ok'], 200);
    }
}

/**
 * Parses and returns the JSON or form body
 * 
 * @return array
 */
function getJsonInput() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = [];
    }
    return array_merge($_POST, $data);
}

