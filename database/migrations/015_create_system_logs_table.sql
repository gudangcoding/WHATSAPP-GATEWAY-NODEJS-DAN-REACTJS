-- Create system_logs table migration
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `level` ENUM('debug', 'info', 'warn', 'error', 'fatal') NOT NULL,
  `message` TEXT NOT NULL,
  `context` VARCHAR(255) NULL,
  `user_id` INT UNSIGNED NULL,
  `device_id` INT UNSIGNED NULL,
  `session_id` VARCHAR(255) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL,
  INDEX `idx_system_logs_level` (`level`),
  INDEX `idx_system_logs_context` (`context`),
  INDEX `idx_system_logs_user_id` (`user_id`),
  INDEX `idx_system_logs_device_id` (`device_id`),
  INDEX `idx_system_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;