const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tierName: {
        type: String,
        required: true
    },
    tierPrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalAmountUSD: {
        type: Number,
        required: true
    },
    totalAmountLRD: {
        type: Number,
        required: true
    },
    purchaserName: {
        type: String,
        required: true
    },
    purchaserPhone: {
        type: String,
        required: true
    },
    referralCode: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'expired', 'cancelled'],
        default: 'pending',
        index: true
    },
    // A successful stock reservation is recorded independently from payment so
    // expiry, cancellation, and gateway failure can return inventory exactly once.
    inventoryReserved: { type: Boolean, default: false, index: true },
    inventoryReleasedAt: { type: Date },
    expiresAt: { type: Date, index: true },
    mtnTransactionId: {
        type: String
    },
    financialTransactionId: {
        type: String
    },
    qrCode: {
        type: String
    },
    qrCodeImage: {
        type: String // DataURL
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Prevent duplicate active claims by the same account for the same event tier.
// This unique index is partial so failed or expired attempts do not block retry.
TicketSchema.index(
    { eventId: 1, userId: 1, tierName: 1 },
    { unique: true, partialFilterExpression: { paymentStatus: { $in: ['pending', 'confirmed'] } } }
);

module.exports = mongoose.model('Ticket', TicketSchema);
