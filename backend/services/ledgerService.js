const crypto = require('crypto');
const LedgerEntry = require('../models/LedgerEntry');

const postCollection = async ({ ticket, transaction, providerReference, idempotencyKey }) => {
    const postingGroupId = `COL-${transaction._id.toString()}`;
    const existing = await LedgerEntry.countDocuments({ postingGroupId });
    if (existing === 2) {
        return { postingGroupId, alreadyPosted: true };
    }
    if (existing !== 0) {
        throw new Error(`Incomplete ledger posting detected for ${postingGroupId}; manual reconciliation is required.`);
    }

    const amount = Number(transaction.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Cannot post a collection with an invalid amount.');

    const common = {
        postingGroupId,
        entryType: 'collection',
        amount,
        currency: transaction.currency,
        ticketId: ticket._id,
        transactionId: transaction._id,
        eventId: transaction.eventId,
        userId: transaction.userId,
        provider: 'mtn_momo',
        providerReference,
        idempotencyKey,
        status: 'posted'
    };

    try {
        await LedgerEntry.create([
            { ...common, lineNumber: 1, accountCode: 'mtn_clearing', direction: 'debit' },
            { ...common, lineNumber: 2, accountCode: 'ticket_sales_revenue', direction: 'credit' }
        ]);
    } catch (error) {
        if (error?.code === 11000) {
            const replayCount = await LedgerEntry.countDocuments({ postingGroupId });
            if (replayCount === 2) return { postingGroupId, alreadyPosted: true };
        }
        throw error;
    }

    return { postingGroupId, alreadyPosted: false };
};

const buildIdempotencyKey = (requestKey, fallbackParts = []) => {
    const supplied = String(requestKey || '').trim();
    if (supplied) return supplied.slice(0, 160);
    return crypto.createHash('sha256').update(fallbackParts.join('|')).digest('hex');
};

const buildAdjustmentPosting = ({ type, postingGroupId, amount, currency, ticket, transaction, providerReference, idempotencyKey }) => {
    if (!['refund', 'reversal'].includes(type)) throw new Error('Ledger adjustment type must be refund or reversal.');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new Error('Ledger adjustment amount must be positive.');
    if (!providerReference || !String(providerReference).trim()) throw new Error('A verified provider reference is required for a ledger adjustment.');

    const common = {
        postingGroupId,
        entryType: type,
        amount: Number(amount),
        currency,
        ticketId: ticket._id,
        transactionId: transaction._id,
        eventId: transaction.eventId,
        userId: transaction.userId,
        provider: 'mtn_momo',
        providerReference: String(providerReference).trim(),
        idempotencyKey,
        status: 'posted'
    };

    return [
        { ...common, lineNumber: 1, accountCode: 'ticket_sales_revenue', direction: 'debit' },
        { ...common, lineNumber: 2, accountCode: 'mtn_clearing', direction: 'credit' }
    ];
};

const postAdjustment = async ({ type, ticket, transaction, providerReference, idempotencyKey, amount }) => {
    if (!transaction?.mtnTransactionId) throw new Error('Cannot post an adjustment without the original MTN transaction reference.');
    if (!ticket?._id || !transaction?._id) throw new Error('Ticket and transaction records are required for an adjustment.');

    const collectionGroupId = `COL-${transaction._id.toString()}`;
    const collectionLines = await LedgerEntry.find({ postingGroupId: collectionGroupId, status: 'posted' }).select('amount currency providerReference');
    if (collectionLines.length !== 2) throw new Error('The original collection ledger is incomplete; manual reconciliation is required.');
    const originalAmount = Number(collectionLines[0].amount);
    const currency = collectionLines[0].currency;
    if (currency !== 'LRD' || transaction.currency !== 'LRD') throw new Error('Only LRD adjustments are supported by this control.');
    if (!collectionLines.some((line) => line.providerReference === transaction.mtnTransactionId)) {
        throw new Error('The original ledger provider reference does not match the transaction reference.');
    }

    const adjustmentAmount = Number(amount);
    if (!Number.isFinite(adjustmentAmount) || adjustmentAmount <= 0 || adjustmentAmount > originalAmount) {
        throw new Error('Adjustment amount must be positive and no greater than the original collection.');
    }

    const postingGroupId = `${type === 'refund' ? 'REF' : 'REV'}-${crypto.createHash('sha256').update(String(idempotencyKey)).digest('hex').slice(0, 40)}`;
    const existingGroup = await LedgerEntry.countDocuments({ postingGroupId });
    if (existingGroup === 2) return { postingGroupId, alreadyPosted: true, amount: adjustmentAmount, entryType: type };
    if (existingGroup !== 0) throw new Error(`Incomplete ${type} ledger posting detected for ${postingGroupId}; manual reconciliation is required.`);

    const existing = await LedgerEntry.find({ transactionId: transaction._id, entryType: { $in: ['refund', 'reversal'] }, status: 'posted' }).select('postingGroupId amount');
    const alreadyAdjusted = existing.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    if (alreadyAdjusted + adjustmentAmount > originalAmount) {
        throw new Error('The requested adjustment exceeds the remaining refundable/reversible balance.');
    }

    const lines = buildAdjustmentPosting({ type, postingGroupId, amount: adjustmentAmount, currency, ticket, transaction, providerReference, idempotencyKey });
    try {
        await LedgerEntry.create(lines);
    } catch (error) {
        if (error?.code === 11000 && await LedgerEntry.countDocuments({ postingGroupId }) === 2) {
            return { postingGroupId, alreadyPosted: true, amount: adjustmentAmount, entryType: type };
        }
        throw error;
    }
    return { postingGroupId, alreadyPosted: false, amount: adjustmentAmount, entryType: type };
};

module.exports = { postCollection, buildIdempotencyKey, buildAdjustmentPosting, postAdjustment };
