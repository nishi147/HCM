const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String, required: true },
    address: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
