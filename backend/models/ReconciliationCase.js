const mongoose = require('mongoose');

const reconciliationCaseSchema = new mongoose.Schema({
    caseKey: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 180 },
    type: { type: String, enum: ['refund', 'reversal'], required: true, index: true },
    source: { type: String, enum: ['provider_confirmation', 'exception_report', 'manual'], required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    providerReference: { type: String, required: true, index: true, trim: true },
    providerStatus: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['LRD'], required: true, default: 'LRD' },
    evidenceNote: { type: String, required: true, trim: true, maxlength: 1000 },
    payloadHash: { type: String, trim: true, maxlength: 128 },
    status: { type: String, enum: ['open', 'under_review', 'needs_info', 'approved_for_ledger', 'rejected', 'posted'], default: 'open', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewRequestId: { type: String },
    reviewReason: { type: String, trim: true, maxlength: 1000 },
    reviewedAt: { type: Date },
    ledgerPostingGroupId: { type: String, index: true },
    postedAt: { type: Date }
}, { timestamps: true, versionKey: false, minimize: false });

reconciliationCaseSchema.index({ status: 1, createdAt: -1 });
reconciliationCaseSchema.index({ transactionId: 1, type: 1, status: 1 });

module.exports = mongoose.model('ReconciliationCase', reconciliationCaseSchema);
