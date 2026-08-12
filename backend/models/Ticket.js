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
    paymentStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'expired', 'cancelled'],
        default: 'pending'
    },
    mtnTransactionId: {
        type: String
    },
    financialTransactionId: {
        type: String
    },
    qrCode: {
        type: String,
        unique: true,
        sparse: true
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

module.exports = mongoose.model('Ticket', TicketSchema);
