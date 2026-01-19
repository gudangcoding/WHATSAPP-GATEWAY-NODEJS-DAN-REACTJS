-- Create webhooks table migration
CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` INT UNSIGNED NOT NULL,
  `event_type` ENUM('message_received', 'message_sent', 'message_delivered', 'message_read', 'device_connected', 'device_disconnected', 'qr_updated') NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `method` ENUM('POST', 'PUT', 'PATCH') DEFAULT 'POST',
  `headers` JSON NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `retry_attempts` INT DEFAULT 3,
  `timeout_seconds` INT DEFAULT 30,
  `last_triggered` TIMESTAMP NULL,
  `success_count` INT DEFAULT 0,
  `failure_count` INT DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  INDEX `idx_webhooks_device_id` (`device_id`),
  INDEX `idx_webhooks_event_type` (`event_type`),
  INDEX `idx_webhooks_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;