const mongoose = require('mongoose');

const settlementItemSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionCount: { type: Number, min: 0, required: true },
    grossCollections: { type: Number, min: 0, required: true },
    refundsAndReversals: { type: Number, min: 0, required: true },
    netCollections: { type: Number, min: 0, required: true },
    platformFees: { type: Number, min: 0, required: true },
    hostPayable: { type: Number, min: 0, required: true },
    unallocatedNet: { type: Number, min: 0, required: true },
    exceptions: [{ type: String, trim: true }]
}, { _id: false });

const settlementBatchSchema = new mongoose.Schema({
    batchKey: { type: String, required: true, unique: true, index: true, trim: true },
    cutoffAt: { type: Date, required: true, index: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    currency: { type: String, enum: ['LRD'], required: true, default: 'LRD' },
    status: { type: String, enum: ['draft', 'under_review', 'provider_matched', 'provider_mismatch', 'approved', 'released', 'reconciled'], default: 'draft', index: true },
    totals: {
        transactionCount: { type: Number, min: 0, required: true },
        grossCollections: { type: Number, min: 0, required: true },
        refundsAndReversals: { type: Number, min: 0, required: true },
        netCollections: { type: Number, min: 0, required: true },
        platformFees: { type: Number, min: 0, required: true },
        hostPayable: { type: Number, min: 0, required: true },
        unallocatedNet: { type: Number, min: 0, required: true }
    },
    items: { type: [settlementItemSchema], default: [] },
    exceptionCount: { type: Number, min: 0, default: 0 },
    sourceLedgerWatermark: {
        lastLedgerEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'LedgerEntry' },
        lastLedgerEntryAt: { type: Date }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    providerSettlementReference: { type: String, trim: true, index: true },
    providerStatus: { type: String, trim: true, uppercase: true },
    providerEvidenceNote: { type: String, trim: true, maxlength: 1000 },
    providerMatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    providerMatchedAt: { type: Date },
    reviewReason: { type: String, trim: true, maxlength: 1000 }
}, { timestamps: true, versionKey: false, minimize: false });

settlementBatchSchema.index({ status: 1, cutoffAt: -1 });

module.exports = mongoose.model('SettlementBatch', settlementBatchSchema);
