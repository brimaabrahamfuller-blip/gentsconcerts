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
    // New promotional videos are uploaded as files and stored durably in GridFS.
    // promoVideoUrl remains only for legacy event records created before file uploads.
    promoVideoId: { type: String, trim: true },
    promoVideoName: { type: String, trim: true },
    promoVideoContentType: { type: String, trim: true },
    promoVideoSize: { type: Number },
    promoVideoUrl: { type: String, trim: true },
    ticketTiers: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        sold: { type: Number, default: 0 }
    }],
    // Events are never public merely because a host submitted a complete form.
    // Legacy active/pending values remain readable during the transition.
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'published', 'rejected', 'cancelled', 'pending', 'active'],
        default: 'draft',
        index: true
    },
    submittedForReviewAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
