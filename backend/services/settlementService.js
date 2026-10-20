const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const LedgerEntry = require('../models/LedgerEntry');
const SettlementBatch = require('../models/SettlementBatch');

const round = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const buildSettlementItem = ({ eventId, organizerId, transactions, adjustmentsByTransaction }) => {
    let grossCollections = 0;
    let refundsAndReversals = 0;
    let platformFees = 0;
    let hostPayable = 0;
    const exceptions = [];

    for (const transaction of transactions) {
        const gross = Number(transaction.amount || 0);
        const adjustments = Number(adjustmentsByTransaction.get(String(transaction._id)) || 0);
        const fee = Number(transaction.commission || 0);
        const host = Number(transaction.hostPayout || 0);
        grossCollections += gross;
        refundsAndReversals += adjustments;
        platformFees += fee;
        hostPayable += host;
        if (fee + host > gross - adjustments + 0.01) exceptions.push(`allocation_exceeds_net:${transaction._id}`);
        if (gross - adjustments - fee - host > 0.01) exceptions.push(`unallocated_net:${transaction._id}`);
    }

    const netCollections = round(grossCollections - refundsAndReversals);
    const item = {
        eventId,
        organizerId,
        transactionCount: transactions.length,
        grossCollections: round(grossCollections),
        refundsAndReversals: round(refundsAndReversals),
        netCollections,
        platformFees: round(platformFees),
        hostPayable: round(hostPayable),
        unallocatedNet: round(Math.max(netCollections - platformFees - hostPayable, 0)),
        exceptions: [...new Set(exceptions)]
    };
    return item;
};

const createSettlementDraft = async ({ cutoffAt, createdBy }) => {
    const cutoff = new Date(cutoffAt);
    if (Number.isNaN(cutoff.getTime()) || cutoff > new Date()) throw new Error('Settlement cutoff must be a valid time in the past.');
    const batchKey = `SETTLEMENT-DRAFT-${crypto.createHash('sha256').update(cutoff.toISOString()).digest('hex').slice(0, 32)}`;
    const existing = await SettlementBatch.findOne({ batchKey });
    if (existing) return { batch: existing, idempotentReplay: true };

    const transactions = await Transaction.find({ status: 'completed', currency: 'LRD', createdAt: { $lte: cutoff }, ledgerPostingGroupId: { $exists: true, $ne: null } })
        .populate('eventId', 'organizerId title')
        .sort({ createdAt: 1 })
        .lean();
    const transactionIds = transactions.map((transaction) => transaction._id);
    const adjustmentEntries = transactionIds.length ? await LedgerEntry.find({ transactionId: { $in: transactionIds }, entryType: { $in: ['refund', 'reversal'] }, status: 'posted' }).select('transactionId amount').lean() : [];
    const adjustmentsByTransaction = new Map();
    for (const entry of adjustmentEntries) adjustmentsByTransaction.set(String(entry.transactionId), Number(adjustmentsByTransaction.get(String(entry.transactionId)) || 0) + Number(entry.amount || 0));

    const groups = new Map();
    for (const transaction of transactions) {
        const event = transaction.eventId;
        const key = `${event?._id || transaction.eventId}:${event?.organizerId || 'unassigned'}`;
        if (!groups.has(key)) groups.set(key, { eventId: event?._id || transaction.eventId, organizerId: event?.organizerId || null, transactions: [] });
        groups.get(key).transactions.push(transaction);
    }
    const items = [...groups.values()].map((group) => buildSettlementItem({ ...group, adjustmentsByTransaction }));
    const totals = items.reduce((sum, item) => ({
        transactionCount: sum.transactionCount + item.transactionCount,
        grossCollections: round(sum.grossCollections + item.grossCollections),
        refundsAndReversals: round(sum.refundsAndReversals + item.refundsAndReversals),
        netCollections: round(sum.netCollections + item.netCollections),
        platformFees: round(sum.platformFees + item.platformFees),
        hostPayable: round(sum.hostPayable + item.hostPayable),
        unallocatedNet: round(sum.unallocatedNet + item.unallocatedNet)
    }), { transactionCount: 0, grossCollections: 0, refundsAndReversals: 0, netCollections: 0, platformFees: 0, hostPayable: 0, unallocatedNet: 0 });
    const lastLedgerEntry = await LedgerEntry.findOne({ createdAt: { $lte: cutoff } }).sort({ createdAt: -1 }).select('_id createdAt').lean();
    if (items.some((item) => !item.organizerId)) items.filter((item) => !item.organizerId).forEach((item) => item.exceptions.push('missing_organizer'));
    const exceptionCount = items.reduce((count, item) => count + item.exceptions.length, 0);

    const batch = await SettlementBatch.create({
        batchKey,
        cutoffAt: cutoff,
        currency: 'LRD',
        totals,
        items,
        exceptionCount,
        sourceLedgerWatermark: lastLedgerEntry ? { lastLedgerEntryId: lastLedgerEntry._id, lastLedgerEntryAt: lastLedgerEntry.createdAt } : undefined,
        createdBy
    });
    return { batch, idempotentReplay: false };
};

module.exports = { round, buildSettlementItem, createSettlementDraft };
