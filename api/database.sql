-- Safar Sathi Bus Booking - Hostinger Database SQL Schema
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'user',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Admin User (admin@safarsathi.com / amir2010khan)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) 
VALUES (1, 'Admin', 'admin@safarsathi.com', 'amir2010khan', 'admin')
ON DUPLICATE KEY UPDATE `email`=`email`;

-- 2. Buses Table
CREATE TABLE IF NOT EXISTS `buses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_name` VARCHAR(255) NOT NULL,
    `bus_number` VARCHAR(100),
    `source` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `departure_time` VARCHAR(50),
    `arrival_time` VARCHAR(50),
    `fare` DECIMAL(10, 2) NOT NULL,
    `seats_capacity` INT DEFAULT 36,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Buses Data
INSERT INTO `buses` (`bus_name`, `bus_number`, `source`, `destination`, `departure_time`, `arrival_time`, `fare`) VALUES
('IntrCity SmartBus', 'MH-01-AB-1234', 'Mumbai', 'Goa', '09:00 PM', '07:30 AM', 1200.00),
('Zingbus Express', 'MH-02-CD-5678', 'Mumbai', 'Goa', '10:15 PM', '08:45 AM', 950.00),
('VRL Travels Volvo AC', 'KA-01-EF-9012', 'Bangalore', 'Hyderabad', '08:30 PM', '06:00 AM', 1400.00),
('SRS Travels Sleeper', 'KA-04-GH-3456', 'Bangalore', 'Chennai', '10:00 PM', '05:30 AM', 800.00),
('Orange Travels Multi-Axle', 'TS-09-IJ-7890', 'Hyderabad', 'Mumbai', '07:00 PM', '08:00 AM', 1600.00),
('KSRTC Airavat Club Class', 'KL-15-KL-2345', 'Kochi', 'Bangalore', '08:00 PM', '06:30 AM', 1150.00),
('Hans Travels Premium', 'MP-09-MN-6789', 'Delhi', 'Jaipur', '06:00 AM', '11:30 AM', 650.00),
('Rishabh Travels Gold', 'RJ-14-OP-1122', 'Delhi', 'Udaipur', '09:30 PM', '08:00 AM', 1100.00);

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pnr` VARCHAR(100) UNIQUE,
    `user_id` VARCHAR(50),
    `bus_id` VARCHAR(50),
    `passenger_name` VARCHAR(255),
    `passenger_email` VARCHAR(255),
    `source` VARCHAR(100),
    `destination` VARCHAR(100),
    `seat_no` VARCHAR(255),
    `travel_date` DATE,
    `total_fare` DECIMAL(10, 2),
    `status` VARCHAR(50) DEFAULT 'Confirmed',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Agents Table
CREATE TABLE IF NOT EXISTS `agents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `agency_shop` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Operators Table
CREATE TABLE IF NOT EXISTS `operators` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agency_name` VARCHAR(255) NOT NULL,
    `owner_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `fleet_size` VARCHAR(50) DEFAULT '1',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
