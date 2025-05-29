// backend/server.js - Complete Node.js server with Gmail SMTP
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://my-portfolio-853e1.web.app',
        'https://your-firebase-app.firebaseapp.com',
        'https://yourdomain.com' // Add your custom domain if you have one
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Gmail SMTP transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // Your Gmail address
            pass: process.env.GMAIL_APP_PASSWORD // Your Gmail App Password (16 characters)
        }
    });
};

// Verify email configuration on startup
const transporter = createTransporter();
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Gmail SMTP configuration error:', error.message);
        console.log('🔧 Please check your GMAIL_USER and GMAIL_APP_PASSWORD in .env file');
    } else {
        console.log('✅ Gmail SMTP server is ready to send emails');
    }
});

// Input validation function
const validateContactForm = (data) => {
    const { name, email, message } = data;
    const errors = [];

    // Required fields
    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    if (!email || !email.includes('@')) {
        errors.push('Valid email address is required');
    }
    if (!message || message.trim().length < 10) {
        errors.push('Message must be at least 10 characters long');
    }

    // Length limits
    if (name && name.length > 100) errors.push('Name too long (max 100 characters)');
    if (email && email.length > 200) errors.push('Email too long (max 200 characters)');
    if (message && message.length > 2000) errors.push('Message too long (max 2000 characters)');

    return errors;
};

// Main contact endpoint
app.post('/api/contact', async (req, res) => {
    try {
        console.log('📨 New contact form submission received');

        const { name, email, subject, message } = req.body;

        // Validate input
        const validationErrors = validateContactForm({ name, email, message });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Sanitize input data
        const sanitizedData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject ? subject.trim() : '',
            message: message.trim()
        };

        // Create email content
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>New Contact Form Submission</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                        🌟 New Portfolio Contact
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                        Someone wants to work with you!
                    </p>
                </div>
                
                <!-- Contact Details -->
                <div style="background: #f8fafc; padding: 30px 20px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
                    <div style="display: grid; gap: 20px;">
                        
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #6366f1; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">👤 Contact Information</h3>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Name:</strong> ${sanitizedData.name}</p>
                            <p style="margin: 5px 0; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${sanitizedData.email}" style="color: #6366f1; text-decoration: none;">${sanitizedData.email}</a></p>
                            ${sanitizedData.subject ? `<p style="margin: 5px 0; font-size: 15px;"><strong>Subject:</strong> ${sanitizedData.subject}</p>` : ''}
                        </div>
                        
                        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">💌 Message</h3>
                            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 15px;">${sanitizedData.message}</p>
                            </div>
                        </div>
                        
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #1e293b; padding: 25px 20px; border-radius: 0 0 12px 12px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 14px;">
                        📅 <strong>Received:</strong> ${new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })}
                    </p>
                    <p style="color: #64748b; margin: 0; font-size: 13px;">
                        🔄 Reply to this email to respond directly to ${sanitizedData.name}
                    </p>
                    <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
                        📧 Sent from your Portfolio Contact Form
                    </p>
                </div>
                
            </body>
            </html>
        `;

        // Email options
        const mailOptions = {
            from: `"${sanitizedData.name}" <${process.env.GMAIL_USER}>`, // Your Gmail as sender
            to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER, // Where to receive emails
            replyTo: sanitizedData.email, // Client's email for easy reply
            subject: sanitizedData.subject || `📬 New Portfolio Contact from ${sanitizedData.name}`,
            html: emailHtml,
            // Also include plain text version
            text: `
New Contact Form Submission

Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Subject: ${sanitizedData.subject || 'No subject'}

Message:
${sanitizedData.message}

---
Received: ${new Date().toLocaleString()}
Reply to this email to respond directly to ${sanitizedData.name}.
            `
        };

        // Send email
        console.log('📤 Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');

        // Optional: Send auto-reply to the client
        if (process.env.SEND_AUTO_REPLY === 'true') {
            const autoReplyOptions = {
                from: `"Mordecai" <${process.env.GMAIL_USER}>`,
                to: sanitizedData.email,
                subject: '✨ Thank you for reaching out!',
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">Thank you for reaching out!</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">I'll get back to you soon ⚡</p>
                        </div>
                        
                        <div style="padding: 30px 20px; background: white;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${sanitizedData.name},</p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your message! I've received your inquiry and will get back to you within 24-48 hours.</p>
                            
                            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6366f1;">
                                <p style="margin: 0; color: #374151;"><strong>Your message:</strong></p>
                                <p style="margin: 10px 0 0 0; color: #64748b; line-height: 1.6;">"${sanitizedData.message}"</p>
                            </div>
                            
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                                Best regards,<br>
                                <strong>Mordecai</strong><br>
                                <span style="color: #6366f1;">Full-Stack Developer</span>
                            </p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(autoReplyOptions);
            console.log('✅ Auto-reply sent to client');
        }

        // Success response
        res.status(200).json({
            success: true,
            message: 'Message sent successfully! I\'ll get back to you soon.',
            data: {
                name: sanitizedData.name,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Email sending error:', error);

        // Determine error type and send appropriate response
        let errorMessage = 'Failed to send message. Please try again later.';
        let statusCode = 500;

        if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please contact the administrator.';
            console.error('🔐 Gmail authentication error - check GMAIL_APP_PASSWORD');
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Email service connection failed. Please try again later.';
            console.error('🌐 Gmail connection error - check internet connection');
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Portfolio backend server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend is working!',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        availableEndpoints: [
            'POST /api/contact',
            'GET /api/health',
            'GET /api/test'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Portfolio Backend Server`);
    console.log(`📡 Running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 Gmail User: ${process.env.GMAIL_USER || 'Not configured'}`);
    console.log(`📬 Recipient: ${process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER || 'Not configured'}`);
    console.log(`🔄 Auto-reply: ${process.env.SEND_AUTO_REPLY === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/contact`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   GET  http://localhost:${PORT}/api/test`);
    console.log(`\n✅ Server ready to handle contact form submissions!\n`);
});

module.exports = app;