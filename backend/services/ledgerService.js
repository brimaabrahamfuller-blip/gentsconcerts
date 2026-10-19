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

module.exports = { postCollection, buildIdempotencyKey };
