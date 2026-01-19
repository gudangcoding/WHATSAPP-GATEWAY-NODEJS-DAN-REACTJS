# STEP 8: Auto Reply Engine Design - COMPLETION STATUS

## ✅ COMPLETED COMPONENTS

### 1. Auto Reply Engine Architecture
- **Comprehensive Rule System** - 5 match types (exact, contains, starts_with, ends_with, regex)
- **Multi-Media Replies** - Support for text, image, video, document, audio replies
- **Advanced Conditions** - Time restrictions, cooldown, daily limits, group settings
- **Priority System** - Rule processing based on priority order
- **Real-time Processing** - Immediate response to incoming messages

### 2. Enhanced AutoReplyRepository
- **Complete CRUD Operations** - Create, read, update, delete with advanced querying
- **Rule Management** - Priority updates, status toggling, duplication
- **Advanced Filtering** - Search, device filtering, status filtering
- **Statistics & Analytics** - Performance metrics, trigger counts, success rates
- **Bulk Operations** - Efficient batch processing and updates

### 3. Comprehensive AutoReplyService
- **Business Logic Layer** - Complete auto reply management business logic
- **Rule Validation** - Input validation and security checks
- **Template System** - Predefined templates for common use cases
- **Testing Framework** - Rule testing with sample messages
- **Import/Export** - JSON and CSV import/export functionality

### 4. Complete AutoReplyController
- **Full REST API** - 15+ endpoints covering all auto reply operations
- **Input Validation** - Comprehensive express-validator integration
- **Template Management** - Predefined templates and custom creation
- **Analytics Endpoints** - Statistics, logs, and performance metrics
- **Import/Export API** - Data portability features

### 5. Enhanced AutoReplyJob Processing
- **Multi-Type Processing** - Handle all auto reply job types
- **Advanced Matching** - Sophisticated rule matching algorithm
- **Variable Substitution** - Dynamic content with placeholders
- **Cooldown Management** - Redis-based cooldown system
- **Error Handling** - Comprehensive error classification and retry logic

### 6. Complete API Routes
- **Full Route Implementation** - All 15+ auto reply endpoints with validation
- **Swagger Documentation** - Complete OpenAPI 3.0 documentation
- **Authentication Integration** - JWT-based authentication middleware
- **Request Validation** - Comprehensive input validation and sanitization

## 📋 IMPLEMENTATION DETAILS

### Auto Reply Rule Types

#### 1. Match Types
```javascript
// Exact match
{
  match_type: "exact",
  keywords: "hello,hi,help"
}

// Contains match
{
  match_type: "contains", 
  keywords: "price,cost,berapa"
}

// Starts with match
{
  match_type: "starts_with",
  keywords: "order,pesan,beli"
}

// Ends with match
{
  match_type: "ends_with",
  keywords: "?,.com,thanks"
}

// Regex match
{
  match_type: "regex",
  keywords: "\\b\\d{4}\\b"
}
```

#### 2. Reply Types
```javascript
// Text reply
{
  reply_type: "text",
  reply_text: "Hello {name}! Your message: {message}"
}

// Image reply
{
  reply_type: "image",
  reply_media_url: "https://example.com/image.jpg",
  reply_text: "Check out our latest product!"
}

// Video reply
{
  reply_type: "video",
  reply_media_url: "https://example.com/video.mp4",
  reply_text: "Watch our tutorial video"
}

// Document reply
{
  reply_type: "document",
  reply_media_url: "https://example.com/brochure.pdf",
  reply_text: "Product Brochure"
}

// Audio reply
{
  reply_type: "audio",
  reply_media_url: "https://example.com/voice.mp3"
}
```

### Advanced Features

#### 1. Variable Substitution
```javascript
const variables = {
  '{name}': incomingMessage.pushName || incomingMessage.from_number,
  '{number}': incomingMessage.from_number,
  '{message}': incomingMessage.content,
  '{time}': new Date().toLocaleTimeString(),
  '{date}': new Date().toLocaleDateString(),
  '{datetime}': new Date().toLocaleString()
};

// Template: "Hello {name}! You sent: {message} at {time}"
// Result: "Hello John Doe! You sent: Hello there at 10:30:45 AM"
```

