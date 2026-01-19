-- Default auto replies seed data
-- Create sample auto reply rules
INSERT INTO `auto_replies` (`device_id`, `user_id`, `name`, `match_type`, `keywords`, `reply_type`, `reply_text`, `is_active`, `priority`, `cooldown_minutes`, `max_daily_replies`, `is_group_enabled`, `delay_seconds`) VALUES
-- Auto replies for Admin Primary Device
(1, 1, 'Welcome Message', 'contains', 'halo,hai,hello,hi', 'text', 'Halo! Terima kasih telah menghubungi kami. Ada yang bisa kami bantu?', TRUE, 1, 5, 10, FALSE, 2),
(1, 1, 'Business Hours', 'contains', 'jam,buka,tutup,operasional', 'text', 'Jam operasional kami: Senin-Jumat 09:00-17:00 WIB. Sabtu 09:00-15:00 WIB.', TRUE, 2, 10, 5, FALSE, 1),
(1, 1, 'Contact Info', 'contains', 'kontak,alamat,lokasi,telepon', 'text', 'Kontak kami:\n📞 Telepon: +62-21-1234567\n📧 Email: info@company.com\n📍 Alamat: Jakarta, Indonesia', TRUE, 3, 15, 3, FALSE, 3),

-- Auto replies for Demo Device
(3, 2, 'Demo Welcome', 'contains', 'demo,test,hello', 'text', 'Welcome to our WhatsApp Gateway demo! This is an automated response.', TRUE, 1, 2, 20, TRUE, 1),
(3, 2, 'Demo Features', 'contains', 'feature,fitur,kemampuan', 'text', 'Demo features:\n✅ Auto Reply\n✅ Message Broadcasting\n✅ Contact Management\n✅ AI Integration', TRUE, 2, 5, 10, TRUE, 2);