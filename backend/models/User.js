const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['attendee', 'host', 'admin'], default: 'attendee' },
    profileImage: { type: String },
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

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