#### 2. Cooldown System
```javascript
// Redis-based cooldown management
const setCooldown = async (deviceId, fromNumber, cooldownMinutes) => {
  const cooldownKey = `cooldown:${deviceId}:${fromNumber}`;
  const cooldownUntil = new Date(Date.now() + (cooldownMinutes * 60 * 1000));
  
  await redis.setex(cooldownKey, cooldownMinutes * 60, cooldownUntil.toISOString());
};

const checkCooldown = async (deviceId, fromNumber) => {
  const cooldownKey = `cooldown:${deviceId}:${fromNumber}`;
  const cooldownUntil = await redis.get(cooldownKey);
  
  if (cooldownUntil && new Date() < new Date(cooldownUntil)) {
    return { allowed: false, cooldownUntil: new Date(cooldownUntil) };
  }
  
  return { allowed: true };
};
```

#### 3. Time Restrictions
```javascript
const isWithinTimeRestrictions = (rule) => {
  if (!rule.time_start || !rule.time_end) {
    return true; // No time restrictions
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const startTime = parseTime(rule.time_start); // Convert "09:00" to minutes
  const endTime = parseTime(rule.time_end);     // Convert "17:00" to minutes
  
  if (startTime <= endTime) {
    // Same day range (e.g., 09:00 - 17:00)
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Overnight range (e.g., 22:00 - 06:00)
    return currentTime >= startTime || currentTime <= endTime;
  }
};
```

#### 4. Priority Processing
```javascript
const processAutoReply = async (deviceId, incomingMessage) => {
  // Get active rules ordered by priority (lower number = higher priority)
  const rules = await autoReplyRepository.getActiveByDeviceId(deviceId);
  
  for (const rule of rules) {
    if (await isRuleMatched(rule, messageContent, incomingMessage)) {
      await sendAutoReply(deviceId, fromNumber, rule, incomingMessage);
      break; // Stop at first match
    }
  }
};
```

### Predefined Templates

#### 1. Welcome Message Template
```javascript
{
  id: 'welcome',
  name: 'Welcome Message',
  match_type: 'contains',
  keywords: 'hello,hi,halo,hai',
  reply_type: 'text',
  reply_text: 'Hello {name}! Welcome to our service. How can I help you today?',
  category: 'greeting'
}
```

#### 2. Business Hours Template
```javascript
{
  id: 'business_hours',
  name: 'Business Hours Info',
  match_type: 'contains',
  keywords: 'hours,open,close,time',
  reply_type: 'text',
  reply_text: 'Our business hours are Monday-Friday 9AM-5PM. We will respond during business hours.',
  time_start: '09:00',
  time_end: '17:00',
  category: 'information'
}
```

#### 3. Away Message Template
```javascript
{
  id: 'away_message',
  name: 'Away Message',
  match_type: 'contains',
  keywords: '*', // Match all messages
  reply_type: 'text',
  reply_text: 'Thank you for your message. I am currently away and will respond as soon as possible.',
  priority: 10, // Low priority (catch-all)
  category: 'status'
}
```

#### 4. Price Inquiry Template
```javascript
{
  id: 'price_inquiry',
  name: 'Price Inquiry',
  match_type: 'contains',
  keywords: 'price,cost,how much,berapa',
  reply_type: 'text',
  reply_text: 'Thank you for your interest! Please visit our website or contact our sales team for pricing information.',
  category: 'sales'
}
```

#### 5. Support Ticket Template
```javascript
{
  id: 'support_ticket',
  name: 'Support Ticket',
  match_type: 'contains',
  keywords: 'help,support,problem,issue',
  reply_type: 'text',
  reply_text: 'I understand you need help. Your support ticket #{datetime} has been created. Our team will assist you shortly.',
  category: 'support'
}
```

### Rule Processing Algorithm

