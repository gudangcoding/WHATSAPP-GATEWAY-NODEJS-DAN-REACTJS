-- Default AI templates seed data
-- Create AI templates for the devices
INSERT INTO `ai_templates` (`device_id`, `name`, `type`, `base_template`, `ai_model`, `ai_prompt`, `max_variations`, `is_active`) VALUES
-- Templates for Admin Primary Device (device_id = 1)
(1, 'Greeting Variations', 'greeting', 'Halo, selamat datang!', 'gpt-3.5-turbo', 'Buat variasi sapaan yang ramah dan profesional dalam bahasa Indonesia', 5, TRUE),
(1, 'Closing Variations', 'closing', 'Terima kasih, semoga harimu menyenangkan!', 'gpt-3.5-turbo', 'Buat variasi penutup percakapan yang ramah dalam bahasa Indonesia', 5, TRUE),
(1, 'Auto Reply Professional', 'auto_reply', 'Terima kasih atas pesan Anda. Kami akan segera merespons.', 'gpt-3.5-turbo', 'Buat variasi balasan otomatis yang profesional dalam bahasa Indonesia', 3, TRUE),

-- Templates for Demo Device (device_id = 3)
(3, 'Demo Greeting', 'greeting', 'Hi there! Welcome to our demo!', 'gpt-3.5-turbo', 'Create friendly greeting variations for demo purposes', 3, TRUE),
(3, 'Demo Auto Reply', 'auto_reply', 'Thanks for trying our demo! This is an automated response.', 'gpt-3.5-turbo', 'Create demo auto-reply variations', 3, TRUE);