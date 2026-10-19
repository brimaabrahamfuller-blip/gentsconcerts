#!/usr/bin/env node

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const PaymentAttempt = require('../models/PaymentAttempt');
const { postCollection } = require('../services/ledgerService');

const APPLY = process.argv.includes('--apply');
const BATCH_SIZE = 100;

const statusForTransaction = (status) => {
    if (status === 'completed') return 'successful';
    if (status === 'failed') return 'failed';
    if (status === 'pending') return 'pending';
    return 'initiated';
};

const run = async () => {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
    await mongoose.connect(process.env.MONGODB_URI);

    const summary = {
        mode: APPLY ? 'apply' : 'dry-run',
        scanned: 0,
        alreadyLinked: 0,
        wouldLink: 0,
        linked: 0,
        wouldPostLedger: 0,
        postedLedger: 0,
        exceptions: []
    };

    const cursor = Transaction.find({ paymentAttemptId: { $exists: false } })
        .sort({ createdAt: 1 })
        .cursor({ batchSize: BATCH_SIZE });

    for await (const transaction of cursor) {
        summary.scanned += 1;
        const ticket = await Ticket.findById(transaction.ticketId);
        if (!ticket) {
            summary.exceptions.push({ transactionId: String(transaction._id), reason: 'ticket_missing' });
            continue;
        }

        const idempotencyKey = `legacy-transaction-${transaction._id}`;
        const providerReference = transaction.mtnTransactionId || undefined;
        const attemptStatus = statusForTransaction(transaction.status);
        const canPostLedger = transaction.status === 'completed'
            && Number(transaction.amount) > 0
            && Boolean(providerReference);

        if (transaction.status === 'completed' && Number(transaction.amount) > 0 && !providerReference) {
            summary.exceptions.push({
                transactionId: String(transaction._id),
                ticketId: String(ticket._id),
                reason: 'completed_without_mtn_reference',
                action: 'manual_finance_review_required'
            });
        }

        summary.wouldLink += 1;
        if (canPostLedger) summary.wouldPostLedger += 1;
        if (!APPLY) continue;

        let attempt = await PaymentAttempt.findOne({ transactionId: transaction._id });
        if (!attempt) {
            attempt = await PaymentAttempt.create({
                ticketId: ticket._id,
                transactionId: transaction._id,
                eventId: transaction.eventId,
                userId: transaction.userId,
                idempotencyKey,
                attemptNumber: 1,
                providerReference,
                amount: transaction.amount,
                currency: transaction.currency,
                status: attemptStatus,
                providerStatus: `LEGACY_${String(transaction.status || 'UNKNOWN').toUpperCase()}`,
                completedAt: ['successful', 'failed'].includes(attemptStatus) ? transaction.updatedAt : undefined,
                requestContext: { source: 'legacy_transaction_reconciliation' }
            });
        } else {
            summary.alreadyLinked += 1;
        }

        ticket.paymentAttemptId = attempt._id;
        transaction.paymentAttemptId = attempt._id;
        transaction.idempotencyKey = transaction.idempotencyKey || idempotencyKey;

        if (canPostLedger && !transaction.ledgerPostingGroupId) {
            const posting = await postCollection({
                ticket,
                transaction,
                providerReference,
                idempotencyKey: attempt.idempotencyKey
            });
            transaction.ledgerPostingGroupId = posting.postingGroupId;
            ticket.ledgerPostingGroupId = posting.postingGroupId;
            summary.postedLedger += posting.alreadyPosted ? 0 : 1;
        }

        await Promise.all([ticket.save(), transaction.save()]);
        summary.linked += 1;
    }

    console.log(JSON.stringify(summary, null, 2));
    await mongoose.disconnect();
    if (summary.exceptions.length && APPLY) process.exitCode = 2;
};

run().catch(async (error) => {
    console.error(error.stack || error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
