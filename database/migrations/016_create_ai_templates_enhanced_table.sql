-- Enhanced AI Templates table migration - Add additional columns to existing table
-- Add new columns to ai_templates table
ALTER TABLE `ai_templates` 
ADD COLUMN `user_id` INT UNSIGNED NULL AFTER `device_id`,
ADD COLUMN `description` TEXT NULL AFTER `name`,
ADD COLUMN `category` ENUM('message_variations', 'auto_reply', 'campaign_optimization', 'content_generation', 'sentiment_analysis', 'translation') NULL AFTER `type`,
ADD COLUMN `template_data` JSON NULL AFTER `base_template`,
ADD COLUMN `language` VARCHAR(5) DEFAULT 'id' AFTER `ai_prompt`,
ADD COLUMN `industry` VARCHAR(50) DEFAULT 'general' AFTER `language`,
ADD COLUMN `target_audience` VARCHAR(50) DEFAULT 'general' AFTER `industry`,
ADD COLUMN `tags` JSON NULL AFTER `target_audience`,
ADD COLUMN `is_public` BOOLEAN DEFAULT FALSE AFTER `is_active`,
ADD COLUMN `is_featured` BOOLEAN DEFAULT FALSE AFTER `is_public`,
ADD COLUMN `rating` DECIMAL(3,2) DEFAULT 0.00 AFTER `usage_count`,
ADD COLUMN `rating_count` INT DEFAULT 0 AFTER `rating`,
ADD COLUMN `created_by_system` BOOLEAN DEFAULT FALSE AFTER `rating_count`;

-- Add foreign key for user_id
ALTER TABLE `ai_templates` ADD FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Add new indexes
ALTER TABLE `ai_templates` 
ADD INDEX `idx_ai_templates_category` (`category`),
ADD INDEX `idx_ai_templates_language` (`language`),
ADD INDEX `idx_ai_templates_industry` (`industry`),
ADD INDEX `idx_ai_templates_public` (`is_public`),
ADD INDEX `idx_ai_templates_featured` (`is_featured`),
ADD INDEX `idx_ai_templates_user_category` (`user_id`, `category`);
;