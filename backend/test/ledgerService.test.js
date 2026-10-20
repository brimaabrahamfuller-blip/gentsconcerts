const test = require('node:test');
const assert = require('node:assert/strict');
const LedgerEntry = require('../models/LedgerEntry');
const { buildAdjustmentPosting, buildIdempotencyKey, postAdjustment } = require('../services/ledgerService');

const ticket = { _id: '507f1f77bcf86cd799439011' };
const transaction = {
    _id: '507f1f77bcf86cd799439012',
    eventId: '507f1f77bcf86cd799439013',
    userId: '507f1f77bcf86cd799439014'
};

for (const type of ['refund', 'reversal']) {
    test(`${type} posting is balanced and uses opposite collection accounts`, () => {
        const lines = buildAdjustmentPosting({
            type,
            postingGroupId: `${type.toUpperCase()}-TEST`,
            amount: 1250,
            currency: 'LRD',
            ticket,
            transaction,
            providerReference: `mtn-${type}-verified`,
            idempotencyKey: `${type}-idem-1`
        });

        assert.equal(lines.length, 2);
        assert.equal(lines[0].direction, 'debit');
        assert.equal(lines[1].direction, 'credit');
        assert.equal(lines[0].accountCode, 'ticket_sales_revenue');
        assert.equal(lines[1].accountCode, 'mtn_clearing');
        assert.equal(lines[0].amount, lines[1].amount);
        assert.equal(lines[0].entryType, type);
        assert.equal(lines[1].entryType, type);
    });
}

test('adjustment posting requires a verified provider reference', () => {
    assert.throws(() => buildAdjustmentPosting({
        type: 'refund',
        postingGroupId: 'REF-TEST',
        amount: 100,
        currency: 'LRD',
        ticket,
        transaction,
        providerReference: '',
        idempotencyKey: 'refund-idem-2'
    }), /provider reference/);
});

test('idempotency key fallback is deterministic', () => {
    assert.equal(
        buildIdempotencyKey('', ['refund', transaction._id, '1250']),
        buildIdempotencyKey('', ['refund', transaction._id, '1250'])
    );
    assert.equal(buildIdempotencyKey(' supplied-key '), 'supplied-key');
});

test('duplicate adjustment posting is idempotent', async () => {
    const originalFind = LedgerEntry.find;
    const originalCountDocuments = LedgerEntry.countDocuments;
    const originalCreate = LedgerEntry.create;
    const groups = new Set();
    let createCalls = 0;

    LedgerEntry.find = (query) => ({
        select: async () => query.postingGroupId === `COL-${transaction._id}`
            ? [{ amount: 1250, currency: 'LRD', providerReference: 'mtn-collection-1' }, { amount: 1250, currency: 'LRD', providerReference: 'mtn-collection-1' }]
            : []
    });
    LedgerEntry.countDocuments = async ({ postingGroupId }) => groups.has(postingGroupId) ? 2 : 0;
    LedgerEntry.create = async (lines) => {
        createCalls += 1;
        groups.add(lines[0].postingGroupId);
        return lines;
    };

    try {
        const input = { type: 'refund', ticket, transaction: { ...transaction, mtnTransactionId: 'mtn-collection-1', currency: 'LRD' }, providerReference: 'mtn-refund-1', idempotencyKey: 'refund-replay-1', amount: 1250 };
        const first = await postAdjustment(input);
        const replay = await postAdjustment(input);
        assert.equal(first.alreadyPosted, false);
        assert.equal(replay.alreadyPosted, true);
        assert.equal(createCalls, 1);
    } finally {
        LedgerEntry.find = originalFind;
        LedgerEntry.countDocuments = originalCountDocuments;
        LedgerEntry.create = originalCreate;
    }
});
