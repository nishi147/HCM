const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Online', 'Other'], default: 'Bank Transfer' },
    transactionId: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
