-- Create ai_templates table migration
CREATE TABLE IF NOT EXISTS `ai_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `device_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('message_variation', 'auto_reply', 'greeting', 'closing') NOT NULL,
  `base_template` TEXT NOT NULL,
  `variations` JSON NULL,
  `ai_model` VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
  `ai_prompt` TEXT NULL,
  `max_variations` INT DEFAULT 5,
  `is_active` BOOLEAN DEFAULT TRUE,
  `usage_count` INT DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  INDEX `idx_ai_templates_device_id` (`device_id`),
  INDEX `idx_ai_templates_type` (`type`),
  INDEX `idx_ai_templates_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;