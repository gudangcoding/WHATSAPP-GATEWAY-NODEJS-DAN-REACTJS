-- Create devices table migration
DROP TABLE IF EXISTS `devices`;

CREATE TABLE `devices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL UNIQUE,
  `status` ENUM('connected', 'disconnected', 'connecting', 'error', 'deleted') DEFAULT 'disconnected',
  `qr_code` TEXT NULL,
  `qr_generated_at` TIMESTAMP NULL,
  `session_data` JSON NULL,
  `webhook_url` VARCHAR(500) NULL,
  `settings` JSON NULL,
  `auto_reconnect` BOOLEAN DEFAULT TRUE,
  `reconnect_interval` INT DEFAULT 30,
  `max_reconnect_attempts` INT DEFAULT 5,
  `reconnect_attempts` INT DEFAULT 0,
  `last_reconnect_attempt` TIMESTAMP NULL,
  `connected_at` TIMESTAMP NULL,
  `disconnected_at` TIMESTAMP NULL,
  `last_seen_at` TIMESTAMP NULL,
  `error_message` TEXT NULL,
  `error_timestamp` TIMESTAMP NULL,
  `deleted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_devices_user_id` (`user_id`),
  INDEX `idx_devices_phone_number` (`phone_number`),
  INDEX `idx_devices_status` (`status`),
  UNIQUE KEY `uk_devices_phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;