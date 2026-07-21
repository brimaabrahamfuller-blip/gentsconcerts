const mongoose = require('mongoose');
const flagSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetType: { type: String, enum: ['User', 'Event', 'Comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
    actionTaken: { type: String },
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Flag', flagSchema);
