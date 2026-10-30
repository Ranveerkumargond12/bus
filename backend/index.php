<?php
/**
 * SafarSathi - Main REST API Front Controller
 * Single-entrypoint router for all PHP backend endpoints.
 * Compatible with Apache mod_rewrite, Hostinger, and PHP built-in server.
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/response.php';
require_once __DIR__ . '/utils/auth.php';

// Handle CORS Preflight for all endpoints
handleCorsPreflight();

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Parse JSON Body
$input = getJsonInput();

// Extract Route string
$route = '';
if (isset($_GET['route']) && !empty($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} else {
    // Regex extract everything after /api/ or /backend/
    if (preg_match('#/(?:api|backend)(?:/index\.php)?/(.*)$#i', $requestUri, $matches)) {
        $route = trim($matches[1], '/');
    } else {
        // Strip script name if directly accessed
        $scriptName = $_SERVER['SCRIPT_NAME'];
        $baseDir = dirname($scriptName);
        $path = str_replace([$scriptName, $baseDir], '', $requestUri);
        $route = trim($path, '/');
    }
}

// Split route segments (e.g. 'admin/delete-user/5' -> ['admin', 'delete-user', '5'])
$segments = array_values(array_filter(explode('/', $route)));
$seg0 = $segments[0] ?? '';

// Healthcheck / Root info
if (empty($seg0) || $seg0 === 'health' || $seg0 === 'status') {
    sendResponse([
        'name' => 'SafarSathi Bus Ticket Booking REST API',
        'version' => '2.0.0',
        'status' => 'online',
        'database' => DB_DRIVER,
        'timestamp' => date('c')
    ]);
}

// 1. Authentication Routes
if ($seg0 === 'auth') {
    require_once __DIR__ . '/api/auth.php';
    $action = $segments[1] ?? '';
    handleAuthRoutes($method, $action, $input);
}
// Legacy shorthand auth routes
if ($seg0 === 'login' || $seg0 === 'register' || $seg0 === 'me' || $seg0 === 'logout') {
    require_once __DIR__ . '/api/auth.php';
    handleAuthRoutes($method, $seg0, $input);
}

// 2. Buses & Routes
if ($seg0 === 'buses' || $seg0 === 'popular-routes') {
    require_once __DIR__ . '/api/buses.php';
    handleBusesRoutes($method, $segments, $input);
}

// 3. Seats & Availability
if ($seg0 === 'seats' || $seg0 === 'booked-seats') {
    require_once __DIR__ . '/api/seats.php';
    handleSeatsRoutes($method, $segments, $input);
}

// 4. Bookings & Tickets
if ($seg0 === 'bookings' || $seg0 === 'book-ticket' || $seg0 === 'my-bookings' || $seg0 === 'cancel-booking') {
    require_once __DIR__ . '/api/bookings.php';
    handleBookingsRoutes($method, $segments, $input);
}

// 5. Wallet & Recharge
if ($seg0 === 'wallet') {
    require_once __DIR__ . '/api/wallet.php';
    handleWalletRoutes($method, $segments, $input);
}

// 6. Coupons & Offers
if ($seg0 === 'coupons' || $seg0 === 'offers') {
    require_once __DIR__ . '/api/coupons.php';
    handleCouponsRoutes($method, $segments, $input);
}

// 7. Operators Management
if ($seg0 === 'operators') {
    require_once __DIR__ . '/api/operators.php';
    handleOperatorsRoutes($method, $segments, $input);
}

// 8. Agents Management
if ($seg0 === 'agents') {
    require_once __DIR__ . '/api/agents.php';
    handleAgentsRoutes($method, $segments, $input);
}

// 9. Ratings & Reviews
if ($seg0 === 'reviews') {
    require_once __DIR__ . '/api/reviews.php';
    handleReviewsRoutes($method, $segments, $input);
}

// 10. Admin Management & KPI Dashboard
if ($seg0 === 'admin') {
    require_once __DIR__ . '/api/admin.php';
    handleAdminRoutes($method, $segments, $input);
}

// 404 Endpoint Not Found
sendError("API endpoint '/$route' not found", 404, [
    'method' => $method,
    'route' => $route,
    'segments' => $segments
]);

