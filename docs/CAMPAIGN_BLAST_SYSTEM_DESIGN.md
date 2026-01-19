# Campaign/Blast System Design

## Overview

The Campaign/Blast System is a comprehensive mass messaging solution designed for WhatsApp Gateway SaaS platform. It enables users to create, manage, and execute targeted message campaigns with advanced scheduling, personalization, and analytics capabilities.

## Architecture

### Core Components

1. **Campaign Management Layer**
   - Campaign creation and configuration
   - Target audience selection and filtering
   - Message template and content management
   - Scheduling and recurring campaign setup

2. **Target Processing Engine**
   - Contact-based targeting
   - Group-based targeting
   - Custom number lists
   - Advanced filtering and segmentation
   - Duplicate detection and removal

3. **Message Delivery System**
   - Batch processing with configurable delays
   - Rate limiting and throttling
   - Retry mechanism for failed deliveries
   - Real-time progress tracking

4. **Analytics and Reporting**
   - Campaign performance metrics
   - Delivery statistics and success rates
   - Target engagement analytics
   - Export capabilities for reporting

## Database Schema

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  message_type ENUM('text', 'image', 'video', 'document', 'audio', 'location', 'contact', 'list') NOT NULL,
  message_content JSON NOT NULL,
  media_url VARCHAR(500),
  media_type ENUM('image', 'video', 'document', 'audio'),
  target_type ENUM('contacts', 'groups', 'numbers', 'mixed', 'filtered') NOT NULL,
  target_filters JSON,
  schedule_type ENUM('immediate', 'scheduled', 'recurring') DEFAULT 'immediate',
  scheduled_at TIMESTAMP NULL,
  recurring_pattern JSON,
  delay_min INT DEFAULT 1,
  delay_max INT DEFAULT 5,
  randomize_delay BOOLEAN DEFAULT TRUE,
  ai_variation BOOLEAN DEFAULT FALSE,
  status ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'failed') DEFAULT 'draft',
  total_targets INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Campaign Targets Table
```sql
CREATE TABLE campaign_targets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  campaign_id INT NOT NULL,
  target_number VARCHAR(20) NOT NULL,
  target_name VARCHAR(255),
  target_type ENUM('contact', 'group', 'number') NOT NULL,
  status ENUM('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped') DEFAULT 'queued',
  message_id VARCHAR(255),
  job_id VARCHAR(100),
  sending_at TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE KEY unique_campaign_target (campaign_id, target_number)
);
```

## Campaign Types

### 1. Target Types

#### Contacts-based Campaigns
- Target existing contacts from device contact list
- Filter by contact attributes (name, quality score, last activity)
- Support for contact groups and labels

#### Groups-based Campaigns
- Target WhatsApp groups where device is member
- Filter by group size, activity level, creation date
- Respect group messaging permissions

#### Numbers-based Campaigns
- Target custom list of phone numbers
- Support for CSV import and manual entry
- Automatic phone number validation and formatting

#### Mixed Campaigns
- Combine multiple target types in single campaign
- Unified targeting with different source types
- Advanced deduplication across sources

#### Filtered Campaigns
- Advanced filtering based on multiple criteria
- Custom query building for complex targeting
- Dynamic target generation based on conditions

### 2. Message Types

#### Text Messages
```javascript
{
  message_type: "text",
  message_content: {
    text: "Hello {name}! Check out our latest offer: {offer_details}"
  }
}
```

#### Image Messages
```javascript
{
  message_type: "image",
  message_content: {
    image: { url: "https://example.com/image.jpg" },
    caption: "New product launch! {product_name} - {price}"
  },
  media_url: "https://example.com/image.jpg",
  media_type: "image"
}
```

#### Video Messages
```javascript
{
  message_type: "video",
  message_content: {
    video: { url: "https://example.com/video.mp4" },
    caption: "Watch our latest tutorial video!"
  },
  media_url: "https://example.com/video.mp4",
  media_type: "video"
}
```

#### Document Messages
```javascript
{
  message_type: "document",
  message_content: {
    document: { url: "https://example.com/brochure.pdf" },
    fileName: "Product_Brochure.pdf",
    caption: "Download our complete product catalog"
  },
  media_url: "https://example.com/brochure.pdf",
  media_type: "document"
}
```

