const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    receiptUrl: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
