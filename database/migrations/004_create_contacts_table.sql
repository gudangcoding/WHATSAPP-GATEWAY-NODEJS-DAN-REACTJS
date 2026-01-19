-- Create contacts table migration
DROP TABLE IF EXISTS `contacts`;

CREATE TABLE `contacts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `device_id` INT UNSIGNED NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `name` VARCHAR(255) NULL,
  `profile_picture` VARCHAR(500) NULL,
  `status` VARCHAR(500) NULL,
  `is_business` BOOLEAN DEFAULT FALSE,
  `is_group` BOOLEAN DEFAULT FALSE,
  `group_participants` JSON NULL,
  `metadata` JSON NULL,
  `last_seen_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE,
  INDEX `idx_contacts_user_id` (`user_id`),
  INDEX `idx_contacts_device_id` (`device_id`),
  INDEX `idx_contacts_phone_number` (`phone_number`),
  INDEX `idx_contacts_name` (`name`),
  UNIQUE KEY `uk_contacts_device_phone` (`device_id`, `phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;