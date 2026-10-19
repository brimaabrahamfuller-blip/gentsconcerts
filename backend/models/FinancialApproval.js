const mongoose = require('mongoose');

const financialApprovalSchema = new mongoose.Schema({
    requestKey: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 160 },
    type: { type: String, enum: ['payout', 'refund'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['LRD'], required: true, default: 'LRD' },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    beneficiaryReference: { type: String, trim: true, maxlength: 160 },
    targetId: { type: mongoose.Schema.Types.ObjectId, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestPermission: { type: String, required: true },
    requestId: { type: String, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired', 'cancelled'], default: 'pending', index: true },
    expiresAt: { type: Date, required: true, index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewPermission: { type: String },
    reviewRequestId: { type: String },
    reviewReason: { type: String, trim: true, maxlength: 500 },
    requestedAt: { type: Date, default: Date.now, immutable: true },
    reviewedAt: { type: Date }
}, { timestamps: true, versionKey: false });

financialApprovalSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('FinancialApproval', financialApprovalSchema);
