const nodemailer = require('nodemailer');

// Create reusable transporter object
const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Production: Use real SMTP
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    // Development: Use a test account or console.log
    return null;
};

const emailService = {
    transporter: null,

    init() {
        this.transporter = createTransporter();
    },

    // Send email verification
    async sendVerificationEmail(user, verificationToken) {
        const verifyUrl = `${process.env.FRONTEND_URL || 'https://gentsconcerts.netlify.app'}/verify-email/${verificationToken}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || `"GentsConcerts" <noreply@gentsconcerts.com>`,
            to: user.email,
            subject: 'Verify Your Email - GentsConcerts',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #001F5B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #FFFFFF; margin: 0;">GENTS<span style="color: #D4AF37;">CONCERTS</span></h1>
                        <p style="color: #D4AF37; margin: 5px 0 0;">Liberia's Premier Event Platform</p>
                    </div>
                    <div style="background-color: #F5F5F5; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #001F5B;">Welcome to GentsConcerts!</h2>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${user.fullName}</strong>,<br><br>
                            Thank you for registering with GentsConcerts — Liberia's first online concert and events platform.<br><br>
                            Please verify your email address by clicking the button below:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verifyUrl}" style="background-color: #D4AF37; color: #001F5B; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Verify Email
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${verifyUrl}" style="color: #D4AF37;">${verifyUrl}</a>
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            This verification link will expire in 24 hours.<br>
                            If you didn't create this account, please ignore this email.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>#GentsConcerts #Liberia #Monrovia</p>
                        <p>gentsconcerts@gmail.com | WhatsApp: 0791 389 824</p>
                    </div>
                </div>
            `
        };

        if (this.transporter) {
            await this.transporter.sendMail(mailOptions);
            console.log(`Verification email sent to ${user.email}`);
        } else {
            console.log('[DEV MODE] Verification email for', user.email, '- URL:', verifyUrl);
        }
    },

    // Send password reset email
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'https://gentsconcerts.netlify.app'}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.SMTP_FROM || `"GentsConcerts" <noreply@gentsconcerts.com>`,
            to: user.email,
            subject: 'Password Reset - GentsConcerts',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #001F5B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #FFFFFF; margin: 0;">GENTS<span style="color: #D4AF37;">CONCERTS</span></h1>
                    </div>
                    <div style="background-color: #F5F5F5; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #001F5B;">Password Reset Request</h2>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${user.fullName}</strong>,<br><br>
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #D4AF37; color: #001F5B; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            This link will expire in 1 hour. If you didn't request this, please ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        if (this.transporter) {
            await this.transporter.sendMail(mailOptions);
        } else {
            console.log('[DEV MODE] Password reset email for', user.email, '- URL:', resetUrl);
        }
    },

    // Send ticket confirmation email
    async sendTicketConfirmation(user, ticket, event) {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"GentsConcerts" <noreply@gentsconcerts.com>`,
            to: user.email,
            subject: `Ticket Confirmation - ${event.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #001F5B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #FFFFFF; margin: 0;">GENTS<span style="color: #D4AF37;">CONCERTS</span></h1>
                        <p style="color: #D4AF37; margin: 5px 0 0;">Ticket Confirmation</p>
                    </div>
                    <div style="background-color: #F5F5F5; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #001F5B;">Your ticket has been confirmed!</h2>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${user.fullName}</strong>,<br><br>
                            Your ticket purchase has been confirmed. Here are your ticket details:
                        </p>
                        <div style="background-color: #FFFFFF; border: 1px solid #DDD; border-radius: 10px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%;">
                                <tr><td style="color: #666; padding: 5px 0;">Event:</td><td style="font-weight: bold; color: #001F5B;">${event.title}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Date:</td><td style="font-weight: bold;">${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Venue:</td><td style="font-weight: bold;">${event.venue}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Ticket Type:</td><td style="font-weight: bold;">${ticket.tierName}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Quantity:</td><td style="font-weight: bold;">${ticket.quantity}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Total:</td><td style="font-weight: bold; color: #D4AF37;">$${ticket.totalAmountUSD.toFixed(2)} USD</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Ticket ID:</td><td style="font-weight: bold; font-family: monospace;">${ticket.qrCode || ticket._id}</td></tr>
                            </table>
                        </div>
                        <p style="color: #333; font-size: 14px; line-height: 1.6;">
                            Your digital ticket with QR code is available in the Tickets section of the GentsConcerts app. Present it at the venue door for verification.
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            See you at the event! 🎶
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>#GentsConcerts #Liberia #Monrovia</p>
                    </div>
                </div>
            `
        };

        if (this.transporter) {
            await this.transporter.sendMail(mailOptions);
        } else {
            console.log('[DEV MODE] Ticket confirmation email for', user.email, '- Event:', event.title);
        }
    },

    // Send event reminder email
    async sendEventReminder(user, event, daysUntil) {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"GentsConcerts" <noreply@gentsconcerts.com>`,
            to: user.email,
            subject: `Reminder: ${event.title} is coming up!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #001F5B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #FFFFFF; margin: 0;">GENTS<span style="color: #D4AF37;">CONCERTS</span></h1>
                        <p style="color: #D4AF37; margin: 5px 0 0;">Event Reminder</p>
                    </div>
                    <div style="background-color: #F5F5F5; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #001F5B;">Your event is in ${daysUntil} day${daysUntil > 1 ? 's' : ''}!</h2>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${user.fullName}</strong>,<br><br>
                            This is a friendly reminder about your upcoming event:
                        </p>
                        <div style="background-color: #FFFFFF; border: 1px solid #DDD; border-radius: 10px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%;">
                                <tr><td style="color: #666; padding: 5px 0;">Event:</td><td style="font-weight: bold; color: #001F5B;">${event.title}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Date:</td><td style="font-weight: bold;">${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Time:</td><td style="font-weight: bold;">${event.time}</td></tr>
                                <tr><td style="color: #666; padding: 5px 0;">Venue:</td><td style="font-weight: bold;">${event.venue}</td></tr>
                            </table>
                        </div>
                        <p style="color: #333; font-size: 14px; line-height: 1.6;">
                            Don't forget to bring your digital ticket. Open the GentsConcerts app and go to your Tickets section.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                        <p>#GentsConcerts #Liberia #Monrovia</p>
                    </div>
                </div>
            `
        };

        if (this.transporter) {
            await this.transporter.sendMail(mailOptions);
        } else {
            console.log('[DEV MODE] Event reminder email for', user.email, '- Event:', event.title, '- Days:', daysUntil);
        }
    }
};

// Initialize on module load
emailService.init();

module.exports = emailService;
