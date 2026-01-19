-- Create ai_history table migration
CREATE TABLE IF NOT EXISTS `ai_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` INT UNSIGNED NOT NULL,
  `template_id` INT UNSIGNED NULL,
  `original_text` TEXT NOT NULL,
  `generated_text` TEXT NOT NULL,
  `ai_model` VARCHAR(100) NOT NULL,
  `prompt_used` TEXT NULL,
  `tokens_used` INT NULL,
  `processing_time_ms` INT NULL,
  `success` BOOLEAN DEFAULT TRUE,
  `error_message` TEXT NULL,
  `usage_context` ENUM('campaign', 'auto_reply', 'manual', 'test') NOT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`template_id`) REFERENCES `ai_templates`(`id`) ON DELETE SET NULL,
  INDEX `idx_ai_history_device_id` (`device_id`),
  INDEX `idx_ai_history_template_id` (`template_id`),
  INDEX `idx_ai_history_usage_context` (`usage_context`),
  INDEX `idx_ai_history_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;