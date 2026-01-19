const Joi = require('joi');
const logger = require('../utils/logger');

class ValidationMiddleware {
    /**
     * Generic validation middleware
     */
    validate(schema, property = 'body') {
        return (req, res, next) => {
            try {
                const { error, value } = schema.validate(req[property], {
                    abortEarly: false,
                    stripUnknown: true,
                    convert: true
                });

                if (error) {
                    const errors = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value
                    }));

                    return res.status(400).json({
                        success: false,
                        message: 'Validation failed',
                        error: 'Invalid input data',
                        code: 'VALIDATION_ERROR',
                        timestamp: new Date().toISOString(),
                        details: errors
                    });
                }

                // Replace request data with validated and sanitized data
                req[property] = value;
                next();

            } catch (validationError) {
                logger.error('ValidationMiddleware: Validation error:', validationError);
                res.status(500).json({
                    success: false,
                    message: 'Validation processing failed',
                    error: validationError.message,
                    code: 'VALIDATION_PROCESSING_ERROR',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * User registration validation
     */
    validateRegister() {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                }),
            password: Joi.string()
                .min(8)
                .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'any.required': 'Password is required'
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Name must be at least 2 characters long',
                    'string.max': 'Name cannot exceed 100 characters',
                    'any.required': 'Name is required'
                }),
            phone: Joi.string()
                .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
                .optional()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                })
        });

        return this.validate(schema);
    }

    /**
     * User login validation
     */
    validateLogin() {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                }),
            password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Password is required'
                }),
            remember_me: Joi.boolean()
                .optional()
                .default(false)
        });

        return this.validate(schema);
    }

    /**
     * Profile update validation
     */
    validateProfile() {
        const schema = Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Name must be at least 2 characters long',
                    'string.max': 'Name cannot exceed 100 characters'
                }),
            phone: Joi.string()
                .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
                .optional()
                .allow('')
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number'
                })
        });

        return this.validate(schema);
    }

    /**
     * Email validation
     */
    validateEmail() {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required'
                })
        });

        return this.validate(schema);
    }

    /**
     * Password reset validation
     */
    validateResetPassword() {
        const schema = Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Reset token is required'
                }),
            password: Joi.string()
                .min(8)
                .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
                .required()
                .messages({
                    'string.min': 'Password must be at least 8 characters long',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'any.required': 'Password is required'
                })
        });

        return this.validate(schema);
    }

    /**
     * Change password validation
     */
    validateChangePassword() {
        const schema = Joi.object({
            current_password: Joi.string()
                .required()
                .messages({
                    'any.required': 'Current password is required'
                }),
            new_password: Joi.string()
                .min(8)
                .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
                .required()
                .messages({
                    'string.min': 'New password must be at least 8 characters long',
                    'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    'any.required': 'New password is required'
                })
        });

        return this.validate(schema);
    }

    /**
     * Verification code validation
     */
    validateVerificationCode() {
        const schema = Joi.object({
            token: Joi.string()
                .required()
                .messages({
                    'any.required': 'Verification token is required'
                })
        });

        return this.validate(schema);
    }

    /**
     * 2FA code validation
     */
    validate2FACode() {
        const schema = Joi.object({
            code: Joi.string()
                .length(6)
                .pattern(/^\d{6}$/)
                .required()
                .messages({
                    'string.length': '2FA code must be 6 digits',
                    'string.pattern.base': '2FA code must contain only numbers',
                    'any.required': '2FA code is required'
                })
        });

        return this.validate(schema);
    }

    /**
     * Device validation
     */
    validateDevice() {
        const schema = Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Device name must be at least 2 characters long',
                    'string.max': 'Device name cannot exceed 100 characters',
                    'any.required': 'Device name is required'
                }),
            phone_number: Joi.string()
                .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
                .required()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number',
                    'any.required': 'Phone number is required'
                }),
            webhook_url: Joi.string()
                .uri()
                .optional()
                .allow('')
                .messages({
                    'string.uri': 'Please provide a valid webhook URL'
                }),
            settings: Joi.object()
                .optional()
                .default({})
        });

        return this.validate(schema);
    }

    /**
     * Device config validation
     */
    validateDeviceConfig() {
        const schema = Joi.object({
            auto_reply_enabled: Joi.boolean().optional(),
            webhook_events: Joi.array().items(Joi.string()).optional(),
            message_delay: Joi.number().min(0).max(60000).optional(),
            max_retries: Joi.number().min(0).max(10).optional(),
            timeout: Joi.number().min(5000).max(300000).optional()
        });

        return this.validate(schema);
    }

    /**
     * Session validation
     */
    validateSession() {
        const schema = Joi.object({
            device_id: Joi.string()
                .required()
                .messages({
                    'any.required': 'Device ID is required'
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .optional()
                .messages({
                    'string.min': 'Session name must be at least 2 characters long',
                    'string.max': 'Session name cannot exceed 100 characters'
                }),
            settings: Joi.object()
                .optional()
                .default({})
        });

        return this.validate(schema);
    }

    /**
     * Send message validation
     */
    validateSendMessage() {
        const schema = Joi.object({
            device_id: Joi.string()
                .required()
                .messages({
                    'any.required': 'Device ID is required'
                }),
            to: Joi.string()
                .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
                .required()
                .messages({
                    'string.pattern.base': 'Please provide a valid recipient phone number',
                    'any.required': 'Recipient phone number is required'
                }),
            message_type: Joi.string()
                .valid('text', 'image', 'video', 'audio', 'document', 'location', 'contact')
                .required()
                .messages({
                    'any.only': 'Message type must be one of: text, image, video, audio, document, location, contact',
                    'any.required': 'Message type is required'
                }),
            content: Joi.object()
                .required()
                .messages({
                    'any.required': 'Message content is required'
                }),
            schedule_at: Joi.date()
                .iso()
                .min('now')
                .optional()
                .messages({
                    'date.min': 'Scheduled time must be in the future'
                }),
            priority: Joi.string()
                .valid('low', 'normal', 'high')
                .optional()
                .default('normal')
        });

        return this.validate(schema);
    }

    /**
     * Webhook validation
     */
    validateWebhook() {
        const schema = Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Webhook name must be at least 2 characters long',
                    'string.max': 'Webhook name cannot exceed 100 characters',
                    'any.required': 'Webhook name is required'
                }),
            url: Joi.string()
                .uri()
                .required()
                .messages({
                    'string.uri': 'Please provide a valid webhook URL',
                    'any.required': 'Webhook URL is required'
                }),
            events: Joi.array()
                .items(Joi.string())
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one event must be selected',
                    'any.required': 'Events are required'
                }),
            secret: Joi.string()
                .min(8)
                .optional()
                .messages({
                    'string.min': 'Secret must be at least 8 characters long'
                }),
            headers: Joi.object()
                .optional()
                .default({}),
            retry_attempts: Joi.number()
                .min(0)
                .max(10)
                .optional()
                .default(3),
            timeout: Joi.number()
                .min(1000)
                .max(300000)
                .optional()
                .default(30000),
            description: Joi.string()
                .max(500)
                .optional()
                .allow('')
        });

        return this.validate(schema);
    }

    /**
     * Campaign validation
     */
    validateCampaign() {
        const schema = Joi.object({
            device_id: Joi.string()
                .required()
                .messages({
                    'any.required': 'Device ID is required'
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Campaign name must be at least 2 characters long',
                    'string.max': 'Campaign name cannot exceed 100 characters',
                    'any.required': 'Campaign name is required'
                }),
            description: Joi.string()
                .max(500)
                .optional()
                .allow(''),
            message_content: Joi.object()
                .required()
                .messages({
                    'any.required': 'Message content is required'
                }),
            target_type: Joi.string()
                .valid('all_contacts', 'contact_groups', 'custom_list', 'filtered_contacts')
                .required()
                .messages({
                    'any.only': 'Target type must be one of: all_contacts, contact_groups, custom_list, filtered_contacts',
                    'any.required': 'Target type is required'
                }),
            target_filters: Joi.object()
                .optional()
                .default({}),
            schedule_type: Joi.string()
                .valid('immediate', 'scheduled', 'recurring')
                .optional()
                .default('immediate'),
            scheduled_at: Joi.date()
                .iso()
                .min('now')
                .when('schedule_type', {
                    is: 'scheduled',
                    then: Joi.required(),
                    otherwise: Joi.optional()
                })
                .messages({
                    'date.min': 'Scheduled time must be in the future',
                    'any.required': 'Scheduled time is required for scheduled campaigns'
                })
        });

        return this.validate(schema);
    }

    /**
     * Auto-reply rule validation
     */
    validateAutoReplyRule() {
        const schema = Joi.object({
            device_id: Joi.string()
                .required()
                .messages({
                    'any.required': 'Device ID is required'
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Rule name must be at least 2 characters long',
                    'string.max': 'Rule name cannot exceed 100 characters',
                    'any.required': 'Rule name is required'
                }),
            trigger_type: Joi.string()
                .valid('keyword', 'exact_match', 'contains', 'regex', 'time_based', 'contact_group')
                .required()
                .messages({
                    'any.only': 'Trigger type must be one of: keyword, exact_match, contains, regex, time_based, contact_group',
                    'any.required': 'Trigger type is required'
                }),
            trigger_value: Joi.string()
                .required()
                .messages({
                    'any.required': 'Trigger value is required'
                }),
            reply_message: Joi.string()
                .min(1)
                .max(4096)
                .required()
                .messages({
                    'string.min': 'Reply message cannot be empty',
                    'string.max': 'Reply message cannot exceed 4096 characters',
                    'any.required': 'Reply message is required'
                }),
            conditions: Joi.object()
                .optional()
                .default({}),
            actions: Joi.object()
                .optional()
                .default({}),
            priority: Joi.number()
                .min(1)
                .max(100)
                .optional()
                .default(1),
            is_active: Joi.boolean()
                .optional()
                .default(true)
        });

        return this.validate(schema);
    }

    /**
     * Contact validation
     */
    validateContact() {
        const schema = Joi.object({
            device_id: Joi.string()
                .required()
                .messages({
                    'any.required': 'Device ID is required'
                }),
            phone_number: Joi.string()
                .pattern(new RegExp('^\\+?[1-9]\\d{1,14}$'))
                .required()
                .messages({
                    'string.pattern.base': 'Please provide a valid phone number',
                    'any.required': 'Phone number is required'
                }),
            name: Joi.string()
                .min(1)
                .max(100)
                .optional()
                .allow('')
                .messages({
                    'string.max': 'Name cannot exceed 100 characters'
                }),
            profile_picture: Joi.string()
                .uri()
                .optional()
                .allow('')
                .messages({
                    'string.uri': 'Profile picture must be a valid URL'
                }),
            status: Joi.string()
                .max(500)
                .optional()
                .allow(''),
            metadata: Joi.object()
                .optional()
                .default({})
        });

        return this.validate(schema);
    }

    /**
     * AI request validation
     */
    validateAIRequest() {
        const schema = Joi.object({
            type: Joi.string()
                .valid(
                    'generate_variation',
                    'optimize_campaign_content',
                    'analyze_target_audience',
                    'generate_intelligent_auto_reply',
                    'analyze_message_sentiment',
                    'predict_campaign_performance',
                    'optimize_message_timing',
                    'generate_content_suggestions',
                    'translate_contextual',
                    'paraphrase_message',
                    'extract_keywords',
                    'generate_campaign_content'
                )
                .required()
                .messages({
                    'any.only': 'Invalid AI operation type',
                    'any.required': 'AI operation type is required'
                }),
            originalText: Joi.string()
                .when('type', {
                    is: Joi.valid('generate_variation', 'paraphrase_message'),
                    then: Joi.required(),
                    otherwise: Joi.optional()
                }),
            variationCount: Joi.number()
                .min(1)
                .max(10)
                .optional()
                .default(3),
            style: Joi.string()
                .valid('casual', 'professional', 'friendly', 'formal')
                .optional()
                .default('casual'),
            language: Joi.string()
                .length(2)
                .optional()
                .default('id'),
            targetAudience: Joi.string()
                .optional()
                .default('general'),
            messageType: Joi.string()
                .optional()
                .default('text')
        });

        return this.validate(schema);
    }

    /**
     * Pagination validation
     */
    validatePagination() {
        const schema = Joi.object({
            page: Joi.number()
                .integer()
                .min(1)
                .optional()
                .default(1),
            limit: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .optional()
                .default(10),
            sort: Joi.string()
                .optional(),
            order: Joi.string()
                .valid('asc', 'desc')
                .optional()
                .default('desc'),
            search: Joi.string()
                .optional()
                .allow('')
        });

        return this.validate(schema, 'query');
    }

    /**
     * ID parameter validation
     */
    validateId(paramName = 'id') {
        return (req, res, next) => {
            const schema = Joi.object({
                [paramName]: Joi.alternatives()
                    .try(
                        Joi.number().integer().positive(),
                        Joi.string().alphanum().min(1)
                    )
                    .required()
                    .messages({
                        'any.required': `${paramName} is required`,
                        'alternatives.match': `${paramName} must be a valid identifier`
                    })
            });

            return this.validate(schema, 'params')(req, res, next);
        };
    }
}

// Create singleton instance
const validationMiddleware = new ValidationMiddleware();

// Export validation methods
module.exports = validationMiddleware;