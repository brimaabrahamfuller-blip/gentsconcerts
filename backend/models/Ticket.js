const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Ticket must map to an active event validation block.']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Ticket must contain an authorized consumer ownership property.']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'expired', 'cancelled'],
        default: 'pending'
    },
    momoReference: {
        type: String,
        required: [true, 'MTN MoMo unique payment reference validation string required.'],
        trim: true,
        match: [/^[a-zA-Z0-9\-]+$/, 'Invalid MTN transaction character format detected.']
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true // Key index used for high performance cron sweep cleanups
    }
}, { timestamps: true });

// Strict structural sanitization hook before archiving to MongoDB collections
TicketSchema.pre('save', function(next) {
    if (this.momoReference) {
        this.momoReference = mongoose.sanitizeFilter(this.momoReference);
    }
    next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