#### 1. Message Processing Flow
```javascript
const processAutoReply = async (data, job) => {
  const { deviceId, incomingMessage, userId } = data;
  
  // 1. Get active auto reply rules for device
  const autoReplies = await autoReplyRepository.getActiveByDeviceId(deviceId);
  
  if (!autoReplies || autoReplies.length === 0) {
    return { success: true, message: 'No active auto replies' };
  }

  const fromNumber = incomingMessage.from_number;
  const messageContent = incomingMessage.content.toLowerCase();
  
  // 2. Check cooldown first
  const cooldownCheck = await checkMessageCooldown(deviceId, fromNumber);
  if (!cooldownCheck.allowed) {
    return { success: true, message: 'Cooldown active' };
  }

  // 3. Find matching auto reply rule (first match wins)
  let matchedRule = null;
  
  for (const rule of autoReplies) {
    if (await isRuleMatched(rule, messageContent, incomingMessage)) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    return { success: true, message: 'No matching rule' };
  }

  // 4. Process the auto reply
  const replyResult = await sendAutoReply(deviceId, fromNumber, matchedRule, incomingMessage);
  
  // 5. Log auto reply execution
  await logAutoReply(deviceId, matchedRule.id, incomingMessage, replyResult);
  
  // 6. Set cooldown
  await setCooldown(deviceId, fromNumber, matchedRule.cooldown_minutes);

  return {
    success: true,
    ruleId: matchedRule.id,
    ruleName: matchedRule.name,
    replyResult
  };
};
```

#### 2. Rule Matching Logic
```javascript
const isRuleMatched = async (rule, messageContent, incomingMessage) => {
  const { match_type, keywords, is_group_enabled } = rule;
  
  // Check if group messages are allowed
  if (incomingMessage.is_group && !is_group_enabled) {
    return false;
  }

  // Check time restrictions
  if (!isWithinTimeRestrictions(rule)) {
    return false;
  }

  // Check daily limits
  if (!await checkDailyLimits(rule, incomingMessage.from_number)) {
    return false;
  }

  // Parse keywords
  const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
  
  switch (match_type) {
    case 'exact':
      return keywordList.includes(messageContent);
    
    case 'contains':
      return keywordList.some(keyword => messageContent.includes(keyword));
    
    case 'starts_with':
      return keywordList.some(keyword => messageContent.startsWith(keyword));
    
    case 'ends_with':
      return keywordList.some(keyword => messageContent.endsWith(keyword));
    
    case 'regex':
      try {
        const regex = new RegExp(keywords, 'i');
        return regex.test(messageContent);
      } catch (error) {
        return false;
      }
    
    default:
      return false;
  }
};
```

### Real-time Socket.IO Events

#### Auto Reply Events
```javascript
// Auto reply rule created
socket.emit('auto_reply:created', {
  autoReply: autoReply,
  timestamp: new Date()
});

// Auto reply rule updated
socket.emit('auto_reply:updated', {
  autoReply: updatedAutoReply,
  timestamp: new Date()
});

// Auto reply rule deleted
socket.emit('auto_reply:deleted', {
  autoReplyId: autoReplyId,
  timestamp: new Date()
});

// Auto reply status changed
socket.emit('auto_reply:status_changed', {
  autoReply: updatedAutoReply,
  timestamp: new Date()
});

// Auto reply executed
socket.emit('auto_reply:executed', {
  ruleId: matchedRule.id,
  ruleName: matchedRule.name,
  fromNumber: fromNumber,
  triggerMessage: incomingMessage.content,
  replyType: matchedRule.reply_type,
  success: true,
  timestamp: new Date()
});

// Auto reply failed
socket.emit('auto_reply:failed', {
  ruleId: ruleId,
  error: error.message,
  timestamp: new Date()
});
```

### API Endpoints Summary

#### Core Auto Reply Management
- `POST /api/v1/auto-replies` - Create auto reply rule
- `GET /api/v1/auto-replies` - Get auto reply rules with filtering
- `GET /api/v1/auto-replies/:id` - Get specific auto reply rule
- `PUT /api/v1/auto-replies/:id` - Update auto reply rule
- `DELETE /api/v1/auto-replies/:id` - Delete auto reply rule

#### Rule Management
- `POST /api/v1/auto-replies/:id/toggle` - Toggle rule status (active/inactive)
- `PUT /api/v1/auto-replies/priorities` - Update rule priorities in bulk
- `POST /api/v1/auto-replies/:id/duplicate` - Duplicate existing rule
- `POST /api/v1/auto-replies/:id/test` - Test rule with sample message

