-- phpMyAdmin SQL
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 25, 2026 at 12:32 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
-- Database: `kapet_balay_db`
-- Table structure for table `daily_order_sequences`

CREATE TABLE `daily_order_sequences` (
  `order_day` date NOT NULL,
  `last_number` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `daily_order_sequences`

INSERT INTO `daily_order_sequences` (`order_day`, `last_number`) VALUES
('2026-11-20', 8),
('2026-11-21', 1),
('2026-11-24', 11);

-- Table structure for table `inventory`

CREATE TABLE `inventory` (
  `item_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit` varchar(30) NOT NULL,
  `minimum_stock` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `inventory`

INSERT INTO `inventory` (`item_id`, `item_name`, `category`, `quantity`, `unit`, `minimum_stock`, `created_at`) VALUES
(1, 'Food Box', 'Containers', 100.00, 'pcs', 200.00, '2026-11-20 01:30:54'),
(2, 'Pork', 'Utensils', 0.00, 'pcs', 10.00, '2026-11-20 01:34:30'),
(3, 'Cup Dome', 'Beverage', 100.00, 'pc', 70.00, '2026-11-24 03:37:24'),
(4, 'Tisssue', 'Amenities', 100.00, 'Box', 80.00, '2026-11-24 12:57:22'),
(5, 'Spoon', 'Utensils', 50.00, 'pcs', 100.00, '2026-11-24 12:57:40'),
(6, 'Straw', 'Beverage', 1.00, 'pcs', 59.00, '2026-11-24 12:58:02'),
(7, 'TapperWare', 'Containers', 10.00, 'pcs', 20.00, '2026-11-24 15:09:03'),
(8, 'Paper Bag', 'Containers', 40.00, 'pcs', 50.00, '2026-11-24 15:27:33'),
(9, 'Cup', 'Utensils', 10.00, 'pcs', 20.00, '2026-11-24 15:29:36');

-- Table structure for table `menu_items`

CREATE TABLE `menu_items` (
  `menu_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `availability` enum('Available','Unavailable') DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `menu_items`

INSERT INTO `menu_items` (`menu_id`, `item_name`, `category`, `price`, `availability`) VALUES
(1, 'Americano', 'Coffee', 100.00, 'Available'),
(2, 'Cafe Latte', 'Coffee', 120.00, 'Available'),
(3, 'Caramel Macchiato', 'Coffee', 140.00, 'Available'),
(4, 'Chocolate Drink', 'Non-Coffee', 120.00, 'Available'),
(5, 'Matcha Latte', 'Non-Coffee', 130.00, 'Available'),
(6, 'Club Sandwich', 'Food', 150.00, 'Available'),
(7, 'French Fries', 'Food', 85.00, 'Available'),
(8, 'Cheeseburger', 'Food', 130.00, 'Available'),
(9, 'Chicken Sandwich', 'Food', 140.00, 'Available'),
(10, 'Nachos', 'Food', 110.00, 'Available'),
(11, 'Croissant', 'Pastry', 75.00, 'Available'),
(12, 'Chocolate Muffin', 'Pastry', 65.00, 'Available'),
(13, 'Cookies', 'Pastry', 55.00, 'Available'),
(14, 'Cinnamon Roll', 'Pastry', 85.00, 'Available'),
(15, 'Cheese Danish', 'Pastry', 80.00, 'Available');

-- Table structure for table `orders`

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `daily_order_number` int(11) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Pending','Preparing','Ready','Completed') DEFAULT 'Pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `orders`

INSERT INTO `orders` (`order_id`, `daily_order_number`, `total_amount`, `status`, `order_date`) VALUES
(1, 1, 220.00, 'Completed', '2026-11-20 02:25:16'),
(2, 2, 220.00, 'Completed', '2026-11-20 02:36:09'),
(3, 3, 220.00, 'Completed', '2026-11-20 02:42:34'),
(4, 4, 230.00, 'Completed', '2026-11-20 02:45:30'),
(5, 5, 185.00, 'Completed', '2026-11-20 03:25:56'),
(6, 6, 100.00, 'Completed', '2026-11-20 03:39:44'),
(7, 7, 220.00, 'Completed', '2026-11-20 04:52:56'),
(8, 8, 220.00, 'Completed', '2026-11-20 09:45:38'),
(9, 1, 220.00, 'Completed', '2026-11-21 06:49:56'),
(10, 1, 250.00, 'Completed', '2026-11-24 03:07:35'),
(11, 2, 220.00, 'Completed', '2026-11-24 03:31:01'),
(12, 3, 260.00, 'Completed', '2026-11-24 03:50:11'),
(13, 4, 220.00, 'Completed', '2026-11-24 09:31:52'),
(14, 5, 270.00, 'Completed', '2026-11-24 09:32:17'),
(15, 6, 220.00, 'Completed', '2026-11-24 14:32:09'),
(16, 7, 240.00, 'Completed', '2026-11-24 14:32:45'),
(17, 8, 220.00, 'Ready', '2026-11-24 14:45:18'),
(18, 9, 220.00, 'Ready', '2026-11-24 14:47:55'),
(19, 10, 260.00, 'Completed', '2026-11-24 14:56:42'),
(20, 11, 230.00, 'Ready', '2026-11-24 15:02:21');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `order_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `order_items`

INSERT INTO `order_items` (`order_item_id`, `order_id`, `menu_id`, `quantity`, `price`, `subtotal`) VALUES
(1, 1, 2, 1, 120.00, 120.00),
(2, 1, 1, 1, 100.00, 100.00),
(3, 2, 1, 1, 100.00, 100.00),
(4, 2, 2, 1, 120.00, 120.00),
(5, 3, 1, 1, 100.00, 100.00),
(6, 3, 2, 1, 120.00, 120.00),
(7, 4, 1, 1, 100.00, 100.00),
(8, 4, 8, 1, 130.00, 130.00),
(9, 5, 1, 1, 100.00, 100.00),
(10, 5, 14, 1, 85.00, 85.00),
(11, 6, 1, 1, 100.00, 100.00),
(12, 7, 1, 1, 100.00, 100.00),
(13, 7, 2, 1, 120.00, 120.00),
(14, 8, 1, 1, 100.00, 100.00),
(15, 8, 2, 1, 120.00, 120.00),
(16, 9, 1, 1, 100.00, 100.00),
(17, 9, 2, 1, 120.00, 120.00),
(18, 10, 1, 1, 100.00, 100.00),
(19, 10, 6, 1, 150.00, 150.00),
(20, 11, 1, 1, 100.00, 100.00),
(21, 11, 2, 1, 120.00, 120.00),
(22, 12, 2, 1, 120.00, 120.00),
(23, 12, 3, 1, 140.00, 140.00),
(24, 13, 1, 1, 100.00, 100.00),
(25, 13, 2, 1, 120.00, 120.00),
(26, 14, 4, 1, 120.00, 120.00),
(27, 14, 6, 1, 150.00, 150.00),
(28, 15, 1, 1, 100.00, 100.00),
(29, 15, 2, 1, 120.00, 120.00),
(30, 16, 1, 1, 100.00, 100.00),
(31, 16, 3, 1, 140.00, 140.00),
(32, 17, 1, 1, 100.00, 100.00),
(33, 17, 2, 1, 120.00, 120.00),
(34, 18, 1, 1, 100.00, 100.00),
(35, 18, 2, 1, 120.00, 120.00),
(36, 19, 2, 1, 120.00, 120.00),
(37, 19, 3, 1, 140.00, 140.00),
(38, 20, 4, 1, 120.00, 120.00),
(39, 20, 10, 1, 110.00, 110.00);

-- Table structure for table `staff`

CREATE TABLE `staff` (
  `staff_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `staff`

INSERT INTO `staff` (`staff_id`, `username`, `password`, `full_name`, `created_at`) VALUES
(1, 'admin', '$2b$10$4iwh3t7sbCM5pDva9P1Itu9EjVFEcyzVeusJ1fWSq9RAEgvX9nPo6', 'Kape’t Balay Administrator', '2026-11-19 15:30:33');

-- Table structure for table `stock_movements`

CREATE TABLE `stock_movements` (
  `movement_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `movement_type` enum('Stock In','Stock Usage') NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `movement_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Indexes for dumped tables
-- Indexes for table `daily_order_sequences`

ALTER TABLE `daily_order_sequences`
  ADD PRIMARY KEY (`order_day`);

-- Indexes for table `inventory`

ALTER TABLE `inventory`
  ADD PRIMARY KEY (`item_id`);

-- Indexes for table `menu_items`

ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`menu_id`);

-- Indexes for table `orders`

ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`);

-- Indexes for table `order_items`

ALTER TABLE `order_items`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_id` (`menu_id`);

-- Indexes for table `staff`

ALTER TABLE `staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `username` (`username`);

-- Indexes for table `stock_movements`

ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`movement_id`),
  ADD KEY `item_id` (`item_id`);

-- AUTO_INCREMENT for dumped tables
-- AUTO_INCREMENT for table `inventory`

ALTER TABLE `inventory`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

-- AUTO_INCREMENT for table `menu_items`

ALTER TABLE `menu_items`
  MODIFY `menu_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

-- AUTO_INCREMENT for table `orders`

ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

-- AUTO_INCREMENT for table `order_items`

ALTER TABLE `order_items`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

-- AUTO_INCREMENT for table `staff`

ALTER TABLE `staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

-- AUTO_INCREMENT for table `stock_movements`

ALTER TABLE `stock_movements`
  MODIFY `movement_id` int(11) NOT NULL AUTO_INCREMENT;

-- Constraints for dumped tables
-- Constraints for table `order_items`

ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu_items` (`menu_id`);

-- Constraints for table `stock_movements`

ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory` (`item_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
