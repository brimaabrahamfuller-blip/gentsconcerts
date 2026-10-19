const mongoose = require('mongoose');

const adminLoginMfaChallengeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'verified', 'expired', 'locked'], default: 'pending', index: true },
    attemptCount: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1 },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date },
    lastAttemptAt: { type: Date },
    requestId: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

adminLoginMfaChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminLoginMfaChallenge', adminLoginMfaChallengeSchema);