#### Audio Messages
```javascript
{
  message_type: "audio",
  message_content: {
    audio: { url: "https://example.com/voice.mp3" }
  },
  media_url: "https://example.com/voice.mp3",
  media_type: "audio"
}
```

#### Location Messages
```javascript
{
  message_type: "location",
  message_content: {
    location: {
      degreesLatitude: -6.2088,
      degreesLongitude: 106.8456,
      name: "Our Store Location",
      address: "Jakarta, Indonesia"
    }
  }
}
```

#### Contact Messages
```javascript
{
  message_type: "contact",
  message_content: {
    contacts: {
      displayName: "Customer Service",
      contacts: [{
        name: { formattedName: "Customer Service" },
        phoneNumbers: [{ phoneNumber: "+62812345678" }]
      }]
    }
  }
}
```

#### List Messages
```javascript
{
  message_type: "list",
  message_content: {
    text: "Choose from our services:",
    buttonText: "View Services",
    sections: [{
      title: "Our Services",
      rows: [
        { id: "service1", title: "Web Development", description: "Custom websites" },
        { id: "service2", title: "Mobile Apps", description: "iOS and Android apps" }
      ]
    }]
  }
}
```

### 3. Schedule Types

#### Immediate Campaigns
- Execute campaign immediately upon start
- Real-time processing and delivery
- Instant feedback and progress tracking

#### Scheduled Campaigns
- Schedule campaign for future execution
- Support for timezone-aware scheduling
- Automatic execution at specified time

#### Recurring Campaigns
- Automated recurring campaign execution
- Support for daily, weekly, monthly patterns
- Flexible recurring configuration

```javascript
// Daily recurring pattern
{
  frequency: "daily",
  interval: 1,
  end_date: "2024-12-31"
}

// Weekly recurring pattern
{
  frequency: "weekly",
  interval: 2,
  days_of_week: [1, 3, 5], // Monday, Wednesday, Friday
  end_date: "2024-12-31"
}

// Monthly recurring pattern
{
  frequency: "monthly",
  interval: 1,
  day_of_month: 15,
  end_date: "2024-12-31"
}
```

## Campaign Processing Flow

### 1. Campaign Creation
```javascript
const campaign = await campaignService.createCampaign(userId, {
  device_id: 1,
  name: "Product Launch Campaign",
  description: "Announce new product to customers",
  message_type: "image",
  message_content: {
    image: { url: "https://example.com/product.jpg" },
    caption: "🎉 New Product: {product_name}! Special price: {price}"
  },
  target_type: "contacts",
  target_filters: {
    quality_score_min: 7,
    last_activity_days: 30
  },
  delay_min: 2,
  delay_max: 8,
  randomize_delay: true,
  status: "draft"
});
```

### 2. Target Generation
```javascript
// Generate campaign targets based on filters
const targetCount = await campaignService.generateCampaignTargets(campaignId, campaignData);

// Target generation process:
// 1. Apply target type filters (contacts/groups/numbers)
// 2. Apply additional filters (quality score, activity, etc.)
// 3. Remove duplicates
// 4. Validate phone numbers
// 5. Create campaign_targets records
// 6. Update campaign total_targets count
```

### 3. Campaign Execution
```javascript
// Start campaign execution
await campaignService.startCampaign(userId, campaignId);

// Execution flow:
// 1. Validate campaign and device status
// 2. Check device connection
// 3. Update campaign status to 'running'
// 4. Add campaign job to queue
// 5. Process targets in batches
// 6. Send individual messages with delays
// 7. Track delivery status and progress
// 8. Update campaign completion status
```

### 4. Batch Processing
```javascript
// Process campaign in configurable batches
const config = {
  batchSize: 50,           // Process 50 targets per batch
  maxConcurrent: 5,        // Max 5 concurrent message jobs
  progressUpdateInterval: 10, // Update progress every 10 targets
  retryDelay: 30000,       // 30 seconds retry delay
  maxRetries: 3            // Max 3 retry attempts
};

// Batch processing flow:
// 1. Get next batch of queued targets
// 2. Process batch with concurrent message jobs
// 3. Apply configured delays between messages
// 4. Update progress and emit real-time events
// 5. Handle failures and schedule retries
// 6. Continue until all targets processed
```

## Variable Substitution System

