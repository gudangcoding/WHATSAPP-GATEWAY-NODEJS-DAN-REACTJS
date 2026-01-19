-- Create sessions table migration
DROP TABLE IF EXISTS `sessions`;

CREATE TABLE `sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `device_id` INT UNSIGNED NULL,
  `token` VARCHAR(500) NOT NULL,
  `refresh_token` VARCHAR(500) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `status` ENUM('active', 'inactive', 'expired', 'revoked') DEFAULT 'active',
  `two_factor_verified` BOOLEAN DEFAULT FALSE,
  `last_activity_at` TIMESTAMP NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL,
  INDEX `idx_sessions_user_id` (`user_id`),
  INDEX `idx_sessions_device_id` (`device_id`),
  INDEX `idx_sessions_token` (`token`(255)),
  INDEX `idx_sessions_expires_at` (`expires_at`),
  INDEX `idx_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;