#### Templates & Presets
- `GET /api/v1/auto-replies/templates` - Get predefined templates
- `POST /api/v1/auto-replies/from-template` - Create rule from template

#### Analytics & Logs
- `GET /api/v1/auto-replies/statistics/:deviceId` - Get auto reply statistics
- `GET /api/v1/auto-replies/logs` - Get execution logs with filtering

#### Import/Export
- `GET /api/v1/auto-replies/export/:deviceId` - Export rules (JSON/CSV)
- `POST /api/v1/auto-replies/import/:deviceId` - Import rules from file

### Database Schema Integration

#### Auto Replies Table Structure
```sql
CREATE TABLE auto_replies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  match_type ENUM('exact', 'contains', 'starts_with', 'ends_with', 'regex') NOT NULL,
  keywords TEXT NOT NULL,
  reply_type ENUM('text', 'image', 'video', 'document', 'audio') NOT NULL,
  reply_text TEXT,
  reply_media_url VARCHAR(500),
  reply_media_type ENUM('image', 'video', 'document', 'audio'),
  is_active BOOLEAN DEFAULT TRUE,
  priority INT DEFAULT 1,
  cooldown_minutes INT DEFAULT 0,
  max_daily_replies INT DEFAULT 0,
  is_group_enabled BOOLEAN DEFAULT FALSE,
  time_start TIME,
  time_end TIME,
  delay_seconds INT DEFAULT 0,
  conditions JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_device_active (device_id, is_active),
  INDEX idx_priority (priority),
  INDEX idx_match_type (match_type)
);
```

#### Auto Reply Logs Table Structure
```sql
CREATE TABLE auto_reply_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auto_reply_id INT NOT NULL,
  device_id INT NOT NULL,
  trigger_message_id INT,
  from_number VARCHAR(20) NOT NULL,
  trigger_text TEXT NOT NULL,
  reply_sent BOOLEAN DEFAULT FALSE,
  reply_job_id VARCHAR(100),
  cooldown_active BOOLEAN DEFAULT FALSE,
  daily_limit_reached BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (auto_reply_id) REFERENCES auto_replies(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (trigger_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  
  INDEX idx_auto_reply_id (auto_reply_id),
  INDEX idx_device_date (device_id, executed_at),
  INDEX idx_from_number (from_number)
);
```

## 🔄 INTEGRATION POINTS

### 1. Session Manager Integration
- **Incoming Message Processing** - Automatic processing of incoming messages
- **Device Status Validation** - Ensure device is connected before processing
- **Real-time Message Handling** - Immediate response to new messages

### 2. Message Queue Integration
- **Auto Reply Jobs** - Background processing of auto reply logic
- **Message Sending** - Integration with message sending system
- **Priority Handling** - High priority for auto reply messages

### 3. Socket.IO Integration
- **Real-time Events** - Live auto reply rule management and execution updates
- **Status Broadcasting** - Rule status changes and execution results
- **Error Notifications** - Immediate error reporting to clients

### 4. Contact System Integration
- **Contact Recognition** - Enhanced auto replies based on contact information
- **Personalization** - Use contact names and data in replies
- **Contact Segmentation** - Different rules for different contact types

### 5. Campaign System Integration (Ready for STEP 9)
- **Template Sharing** - Auto reply templates can be used in campaigns
- **Rule-based Targeting** - Campaign targeting based on auto reply interactions
- **Response Tracking** - Track campaign responses through auto reply logs

## 📊 ANALYTICS & MONITORING

### Auto Reply Analytics
- **Rule Performance** - Success rates, trigger counts, response times
- **Message Distribution** - Auto reply usage patterns by time and type
- **User Engagement** - Response rates and interaction patterns
- **Error Analysis** - Common failure patterns and resolution

### Performance Metrics
- **Processing Speed** - Average auto reply processing time
- **Queue Performance** - Auto reply job queue depth and processing rate
- **Resource Usage** - Memory and CPU utilization during processing
- **Throughput Analysis** - Auto replies per minute/hour capacity

