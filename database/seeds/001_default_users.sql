-- Default users seed data
-- Password for all users: "password123" (hashed with bcrypt)
INSERT INTO `users` (`name`, `email`, `password`, `api_key`, `status`, `email_verified`, `max_devices`, `email_verified_at`) VALUES
('Admin User', 'admin@whatsapp-gateway.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8/jF1Es8alHKh9VUoalOFA9mzuXXdO', 'wg_admin_1234567890abcdef1234567890abcdef', 'active', TRUE, 10, NOW()),
('Demo User', 'demo@whatsapp-gateway.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8/jF1Es8alHKh9VUoalOFA9mzuXXdO', 'wg_demo_abcdef1234567890abcdef1234567890', 'active', TRUE, 5, NOW()),
('Test User', 'test@whatsapp-gateway.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8/jF1Es8alHKh9VUoalOFA9mzuXXdO', 'wg_test_fedcba0987654321fedcba0987654321', 'active', TRUE, 3, NOW());