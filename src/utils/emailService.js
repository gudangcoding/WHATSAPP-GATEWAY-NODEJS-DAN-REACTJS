const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    /**
     * Initialize email transporter
     */
    initialize() {
        try {
            // Configure transporter based on environment
            if (process.env.EMAIL_SERVICE === 'smtp') {
                this.transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
            } else if (process.env.EMAIL_SERVICE === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_PASS
                    }
                });
            } else {
                // Default to console logging for development
                this.transporter = nodemailer.createTransport({
                    streamTransport: true,
                    newline: 'unix',
                    buffer: true
                });
            }

            logger.info('EmailService: Email transporter initialized successfully');

        } catch (error) {
            logger.error('EmailService: Error initializing email transporter:', error);
            
            // Fallback to console logging
            this.transporter = nodemailer.createTransport({
                streamTransport: true,
                newline: 'unix',
                buffer: true
            });
        }
    }

    /**
     * Send email
     */
    async sendEmail(emailData) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@whatsapp-gateway.com',
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text
            };

            // Add CC and BCC if provided
            if (emailData.cc) mailOptions.cc = emailData.cc;
            if (emailData.bcc) mailOptions.bcc = emailData.bcc;

            // Add attachments if provided
            if (emailData.attachments) mailOptions.attachments = emailData.attachments;

            const result = await this.transporter.sendMail(mailOptions);

            logger.info(`EmailService: Email sent successfully to ${emailData.to}`);
            return {
                success: true,
                messageId: result.messageId,
                response: result.response
            };

        } catch (error) {
            logger.error(`EmailService: Error sending email to ${emailData.to}:`, error);
            throw error;
        }
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email, name, token) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        
        const emailData = {
            to: email,
            subject: 'Verify Your Email - WhatsApp Gateway SaaS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Email Verification</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to WhatsApp Gateway SaaS!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Thank you for registering with WhatsApp Gateway SaaS. To complete your registration, please verify your email address by clicking the button below:</p>
                            <p style="text-align: center;">
                                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                            </p>
                            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 3px;">${verificationUrl}</p>
                            <p><strong>This verification link will expire in 24 hours.</strong></p>
                            <p>If you didn't create an account with us, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Welcome to WhatsApp Gateway SaaS!
                
                Hello ${name},
                
                Thank you for registering. Please verify your email address by visiting:
                ${verificationUrl}
                
                This link will expire in 24 hours.
                
                Best regards,
                WhatsApp Gateway SaaS Team
            `
        };

        return this.sendEmail(emailData);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, name, token) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        
        const emailData = {
            to: email,
            subject: 'Password Reset - WhatsApp Gateway SaaS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .button { display: inline-block; background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>We received a request to reset your password for your WhatsApp Gateway SaaS account.</p>
                            <p style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </p>
                            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                            <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 3px;">${resetUrl}</p>
                            <div class="warning">
                                <strong>Important:</strong>
                                <ul>
                                    <li>This password reset link will expire in 1 hour</li>
                                    <li>If you didn't request this reset, please ignore this email</li>
                                    <li>Your password will remain unchanged until you create a new one</li>
                                </ul>
                            </div>
                        </div>
                        <div class="footer">
                            <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Password Reset Request
                
                Hello ${name},
                
                We received a request to reset your password. Click the link below to reset it:
                ${resetUrl}
                
                This link will expire in 1 hour.
                
                If you didn't request this reset, please ignore this email.
                
                Best regards,
                WhatsApp Gateway SaaS Team
            `
        };

        return this.sendEmail(emailData);
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, name) {
        const loginUrl = `${process.env.FRONTEND_URL}/login`;
        const docsUrl = `${process.env.FRONTEND_URL}/docs`;
        
        const emailData = {
            to: email,
            subject: 'Welcome to WhatsApp Gateway SaaS!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                        .features { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to WhatsApp Gateway SaaS!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Congratulations! Your email has been verified and your account is now active.</p>
                            
                            <div class="features">
                                <h3>🚀 What you can do now:</h3>
                                <ul>
                                    <li><strong>Connect WhatsApp Devices</strong> - Add multiple WhatsApp numbers</li>
                                    <li><strong>Send Messages</strong> - Text, images, videos, documents, and more</li>
                                    <li><strong>Auto-Reply System</strong> - Set up intelligent automated responses</li>
                                    <li><strong>Campaign Management</strong> - Send bulk messages to your contacts</li>
                                    <li><strong>AI Integration</strong> - Enhance messages with AI-powered features</li>
                                    <li><strong>Analytics & Reports</strong> - Track your messaging performance</li>
                                </ul>
                            </div>
                            
                            <p style="text-align: center;">
                                <a href="${loginUrl}" class="button">Login to Dashboard</a>
                                <a href="${docsUrl}" class="button">View Documentation</a>
                            </p>
                            
                            <p>Need help getting started? Check out our documentation or contact our support team.</p>
                        </div>
                        <div class="footer">
                            <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Welcome to WhatsApp Gateway SaaS!
                
                Hello ${name},
                
                Your account is now active! You can now:
                - Connect WhatsApp devices
                - Send messages
                - Set up auto-replies
                - Manage campaigns
                - Use AI features
                - View analytics
                
                Login: ${loginUrl}
                Documentation: ${docsUrl}
                
                Best regards,
                WhatsApp Gateway SaaS Team
            `
        };

        return this.sendEmail(emailData);
    }

    /**
     * Send notification email
     */
    async sendNotificationEmail(email, subject, message, type = 'info') {
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#f44336'
        };

        const emailData = {
            to: email,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: ${colors[type]}; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; background-color: #f9f9f9; }
                        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${subject}</h1>
                        </div>
                        <div class="content">
                            ${message}
                        </div>
                        <div class="footer">
                            <p>Best regards,<br>WhatsApp Gateway SaaS Team</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `${subject}\n\n${message.replace(/<[^>]*>/g, '')}\n\nBest regards,\nWhatsApp Gateway SaaS Team`
        };

        return this.sendEmail(emailData);
    }

    /**
     * Test email configuration
     */
    async testConnection() {
        try {
            await this.transporter.verify();
            logger.info('EmailService: Email configuration test successful');
            return { success: true, message: 'Email configuration is valid' };

        } catch (error) {
            logger.error('EmailService: Email configuration test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Export the sendEmail function for backward compatibility
module.exports = {
    sendEmail: emailService.sendEmail.bind(emailService),
    sendVerificationEmail: emailService.sendVerificationEmail.bind(emailService),
    sendPasswordResetEmail: emailService.sendPasswordResetEmail.bind(emailService),
    sendWelcomeEmail: emailService.sendWelcomeEmail.bind(emailService),
    sendNotificationEmail: emailService.sendNotificationEmail.bind(emailService),
    testConnection: emailService.testConnection.bind(emailService)
};