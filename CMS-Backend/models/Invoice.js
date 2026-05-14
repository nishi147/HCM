const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    items: [invoiceItemSchema],
    subTotal: { type: Number, required: true, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Draft', 'Pending', 'Paid', 'Overdue'], default: 'Draft' },
    issueDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date, required: true },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
