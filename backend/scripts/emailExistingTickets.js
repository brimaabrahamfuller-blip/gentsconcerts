require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Event = require('../models/Event');
const emailService = require('../services/emailService');

const run = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gentsconcerts';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const confirmedTickets = await Ticket.find({ paymentStatus: 'confirmed' }).populate('userId').populate('eventId');
        console.log(`Found ${confirmedTickets.length} confirmed tickets to process.`);

        for (const ticket of confirmedTickets) {
            if (ticket.userId && ticket.eventId) {
                console.log(`Sending ticket confirmation email to ${ticket.userId.email} for event ${ticket.eventId.title}...`);
                await emailService.sendTicketConfirmation(ticket.userId, ticket, ticket.eventId);
            }
        }

        console.log('Finished emailing existing ticket holders.');
        process.exit(0);
    } catch (error) {
        console.error('Error emailing existing tickets:', error);
        process.exit(1);
    }
};

run();