### Available Variables
```javascript
const variables = {
  '{name}': target.target_name || target.target_number,
  '{number}': target.target_number,
  '{time}': new Date().toLocaleTimeString(),
  '{date}': new Date().toLocaleDateString(),
  '{datetime}': new Date().toLocaleString(),
  '{campaign_name}': campaign.name,
  '{device_name}': device.name
};
```

### Variable Processing
```javascript
const processMessageContent = (content, target, campaign) => {
  let processedContent = JSON.parse(JSON.stringify(content));
  
  // Process text content
  if (processedContent.text) {
    processedContent.text = replaceVariables(processedContent.text, variables);
  }
  
  // Process caption
  if (processedContent.caption) {
    processedContent.caption = replaceVariables(processedContent.caption, variables);
  }
  
  return processedContent;
};

const replaceVariables = (text, variables) => {
  let result = text;
  
  for (const [variable, value] of Object.entries(variables)) {
    const regex = new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  }
  
  return result;
};
```

## Campaign Templates

### 1. Product Announcement Template
```javascript
{
  id: 'product_announcement',
  name: 'Product Announcement',
  description: 'Announce new products to customers',
  message_type: 'image',
  message_content: {
    image: { url: 'https://example.com/product.jpg' },
    caption: '🎉 New Product Alert! Check out our latest {product_name}. Special launch price: {price}. Order now!'
  },
  target_type: 'contacts',
  category: 'marketing'
}
```

### 2. Promotional Offer Template
```javascript
{
  id: 'promotional_offer',
  name: 'Promotional Offer',
  description: 'Send promotional offers to customers',
  message_type: 'text',
  message_content: {
    text: '🔥 Special Offer for {name}! Get {discount}% off on all items. Use code: {promo_code}. Valid until {expiry_date}.'
  },
  target_type: 'filtered',
  category: 'promotion'
}
```

### 3. Event Invitation Template
```javascript
{
  id: 'event_invitation',
  name: 'Event Invitation',
  description: 'Invite customers to events',
  message_type: 'text',
  message_content: {
    text: '📅 You\'re invited to {event_name}! Date: {event_date}, Time: {event_time}, Venue: {venue}. RSVP: {rsvp_link}'
  },
  target_type: 'contacts',
  category: 'event'
}
```

### 4. Order Confirmation Template
```javascript
{
  id: 'order_confirmation',
  name: 'Order Confirmation',
  description: 'Confirm customer orders',
  message_type: 'text',
  message_content: {
    text: '✅ Order Confirmed! Hi {name}, your order #{order_id} has been confirmed. Total: {total_amount}. Estimated delivery: {delivery_date}.'
  },
  target_type: 'numbers',
  category: 'transactional'
}
```

### 5. Survey & Feedback Template
```javascript
{
  id: 'survey_feedback',
  name: 'Survey & Feedback',
  description: 'Collect customer feedback',
  message_type: 'text',
  message_content: {
    text: '📝 We value your opinion! Please take 2 minutes to rate your experience: {survey_link}. Thank you!'
  },
  target_type: 'contacts',
  category: 'feedback'
}
```

### 6. Appointment Reminder Template
```javascript
{
  id: 'appointment_reminder',
  name: 'Appointment Reminder',
  description: 'Remind customers about appointments',
  message_type: 'text',
  message_content: {
    text: '⏰ Appointment Reminder: Hi {name}, this is a reminder for your appointment on {date} at {time}. Location: {location}.'
  },
  target_type: 'numbers',
  category: 'reminder'
}
```

## Real-time Events

### Campaign Events
```javascript
// Campaign created
socket.emit('campaign:created', {
  campaign: campaign,
  timestamp: new Date()
});

// Campaign started
socket.emit('campaign:started', {
  campaignId: campaignId,
  timestamp: new Date()
});

// Campaign progress update
socket.emit('campaign:progress', {
  campaignId: campaignId,
  processed: processedCount,
  total: campaign.total_targets,
  percentage: progress,
  statistics: currentStats,
  timestamp: new Date()
});

// Campaign completed
socket.emit('campaign:completed', {
  campaignId: campaignId,
  statistics: finalStats,
  timestamp: new Date()
});

// Campaign paused
socket.emit('campaign:paused', {
  campaignId: campaignId,
  timestamp: new Date()
});

// Campaign stopped
socket.emit('campaign:stopped', {
  campaignId: campaignId,
  timestamp: new Date()
});

// Campaign failed
socket.emit('campaign:failed', {
  campaignId: campaignId,
  error: error.message,
  timestamp: new Date()
});
```

