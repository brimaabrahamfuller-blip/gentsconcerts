const mongoose = require('mongoose');

const stepUpChallengeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: ['financial_approval'], required: true, index: true },
    codeHash: { type: String, required: true },
    grantTokenHash: { type: String, index: true },
    status: { type: String, enum: ['pending', 'verified', 'used', 'expired', 'locked'], default: 'pending', index: true },
    attemptCount: { type: Number, min: 0, default: 0 },
    maxAttempts: { type: Number, min: 1, default: 5 },
    requestId: { type: String, index: true },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date },
    usedAt: { type: Date }
}, { timestamps: true, versionKey: false });

stepUpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('StepUpChallenge', stepUpChallengeSchema);
