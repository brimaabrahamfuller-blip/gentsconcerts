const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSettlementItem, round } = require('../services/settlementService');

test('settlement item calculates net, fee, host payable, and unallocated amounts', () => {
    const item = buildSettlementItem({
        eventId: 'event-1',
        organizerId: 'organizer-1',
        transactions: [
            { _id: 'tx-1', amount: 1000, commission: 100, hostPayout: 800 },
            { _id: 'tx-2', amount: 500, commission: 50, hostPayout: 450 }
        ],
        adjustmentsByTransaction: new Map([['tx-1', 100]])
    });
    assert.equal(item.grossCollections, 1500);
    assert.equal(item.refundsAndReversals, 100);
    assert.equal(item.netCollections, 1400);
    assert.equal(item.platformFees, 150);
    assert.equal(item.hostPayable, 1250);
    assert.equal(item.unallocatedNet, 0);
    assert.deepEqual(item.exceptions, []);
});

test('settlement item flags unallocated net and over-allocation', () => {
    const item = buildSettlementItem({
        eventId: 'event-2',
        organizerId: null,
        transactions: [{ _id: 'tx-3', amount: 1000, commission: 100, hostPayout: 950 }],
        adjustmentsByTransaction: new Map()
    });
    assert.equal(item.unallocatedNet, 0);
    assert.ok(item.exceptions.includes('allocation_exceeds_net:tx-3'));
});

test('round uses two decimal places', () => {
    assert.equal(round(10.126), 10.13);
});
