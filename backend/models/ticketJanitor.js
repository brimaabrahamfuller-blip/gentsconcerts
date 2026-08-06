const cron = require('node-cron');
const Ticket = require('../models/Ticket');

/**
 * Sweeps the database collection every 5 minutes to release lock reservations 
 * on unpaid/expired event allocations.
 */
const initializeTicketJanitorWorker = () => {
    // Runs every 5 minutes safely
    cron.schedule('*/5 * * * *', async () => {
        console.log('Executing automated ticket expiration routine database sweep...');
        try {
            const cutoffTime = new Date();
            
            // Atomically update tickets matching expiration criteria
            const result = await Ticket.updateMany(
                {
                    status: 'pending',
                    expiresAt: { $lt: cutoffTime }
                },
                {
                    $set: { status: 'expired' }
                }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`Janitor Worker Success: ${result.modifiedCount} unconfirmed tickets shifted to expired.`);
                // Note: Emitting an inventory adjustment hook can return tickets to the pool here.
            }
        } catch (error) {
            console.error('Critical Error executing automated backend ticket sweep collection:', error);
        }
    });
};

module.exports = { initializeTicketJanitorWorker };

