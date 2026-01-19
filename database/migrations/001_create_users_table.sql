-- Create users table migration
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `status` ENUM('active', 'inactive', 'suspended', 'deleted') DEFAULT 'inactive',
  `email_verified` BOOLEAN DEFAULT FALSE,
  `email_verified_at` TIMESTAMP NULL,
  `verification_token` VARCHAR(255) NULL,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` TIMESTAMP NULL,
  `two_factor_enabled` BOOLEAN DEFAULT FALSE,
  `two_factor_secret` VARCHAR(255) NULL,
  `last_login_at` TIMESTAMP NULL,
  `last_login_ip` VARCHAR(45) NULL,
  `api_key` VARCHAR(64) NULL UNIQUE,
  `max_devices` INT DEFAULT 5,
  `deleted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_api_key` (`api_key`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_verification_token` (`verification_token`),
  INDEX `idx_users_reset_token` (`reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;