USE `kapet_balay_db`;

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `orders`
  ADD COLUMN `customer_id` int(11) NULL AFTER `order_id`,
  ADD COLUMN `order_type` enum('Pick up','Reservation') NOT NULL DEFAULT 'Pick up' AFTER `status`,
  ADD COLUMN `reservation_time` datetime NULL AFTER `order_type`,
  ADD COLUMN `notes` varchar(120) NOT NULL DEFAULT '' AFTER `reservation_time`,
  ADD KEY `customer_id` (`customer_id`),
  ADD CONSTRAINT `orders_ibfk_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE SET NULL;