## API Endpoints

### Core Campaign Management
- `POST /api/v1/campaigns` - Create campaign
- `GET /api/v1/campaigns` - Get campaigns with filtering and pagination
- `GET /api/v1/campaigns/:campaignId` - Get specific campaign
- `PUT /api/v1/campaigns/:campaignId` - Update campaign
- `DELETE /api/v1/campaigns/:campaignId` - Delete campaign

### Campaign Control
- `POST /api/v1/campaigns/:campaignId/start` - Start campaign execution
- `POST /api/v1/campaigns/:campaignId/stop` - Stop campaign execution
- `POST /api/v1/campaigns/:campaignId/pause` - Pause campaign execution
- `POST /api/v1/campaigns/:campaignId/resume` - Resume paused campaign
- `POST /api/v1/campaigns/:campaignId/schedule` - Schedule campaign for future execution

### Campaign Management
- `POST /api/v1/campaigns/:campaignId/duplicate` - Duplicate existing campaign
- `GET /api/v1/campaigns/statistics/:deviceId` - Get campaign statistics
- `GET /api/v1/campaigns/:campaignId/targets` - Get campaign targets with filtering

### Templates & Tools
- `GET /api/v1/campaigns/templates` - Get predefined campaign templates
- `POST /api/v1/campaigns/from-template` - Create campaign from template
- `POST /api/v1/campaigns/preview-targets` - Preview campaign targets before creation

### Analytics & Export
- `GET /api/v1/campaigns/:campaignId/export` - Export campaign results (JSON/CSV)
- `GET /api/v1/campaigns/dashboard/:deviceId` - Get campaign dashboard data

## Campaign Analytics

### Performance Metrics
```javascript
// Overall campaign statistics
{
  total_campaigns: 150,
  completed_campaigns: 120,
  running_campaigns: 5,
  scheduled_campaigns: 10,
  failed_campaigns: 15,
  total_targets: 50000,
  total_sent: 48500,
  total_delivered: 46200,
  total_failed: 2300,
  avg_success_rate: 95.2
}

// Campaign type breakdown
{
  by_type: [
    {
      message_type: "text",
      count: 80,
      total_targets: 25000,
      sent_count: 24500,
      success_rate: 98.0
    },
    {
      message_type: "image",
      count: 45,
      total_targets: 18000,
      sent_count: 17200,
      success_rate: 95.6
    }
  ]
}

// Daily campaign activity
{
  daily_activity: [
    {
      date: "2024-01-15",
      campaigns_created: 8,
      targets_added: 2500,
      messages_sent: 2400
    }
  ]
}
```

### Target Performance Analytics
```javascript
// Target delivery timeline
{
  delivery_timeline: [
    {
      hour: "2024-01-15 10:00:00",
      sent_count: 150,
      delivered_count: 145,
      failed_count: 5
    }
  ]
}

// Performance by target type
{
  performance_by_type: [
    {
      target_type: "contact",
      total_count: 1000,
      sent_count: 980,
      delivered_count: 950,
      failed_count: 30,
      success_rate: 98.0
    },
    {
      target_type: "group",
      total_count: 50,
      sent_count: 48,
      delivered_count: 45,
      failed_count: 3,
      success_rate: 96.0
    }
  ]
}
```

## Advanced Features

### 1. AI Message Variation
```javascript
// Enable AI-powered message variations
{
  ai_variation: true,
  message_content: {
    text: "Hello {name}! Check out our new product."
  }
}

// AI generates variations like:
// "Hi {name}! Take a look at our latest product."
// "Hey {name}! Don't miss our new product launch."
// "Hello {name}! We have something new for you."
```

### 2. Smart Delay Management
```javascript
// Randomized delays to avoid spam detection
{
  delay_min: 2,        // Minimum 2 seconds
  delay_max: 8,        // Maximum 8 seconds
  randomize_delay: true // Random delay between min and max
}

// Calculated delay for each message
const calculateMessageDelay = (campaign) => {
  const minDelay = (campaign.delay_min || 1) * 1000;
  const maxDelay = (campaign.delay_max || 5) * 1000;
  
  if (campaign.randomize_delay) {
    return minDelay + Math.random() * (maxDelay - minDelay);
  }
  
  return minDelay;
};
```

