const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['attendee', 'host', 'admin'], default: 'attendee' },
    // Attendee accounts may apply to host events, but only an administrator can
    // approve the account to publish or manage events.
    hostApprovalStatus: {
        type: String,
        enum: ['not_requested', 'pending', 'approved', 'rejected'],
        default: 'not_requested',
        index: true
    },
    hostApplicationSubmittedAt: { type: Date },
    hostReviewedAt: { type: Date },
    hostReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hostReviewNote: { type: String, trim: true, maxlength: 500 },
    profileImage: { type: String },
    // Keep the existing field for compatibility and expose the requested alias.
    profilePhoto: { type: String },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referralCount: { type: Number, default: 0, min: 0 },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isVerified: { type: Boolean, default: false },

    // Email verification
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Push notification
    expoPushToken: { type: String },

    // Notification preferences
    notificationPreferences: {
        ticketConfirmations: { type: Boolean, default: true },
        eventReminders: { type: Boolean, default: true },
        newEvents: { type: Boolean, default: true },
        promotionalEmails: { type: Boolean, default: false }
    },

    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
    if (!this.referralCode) {
        this.referralCode = `GC${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    }
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
