# WhatsApp Gateway SaaS - Database Schema Documentation

## Overview
Database schema untuk WhatsApp Gateway SaaS multi-device yang mendukung:
- Multi-user dan multi-device management
- Session persistence dan lifecycle management
- Contact dan group management
- Message logging dan tracking
- Auto reply engine dengan rule-based system
- Campaign/blast messaging dengan queue system
- AI integration untuk message variation
- Webhook system untuk real-time notifications
- Comprehensive logging dan monitoring

## Database Tables

### 1. Users Table
**Purpose**: Menyimpan data pengguna sistem
```sql
users (
  id, name, email, password, api_key, is_active, max_devices, 
  created_at, updated_at
)
```
**Key Features**:
- Unique API key untuk authentication
- Limit maksimal device per user
- Soft delete support dengan is_active flag

### 2. Devices Table
**Purpose**: Menyimpan data device WhatsApp per user
```sql
devices (
  id, user_id, name, description, phone_number, status, qr_code, 
  last_seen, is_active, webhook_url, settings, created_at, updated_at
)
```
**Key Features**:
- Status tracking (disconnected, connecting, connected, pairing, banned, error)
- QR code storage untuk pairing
- Custom webhook URL per device
- JSON settings untuk konfigurasi device

### 3. Sessions Table
**Purpose**: Menyimpan session state Baileys per device
```sql
sessions (
  id, device_id, session_id, auth_state, auth_state_encrypted, status,
  last_activity, reconnect_attempts, max_reconnect_attempts, metadata,
  created_at, updated_at
)
```
**Key Features**:
- Encrypted auth state storage
- Auto-reconnect management
- Session lifecycle tracking
- Metadata untuk debugging

### 4. Contacts Table
**Purpose**: Menyimpan kontak yang di-scrape dari WhatsApp
```sql
contacts (
  id, device_id, phone_number, name, profile_picture, is_business,
  is_group, group_id, source, source_group_id, last_seen, metadata,
  created_at, updated_at
)
```
**Key Features**:
- Source tracking (private, group, manual)
- Business account detection
- Group member relationship
- Duplicate prevention per device

### 5. Groups Table
**Purpose**: Menyimpan data grup WhatsApp
```sql
groups (
  id, device_id, group_id, name, description, profile_picture,
  admin_only, member_count, is_active, metadata, created_at, updated_at
)
```
**Key Features**:
- Group metadata management
- Member count tracking
- Admin-only group detection

### 6. Messages Table
**Purpose**: Logging semua pesan masuk dan keluar
```sql
messages (
  id, device_id, message_id, to_number, from_number, type, content,
  media_url, media_filename, media_mimetype, media_size, status,
  direction, is_group, group_id, quoted_message_id, campaign_id,
  auto_reply_id, error_message, metadata, sent_at, delivered_at,
  read_at, created_at, updated_at
)
```
**Key Features**:
- Multi-media message support
- Status tracking (pending, sent, delivered, read, failed)
- Campaign dan auto-reply relationship
- Quote message support

### 7. Auto Replies Table
**Purpose**: Konfigurasi auto reply rules
```sql
auto_replies (
  id, device_id, name, trigger_type, trigger_value, response_type,
  response_text, response_media_url, response_media_type, priority,
  is_active, cooldown_minutes, max_daily_responses, conditions,
  metadata, created_at, updated_at
)
```
**Key Features**:
- Multiple trigger types (exact, contains, regex, AI fallback)
- Priority-based rule execution
- Cooldown dan daily limit
- Media response support

### 8. Auto Reply Logs Table
**Purpose**: Logging aktivitas auto reply
```sql
auto_reply_logs (
  id, auto_reply_id, device_id, from_number, trigger_message,
  response_sent, cooldown_active, daily_limit_reached, created_at
)
```
**Key Features**:
- Cooldown tracking per nomor
- Daily limit enforcement
- Trigger message logging

### 9. Campaigns Table
**Purpose**: Campaign/blast messaging management
```sql
campaigns (
  id, device_id, name, description, message_type, message_text,
  media_url, media_type, target_type, target_contacts, target_groups,
  target_numbers, schedule_type, scheduled_at, recurring_pattern,
  delay_min, delay_max, randomize_message, ai_variation, status,
  total_targets, sent_count, delivered_count, failed_count,
  started_at, completed_at, metadata, created_at, updated_at
)
```
**Key Features**:
- Multiple target types (contacts, groups, numbers, mixed)
- Scheduling support (immediate, scheduled, recurring)
- Random delay untuk anti-spam
- AI message variation
- Comprehensive statistics

### 10. Campaign Targets Table
**Purpose**: Individual target tracking per campaign
```sql
campaign_targets (
  id, campaign_id, target_number, target_name, target_type, status,
  message_id, sent_at, delivered_at, failed_at, error_message,
  retry_count, max_retries, metadata, created_at, updated_at
)
```
**Key Features**:
- Individual target status tracking
- Retry mechanism
- Delivery confirmation
- Error logging

