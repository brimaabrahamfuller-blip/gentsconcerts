const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
    postingGroupId: { type: String, required: true, index: true, trim: true },
    lineNumber: { type: Number, required: true, min: 1 },
    entryType: { type: String, enum: ['collection', 'refund', 'reversal', 'payout'], required: true },
    accountCode: { type: String, enum: ['mtn_clearing', 'ticket_sales_revenue', 'refunds_payable', 'host_payable', 'payouts_clearing'], required: true },
    direction: { type: String, enum: ['debit', 'credit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    provider: { type: String, enum: ['mtn_momo', 'internal'], required: true },
    providerReference: { type: String, index: true, trim: true },
    idempotencyKey: { type: String, required: true, index: true, trim: true },
    status: { type: String, enum: ['posted', 'reversed'], default: 'posted', index: true },
    postedAt: { type: Date, default: Date.now, immutable: true }
}, { timestamps: true, minimize: false, versionKey: false });

ledgerEntrySchema.index({ postingGroupId: 1, lineNumber: 1 }, { unique: true });
ledgerEntrySchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany'], function rejectMutation(next) {
    next(new Error('Ledger entries are append-only and cannot be mutated or deleted.'));
});

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
