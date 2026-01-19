-- Create webhook_logs table migration
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `webhook_id` INT UNSIGNED NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `response_status` INT NULL,
  `response_body` TEXT NULL,
  `response_time_ms` INT NULL,
  `success` BOOLEAN DEFAULT FALSE,
  `error_message` TEXT NULL,
  `retry_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON DELETE CASCADE,
  INDEX `idx_webhook_logs_webhook_id` (`webhook_id`),
  INDEX `idx_webhook_logs_event_type` (`event_type`),
  INDEX `idx_webhook_logs_success` (`success`),
  INDEX `idx_webhook_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;