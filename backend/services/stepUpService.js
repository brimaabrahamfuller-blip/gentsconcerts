const crypto = require('crypto');
const StepUpChallenge = require('../models/StepUpChallenge');
const emailService = require('./emailService');

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const createChallenge = async ({ user, purpose, requestId }) => {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const challenge = await StepUpChallenge.create({
        userId: user._id,
        purpose,
        codeHash: hash(code),
        requestId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await emailService.sendStepUpCode(user, code, purpose);
    return challenge;
};

const verifyChallenge = async ({ userId, challengeId, code }) => {
    const challenge = await StepUpChallenge.findOne({ _id: challengeId, userId });
    if (!challenge) throw new Error('Step-up challenge not found.');
    if (challenge.status !== 'pending') throw new Error(`Step-up challenge is ${challenge.status}.`);
    if (challenge.expiresAt <= new Date()) {
        challenge.status = 'expired';
        await challenge.save();
        throw new Error('Step-up challenge has expired.');
    }
    if (challenge.attemptCount >= challenge.maxAttempts) {
        challenge.status = 'locked';
        await challenge.save();
        throw new Error('Too many step-up attempts. Request a new code.');
    }

    challenge.attemptCount += 1;
    if (hash(code) !== challenge.codeHash) {
        if (challenge.attemptCount >= challenge.maxAttempts) challenge.status = 'locked';
        await challenge.save();
        throw new Error('Invalid step-up code.');
    }

    const grantToken = crypto.randomBytes(32).toString('hex');
    challenge.status = 'verified';
    challenge.grantTokenHash = hash(grantToken);
    challenge.verifiedAt = new Date();
    await challenge.save();
    return { challenge, grantToken };
};

const requireGrant = async ({ userId, purpose, grantToken }) => {
    if (!grantToken) throw new Error('A verified step-up grant is required.');
    const challenge = await StepUpChallenge.findOne({
        userId,
        purpose,
        status: 'verified',
        grantTokenHash: hash(grantToken),
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() }
    });
    if (!challenge) throw new Error('The step-up grant is missing, expired, or already used.');
    return challenge;
};

const consumeGrant = async (challenge) => {
    const consumed = await StepUpChallenge.findOneAndUpdate(
        { _id: challenge._id, status: 'verified', usedAt: { $exists: false } },
        { $set: { status: 'used', usedAt: new Date() } },
        { new: true }
    );
    if (!consumed) throw new Error('The step-up grant was already consumed.');
    return consumed;
};

module.exports = { createChallenge, verifyChallenge, requireGrant, consumeGrant };
