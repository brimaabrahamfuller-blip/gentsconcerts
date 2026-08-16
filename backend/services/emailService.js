const { Resend } = require('resend');

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const emailService = {
    /**
     * Send email verification
     * @param {Object} user - User object containing email and fullName
     * @param {string} verificationToken - The verification token
     */
    async sendVerificationEmail(user, verificationToken) {
        const verifyUrl = `${process.env.FRONTEND_URL || 'https://gentsconcerts.netlify.app'}/verify-email/${verificationToken}`;

        const emailOptions = {
            from: process.env.EMAIL_FROM || 'GentsConcerts <gentsconcerts@gmail.com>', // NOTE: Replace with verified domain in production
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

        try {
            if (resend) {
                await resend.emails.send(emailOptions);
                console.log(`Verification email sent to ${user.email}`);
            } else {
                console.log('[DEV MODE] Verification email for', user.email, '- URL:', verifyUrl);
            }
        } catch (error) {
            console.error(`[REGISTER] Failed to send verification email to ${user.email} : ${error.message}`);
        }
    },

    /**
     * Send password reset email
     * @param {Object} user - User object
     * @param {string} resetToken - The reset token
     */
    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'https://gentsconcerts.netlify.app'}/reset-password/${resetToken}`;

        const emailOptions = {
            from: process.env.EMAIL_FROM || 'GentsConcerts <gentsconcerts@gmail.com>', // NOTE: Replace with verified domain in production
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

        try {
            if (resend) {
                await resend.emails.send(emailOptions);
                console.log(`Password reset email sent to ${user.email}`);
            } else {
                console.log('[DEV MODE] Password reset email for', user.email, '- URL:', resetUrl);
            }
        } catch (error) {
            console.error(`[FORGOT_PASSWORD] Failed to send password reset email to ${user.email} : ${error.message}`);
        }
    },

    /**
     * Send ticket confirmation email
     * @param {Object} user - User object
     * @param {Object} ticket - Ticket object
     * @param {Object} event - Event object
     */
    async sendTicketConfirmation(user, ticket, event) {
        const { generateTicketPDF } = require('../utils/pdfGenerator');
        const fs = require('fs');
        const path = require('path');

        const pdfPath = path.join(__dirname, '..', 'uploads', `ticket-${ticket._id}.pdf`);
        try {
            await generateTicketPDF(ticket, event, user, pdfPath);
        } catch (pdfErr) {
            console.error('Failed to generate ticket PDF for email:', pdfErr.message);
        }

        const attachments = [];
        if (fs.existsSync(pdfPath)) {
            const pdfBuffer = fs.readFileSync(pdfPath);
            attachments.push({
                filename: `GentsConcerts-Ticket-${ticket.qrCode || ticket._id}.pdf`,
                content: pdfBuffer
            });
        }

        const emailOptions = {
            from: process.env.EMAIL_FROM || 'GentsConcerts <gentsconcerts@gmail.com>',
            to: user.email,
            subject: `Your Official E-Ticket - ${event.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0A0A0F; color: #F5F0E8; border-radius: 12px;">
                    <div style="background-color: #001F5B; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: #FFFFFF; margin: 0; font-size: 28px;">GENTS<span style="color: #C9A84C;">CONCERTS</span></h1>
                        <p style="color: #C9A84C; margin: 5px 0 0; letter-spacing: 2px; font-size: 12px;">OFFICIAL E-TICKET</p>
                    </div>
                    <div style="background-color: #12121A; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid rgba(201,168,76,0.2);">
                        <h2 style="color: #C9A84C; margin-top: 0;">You're All Set!</h2>
                        <p style="color: #F5F0E8; font-size: 16px; line-height: 1.6;">
                            Hi <strong>${user.fullName || ticket.purchaserName}</strong>,<br><br>
                            Your registration for <strong>${event.title}</strong> has been successfully confirmed. Please find your official e-ticket attached as a PDF with your unique QR code.
                        </p>
                        <div style="background-color: #1A1A26; border: 1px solid rgba(201,168,76,0.3); border-radius: 10px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%; color: #F5F0E8;">
                                <tr><td style="color: #A0A0B0; padding: 6px 0;">Event:</td><td style="font-weight: bold; color: #FFFFFF;">${event.title}</td></tr>
                                <tr><td style="color: #A0A0B0; padding: 6px 0;">Date & Time:</td><td style="font-weight: bold;">August 23, 2026 · 8:00 AM - Late</td></tr>
                                <tr><td style="color: #A0A0B0; padding: 6px 0;">Venue:</td><td style="font-weight: bold;">${event.venue || 'ULK Gisozi, Kigali'}</td></tr>
                                <tr><td style="color: #A0A0B0; padding: 6px 0;">Ticket Tier:</td><td style="font-weight: bold; color: #C9A84C;">${ticket.tierName}</td></tr>
                                <tr><td style="color: #A0A0B0; padding: 6px 0;">Ticket ID:</td><td style="font-weight: bold; font-family: monospace; color: #C9A84C;">${ticket.qrCode || ticket._id}</td></tr>
                            </table>
                        </div>
                        <p style="color: #F5F0E8; font-size: 14px; line-height: 1.6;">
                            Download the attached PDF ticket or keep it handy on your phone. Simply present the QR code at the venue entrance on August 23rd for fast, paperless entry.
                        </p>
                        <p style="color: #C9A84C; font-size: 14px; margin-top: 30px; font-weight: bold;">
                            United by Heritage, Driven by Purpose! ❤️🇱🇷
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #A0A0B0; font-size: 12px;">
                        <p>#GentsConcerts #LIBCOR #Liberia #Rwanda #ALF2026</p>
                        <p>gentsconcerts@gmail.com</p>
                    </div>
                </div>
            `,
            attachments: attachments.length > 0 ? attachments : undefined
        };

        try {
            if (resend) {
                await resend.emails.send(emailOptions);
                console.log(`Official e-ticket email with PDF attachment sent to ${user.email}`);
            } else {
                console.log('[DEV MODE] Official e-ticket email for', user.email, '- Event:', event.title);
            }
            // Cleanup local PDF file
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        } catch (error) {
            console.error(`[TICKET] Failed to send e-ticket email to ${user.email} : ${error.message}`);
        }
    },

    /**
     * Send event reminder email
     * @param {Object} user - User object
     * @param {Object} event - Event object
     * @param {number} daysUntil - Days until event
     */
    async sendEventReminder(user, event, daysUntil) {
        const emailOptions = {
            from: process.env.EMAIL_FROM || 'GentsConcerts <gentsconcerts@gmail.com>', // NOTE: Replace with verified domain in production
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

        try {
            if (resend) {
                await resend.emails.send(emailOptions);
                console.log(`Event reminder email sent to ${user.email}`);
            } else {
                console.log('[DEV MODE] Event reminder email for', user.email, '- Event:', event.title, '- Days:', daysUntil);
            }
        } catch (error) {
            console.error(`[REMINDER] Failed to send event reminder email to ${user.email} : ${error.message}`);
        }
    }
};

module.exports = emailService;