### Business Intelligence
- **Customer Service Automation** - Auto reply effectiveness in customer support
- **Lead Qualification** - Auto reply performance in lead generation
- **Engagement Optimization** - Best performing auto reply strategies
- **Cost Analysis** - Resource usage and optimization opportunities

## 🔒 SECURITY & PRIVACY

### Auto Reply Security
- **Input Validation** - Comprehensive validation of rule data and triggers
- **Content Filtering** - Prevention of malicious content in replies
- **Access Control** - User-device isolation and permission checks
- **Rate Limiting** - Prevention of auto reply spam and abuse

### Privacy Protection
- **Data Minimization** - Only store necessary auto reply data
- **Content Security** - Secure handling of reply content and media
- **User Consent** - Respect recipient preferences and opt-out requests
- **Audit Logging** - Complete audit trail of auto reply activities

### Performance Security
- **Resource Limits** - Prevent resource exhaustion from auto reply processing
- **Queue Protection** - Rate limiting and queue depth monitoring
- **Error Handling** - Secure error handling without information leakage
- **Monitoring** - Real-time monitoring for suspicious auto reply patterns

## ✅ STEP 8 COMPLETION CHECKLIST

### Backend Components
- [x] Auto reply engine architecture design
- [x] Enhanced AutoReplyRepository with full CRUD operations
- [x] Comprehensive AutoReplyService business logic
- [x] Complete AutoReplyController with full API
- [x] Enhanced AutoReplyJob processing system
- [x] Complete auto reply API routes with validation
- [x] Swagger documentation for all endpoints
- [x] Database schema updates and migrations
- [x] Real-time Socket.IO integration
- [x] Predefined templates system
- [x] Rule testing and validation framework
- [x] Import/export functionality
- [x] Statistics and analytics system
- [x] Advanced features (cooldown, time restrictions, priorities)
- [x] Variable substitution system
- [x] Error handling and logging
- [x] Performance optimizations
- [x] Security measures and input validation
- [x] Integration with existing systems

### Frontend Components
- [x] AutoReplyCard component with detailed view modal
- [x] CreateAutoReplyModal with multi-step form and file upload
- [x] AutoReplyList component with filtering and pagination
- [x] AutoReplyPage with dashboard stats and activity feed
- [x] Socket.IO integration for real-time updates
- [x] RBAC integration with permission checking
- [x] API integration with comprehensive error handling
- [x] Responsive design for mobile and desktop
- [x] App.js routing integration

## 🎯 READY FOR NEXT STEPS

STEP 8 is now **COMPLETE** with full auto reply engine functionality, comprehensive rule management, and seamless integration with existing systems. The system is ready to proceed to:

**STEP 9: Campaign/Blast System Design**
- Mass message campaigns with targeting
- Scheduled campaign execution
- Campaign analytics and tracking
- Template-based campaign creation
- Contact segmentation and filtering

All auto reply infrastructure, rule processing, and template systems are in place to support advanced campaign functionality in the next step.

---

**Total Files Created/Modified in STEP 8:**

### Backend Files
- `docs/AUTO_REPLY_ENGINE_DESIGN.md` (new)
- `src/repositories/AutoReplyRepository.js` (complete implementation)
- `src/services/AutoReplyService.js` (complete implementation)
- `src/controllers/AutoReplyController.js` (complete implementation)
- `src/routes/api/v1/autoReply.js` (complete implementation)
- `src/jobs/AutoReplyJob.js` (enhanced existing)
- `database/migrations/007_create_auto_replies_table.sql` (updated schema)
- `database/migrations/008_create_auto_reply_logs_table.sql` (updated schema)

### Frontend Files
- `frontend/src/components/auto-reply/AutoReplyCard.js` (complete implementation)
- `frontend/src/components/auto-reply/CreateAutoReplyModal.js` (complete implementation)
- `frontend/src/components/auto-reply/AutoReplyList.js` (new - complete implementation)
- `frontend/src/pages/user/AutoReplyPage.js` (new - complete implementation)
- `frontend/src/App.js` (updated routing)

**Status: ✅ STEP 8 COMPLETED - Auto Reply Management Fully Implemented**