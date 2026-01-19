-- Default devices seed data
-- Create sample devices for testing
INSERT INTO `devices` (`user_id`, `name`, `phone_number`, `status`, `qr_code`, `session_data`, `webhook_url`, `auto_reconnect`, `max_reconnect_attempts`) VALUES
(1, 'Admin Primary Device', '+6281234567890', 'disconnected', NULL, NULL, NULL, TRUE, 5),
(1, 'Admin Secondary Device', '+6281234567891', 'disconnected', NULL, NULL, NULL, TRUE, 5),
(2, 'Demo Device', '+6281234567892', 'disconnected', NULL, NULL, NULL, TRUE, 3),
(3, 'Test Device', '+6281234567893', 'disconnected', NULL, NULL, NULL, TRUE, 3);