### 3. Retry Mechanism
```javascript
// Automatic retry for failed targets
const retryFailedTargets = async (campaignId) => {
  const failedTargets = await campaignTargetRepository.getFailedTargetsForRetry(
    campaignId, 
    maxRetries
  );

  for (const target of failedTargets) {
    await campaignTargetRepository.updateStatus(target.id, 'queued');
    await campaignTargetRepository.incrementRetryCount(target.id);
  }

  // Reprocess failed targets
  await processBatch(campaign, failedTargets, job);
};
```

### 4. Duplicate Detection
```javascript
// Remove duplicate targets across different sources
const removeDuplicateTargets = (targets) => {
  const seen = new Set();
  return targets.filter(target => {
    const key = `${target.campaign_id}_${target.target_number}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};
```

### 5. Phone Number Normalization
```javascript
// Normalize phone numbers to international format
const normalizePhoneNumber = (phoneNumber) => {
  // Remove non-digit characters
  let normalized = phoneNumber.replace(/\D/g, '');
  
  // Add country code if missing (assuming Indonesia +62)
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  } else if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  
  return normalized;
};
```

## Security & Compliance

### Rate Limiting
- Configurable message sending rates per device
- Automatic throttling based on WhatsApp limits
- Queue depth monitoring and management

### Content Validation
- Message content sanitization
- Media URL validation and security checks
- Spam detection and prevention

### Privacy Protection
- Target data encryption at rest
- Secure handling of personal information
- GDPR compliance features

### Access Control
- User-device isolation
- Campaign ownership validation
- Permission-based access control

## Performance Optimization

### Database Optimization
- Indexed queries for fast campaign retrieval
- Efficient target processing with batch operations
- Optimized statistics calculations

### Memory Management
- Streaming target processing for large campaigns
- Efficient JSON handling for message content
- Garbage collection optimization

### Queue Management
- Priority-based job processing
- Dead letter queue for failed jobs
- Queue depth monitoring and alerts

## Integration Points

### Session Manager Integration
- Device connection validation before campaign start
- Real-time session status monitoring
- Automatic campaign pause on device disconnect

### Message Queue Integration
- Campaign job scheduling and processing
- Message job creation and management
- Priority handling for campaign messages

### Contact System Integration
- Contact-based targeting and filtering
- Contact quality score utilization
- Contact activity tracking integration

### Auto Reply Integration
- Campaign message exclusion from auto replies
- Template sharing between systems
- Unified message processing pipeline

## Error Handling

### Campaign Errors
```javascript
// Campaign validation errors
{
  error: "VALIDATION_ERROR",
  message: "Campaign validation failed",
  details: [
    "Device ID is required",
    "Message content is required",
    "Invalid target type"
  ]
}

// Device connection errors
{
  error: "DEVICE_DISCONNECTED",
  message: "Device session is not connected",
  campaignId: 123,
  deviceId: 456
}

// Target generation errors
{
  error: "TARGET_GENERATION_FAILED",
  message: "No valid targets found for campaign",
  campaignId: 123,
  targetType: "contacts",
  filters: { quality_score_min: 8 }
}
```

### Recovery Mechanisms
- Automatic retry for transient failures
- Campaign pause on critical errors
- Detailed error logging and reporting
- Manual intervention capabilities

## Monitoring & Alerting

### Campaign Monitoring
- Real-time campaign progress tracking
- Performance metrics collection
- Error rate monitoring and alerting

### System Health
- Queue depth and processing rate monitoring
- Database performance tracking
- Memory and CPU utilization monitoring

### Business Metrics
- Campaign success rate tracking
- Customer engagement analytics
- ROI calculation and reporting

## Future Enhancements

### Advanced Targeting
- Machine learning-based target optimization
- Behavioral targeting based on message history
- Predictive analytics for campaign success

### Enhanced Personalization
- Dynamic content generation
- A/B testing for message variations
- Personalization based on contact attributes

### Advanced Analytics
- Campaign attribution tracking
- Customer journey mapping
- Conversion tracking and ROI analysis

### Integration Capabilities
- CRM system integration
- E-commerce platform integration
- Marketing automation platform integration

---

This comprehensive Campaign/Blast System provides a robust foundation for mass messaging campaigns with advanced targeting, scheduling, and analytics capabilities. The system is designed to be scalable, secure, and user-friendly while maintaining high performance and reliability.