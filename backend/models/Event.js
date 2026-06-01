const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Music', 'Comedy', 'Cultural', 'Sports', 'Food'], required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, default: 'Liberia' },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    flyerImage: { type: String },
    ticketTiers: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        sold: { type: Number, default: 0 }
    }],
    status: { type: String, enum: ['pending', 'active', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
