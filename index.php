<?php
/**
 * SafarSathi - Root Entry Point
 * Serves the React Single Page Application (frontend/dist/index.html)
 */

if (file_exists(__DIR__ . '/frontend/dist/index.html')) {
    include __DIR__ . '/frontend/dist/index.html';
    exit;
}

if (file_exists(__DIR__ . '/dist/index.html')) {
    include __DIR__ . '/dist/index.html';
    exit;
}

if (file_exists(__DIR__ . '/index.html')) {
    include __DIR__ . '/index.html';
    exit;
}

echo "SafarSathi Bus Ticket Booking System is ready. Please run 'npm run build --prefix frontend'.";