### 11. AI Templates Table
**Purpose**: Template untuk AI message generation
```sql
ai_templates (
  id, device_id, name, type, base_template, variations, ai_model,
  ai_prompt, max_variations, is_active, usage_count, metadata,
  created_at, updated_at
)
```
**Key Features**:
- Multiple template types
- AI model configuration
- Usage statistics
- Pre-generated variations storage

### 12. AI History Table
**Purpose**: Logging AI generation activity
```sql
ai_history (
  id, device_id, template_id, original_text, generated_text,
  ai_model, prompt_used, tokens_used, processing_time_ms,
  success, error_message, usage_context, metadata, created_at
)
```
**Key Features**:
- Token usage tracking
- Performance monitoring
- Error logging
- Context tracking

### 13. Webhooks Table
**Purpose**: Webhook configuration per device
```sql
webhooks (
  id, device_id, event_type, url, method, headers, is_active,
  retry_attempts, timeout_seconds, last_triggered, success_count,
  failure_count, metadata, created_at, updated_at
)
```
**Key Features**:
- Multiple event types
- Custom headers support
- Retry configuration
- Success/failure statistics

### 14. Webhook Logs Table
**Purpose**: Logging webhook delivery attempts
```sql
webhook_logs (
  id, webhook_id, event_type, payload, response_status,
  response_body, response_time_ms, success, error_message,
  retry_count, created_at
)
```
**Key Features**:
- Complete request/response logging
- Performance tracking
- Retry attempt logging

### 15. System Logs Table
**Purpose**: System-wide logging dan monitoring
```sql
system_logs (
  id, level, message, context, user_id, device_id, session_id,
  ip_address, user_agent, metadata, created_at
)
```
**Key Features**:
- Multiple log levels
- Context-aware logging
- User activity tracking
- Security monitoring

## Relationships

### Primary Relationships
- `users` → `devices` (1:N)
- `devices` → `sessions` (1:1)
- `devices` → `contacts` (1:N)
- `devices` → `groups` (1:N)
- `devices` → `messages` (1:N)
- `devices` → `auto_replies` (1:N)
- `devices` → `campaigns` (1:N)
- `devices` → `ai_templates` (1:N)
- `devices` → `webhooks` (1:N)

### Secondary Relationships
- `campaigns` → `campaign_targets` (1:N)
- `auto_replies` → `auto_reply_logs` (1:N)
- `ai_templates` → `ai_history` (1:N)
- `webhooks` → `webhook_logs` (1:N)

## Indexes

### Performance Indexes
- User lookup: `idx_users_email`, `idx_users_api_key`
- Device status: `idx_devices_status`, `idx_devices_user_id`
- Session management: `idx_sessions_device_id`, `idx_sessions_status`
- Message queries: `idx_messages_device_id`, `idx_messages_created_at`
- Campaign tracking: `idx_campaigns_status`, `idx_campaigns_scheduled_at`
- Contact search: `idx_contacts_phone_number`, `idx_contacts_device_id`

### Unique Constraints
- `users.email` - Unique email per user
- `users.api_key` - Unique API key
- `devices.user_id + name` - Unique device name per user
- `sessions.device_id` - One session per device
- `contacts.device_id + phone_number` - Unique contact per device
- `groups.device_id + group_id` - Unique group per device

## Storage Considerations

### Large Data Tables
- `messages` - High volume, partitioning by date recommended
- `system_logs` - High volume, regular cleanup needed
- `webhook_logs` - High volume, retention policy needed
- `ai_history` - Moderate volume, archival strategy needed

### JSON Fields
- `devices.settings` - Device configuration
- `sessions.metadata` - Session debugging info
- `campaigns.target_*` - Target lists
- `auto_replies.conditions` - Complex rule conditions
- `ai_templates.variations` - Pre-generated variations
- Various `metadata` fields - Extensible data storage

## Security Features

### Data Protection
- Encrypted auth state storage in `sessions.auth_state`
- Password hashing in `users.password`
- API key security in `users.api_key`
- IP tracking in `system_logs.ip_address`

### Access Control
- User-based device isolation
- Device-based data isolation
- API key authentication
- Session-based access control

## Maintenance

### Regular Cleanup
- Old system logs (> 30 days)
- Webhook logs (> 7 days)
- Completed campaign data (> 90 days)
- AI history (> 30 days)

### Monitoring
- Table sizes and growth rates
- Index usage and performance
- Query performance
- Connection pool usage

## Migration Strategy

### Version Control
- Sequential migration files
- Rollback procedures
- Data integrity checks
- Performance impact assessment

### Deployment
- Blue-green deployment support
- Zero-downtime migrations
- Data validation procedures
- Backup and recovery plans