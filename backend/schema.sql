-- SafarSathi Bus Ticket Booking - Complete MySQL Schema
-- Version: 2.0.0
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ and Hostinger

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop old tables if they exist to prevent outdated column conflicts
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `wallet_transactions`;
DROP TABLE IF EXISTS `seat_holds`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `operators`;
DROP TABLE IF EXISTS `agents`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'user',
    `wallet_balance` DECIMAL(10, 2) DEFAULT 150.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Buses Table
CREATE TABLE IF NOT EXISTS `buses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_name` VARCHAR(255) NOT NULL,
    `bus_number` VARCHAR(100) DEFAULT NULL,
    `bus_type` VARCHAR(100) DEFAULT 'AC Sleeper (2+1)',
    `source` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `departure_time` VARCHAR(50) NOT NULL,
    `arrival_time` VARCHAR(50) NOT NULL,
    `duration` VARCHAR(50) DEFAULT '10h 00m',
    `fare` DECIMAL(10, 2) NOT NULL,
    `rating` DECIMAL(2, 1) DEFAULT 4.5,
    `seats_capacity` INT DEFAULT 24,
    `amenities` TEXT DEFAULT NULL,
    `boarding_points` TEXT DEFAULT NULL,
    `dropping_points` TEXT DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_buses_route` (`source`, `destination`),
    INDEX `idx_buses_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pnr` VARCHAR(100) UNIQUE NOT NULL,
    `user_id` INT DEFAULT NULL,
    `bus_id` INT NOT NULL,
    `passenger_name` VARCHAR(255) NOT NULL,
    `passenger_email` VARCHAR(255) NOT NULL,
    `passenger_phone` VARCHAR(50) DEFAULT NULL,
    `source` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `seat_no` VARCHAR(255) NOT NULL,
    `travel_date` DATE NOT NULL,
    `base_fare` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `tax_fare` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `addons_fare` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_fare` DECIMAL(10, 2) NOT NULL,
    `addons` TEXT DEFAULT NULL,
    `passengers_detail` TEXT DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'Confirmed',
    `payment_status` VARCHAR(50) DEFAULT 'Paid',
    `payment_method` VARCHAR(50) DEFAULT 'Online',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_bookings_pnr` (`pnr`),
    INDEX `idx_bookings_user_id` (`user_id`),
    INDEX `idx_bookings_email` (`passenger_email`),
    INDEX `idx_bookings_bus_date` (`bus_id`, `travel_date`),
    INDEX `idx_bookings_status` (`status`),
    CONSTRAINT `fk_bookings_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Temporary Seat Holds (Concurrency & Double-Booking Prevention)
CREATE TABLE IF NOT EXISTS `seat_holds` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_id` INT NOT NULL,
    `travel_date` DATE NOT NULL,
    `seat_no` VARCHAR(20) NOT NULL,
    `hold_token` VARCHAR(100) NOT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_bus_date_seat` (`bus_id`, `travel_date`, `seat_no`),
    INDEX `idx_seat_holds_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `type` ENUM('Credit', 'Debit') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reference` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_wallet_user_id` (`user_id`),
    CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Coupons / Offers Table
CREATE TABLE IF NOT EXISTS `coupons` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `discount_amount` DECIMAL(10, 2) NOT NULL,
    `discount_type` ENUM('flat', 'percent') DEFAULT 'flat',
    `min_spend` DECIMAL(10, 2) DEFAULT 0.00,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pnr` VARCHAR(100) NOT NULL,
    `user_id` INT DEFAULT NULL,
    `bus_id` INT DEFAULT NULL,
    `rating` INT NOT NULL,
    `comment` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_reviews_bus` (`bus_id`),
    INDEX `idx_reviews_pnr` (`pnr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bus Operators Table
CREATE TABLE IF NOT EXISTS `operators` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agency_name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `fleet_size` VARCHAR(50) DEFAULT '1',
    `status` VARCHAR(50) DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Travel Agents Table
CREATE TABLE IF NOT EXISTS `agents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `agency_shop` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin User (admin@safarsathi.com / amir2010khan)
-- Password hash generated using password_hash('amir2010khan', PASSWORD_DEFAULT)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `wallet_balance`)
VALUES (
    1,
    'Admin',
    'admin@safarsathi.com',
    '9876543210',
    '$2y$10$wTqKxM8v6hC3E6uG1Z9vyeX0OeVL1/BkJ5rD5q3YV6wL/r5n4hZwe',
    'admin',
    5000.00
) ON DUPLICATE KEY UPDATE `role`='admin';

-- No hardcoded buses: All fleet buses are added dynamically by the administrator via the Admin Panel.

-- Seed Coupons
INSERT INTO `coupons` (`id`, `code`, `title`, `description`, `discount_amount`, `discount_type`, `min_spend`, `active`) VALUES
(1, 'FIRST50', 'FLAT ₹200 OFF', 'Valid on first bus booking for new users', 200.00, 'flat', 500.00, 1),
(2, 'TRAVELGO', 'NEW USER SPECIAL', 'Get ₹150 instant discount on any booking', 150.00, 'flat', 400.00, 1),
(3, 'FIRST20', 'FLAT 20% OFF', 'Get 20% discount on your first booking with TravelGo', 20.00, 'percent', 600.00, 1),
(4, 'FESTIVE300', 'SAVE UP TO ₹300', 'Applicable on bookings above ₹1200 across all routes', 300.00, 'flat', 1200.00, 1),
(5, 'WEEKEND15', '15% CASHBACK', 'Book Saturday or Sunday travels and enjoy instant discount', 15.00, 'percent', 700.00, 1),
(6, 'GROUP500', 'FLAT ₹500 OFF', 'Valid when booking 4 or more seats in a single booking', 500.00, 'flat', 2000.00, 1)
ON DUPLICATE KEY UPDATE `code`=VALUES(`code`);

SET FOREIGN_KEY_CHECKS = 1;

