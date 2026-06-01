const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tierName: { type: String, required: true },
    tierPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalAmountUSD: { type: Number, required: true },
    totalAmountLRD: { type: Number, required: true },
    qrCode: { type: String, unique: true },
    qrCodeImage: { type: String }, // base64
    paymentStatus: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    mtnTransactionId: { type: String },
    purchaserName: { type: String, required: true },
    purchaserPhone: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
