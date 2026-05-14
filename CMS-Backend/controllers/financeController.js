const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

// -- CLIENTS --
exports.getClients = async (req, res) => {
    try {
        const clients = await Client.find().sort({ createdAt: -1 });
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createClient = async (req, res) => {
    try {
        const client = new Client(req.body);
        await client.save();
        res.status(201).json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// -- INVOICES --
exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('clientId').sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        // Auto-generate invoice number if not provided
        let { invoiceNumber } = req.body;
        if (!invoiceNumber) {
            const count = await Invoice.countDocuments();
            invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
            req.body.invoiceNumber = invoiceNumber;
        }

        const invoice = new Invoice(req.body);
        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('clientId');
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// -- PAYMENTS --
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find().populate('invoiceId').populate('clientId').sort({ date: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const payment = new Payment(req.body);
        await payment.save();
        
        // Update invoice status based on total payments
        const invoice = await Invoice.findById(req.body.invoiceId);
        if (invoice) {
            const allPayments = await Payment.find({ invoiceId: invoice._id });
            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
            
            if (totalPaid >= invoice.grandTotal) {
                invoice.status = 'Paid';
            } else if (totalPaid > 0) {
                // If it was overdue or draft, maybe we just keep it pending or partially paid (we only have Pending)
                if (invoice.status === 'Draft' || invoice.status === 'Overdue') {
                    invoice.status = 'Pending';
                }
            }
            await invoice.save();
        }

        res.status(201).json(payment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        await Payment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Payment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// -- EXPENSES --
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const expense = new Expense(req.body);
        await expense.save();
        res.status(201).json(expense);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(expense);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// -- DASHBOARD STATS --
exports.getDashboardStats = async (req, res) => {
    try {
        const invoices = await Invoice.find();
        const payments = await Payment.find();
        const expenses = await Expense.find();

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        let pendingPayments = 0;
        invoices.forEach(inv => {
            if (inv.status !== 'Paid' && inv.status !== 'Draft') {
                const paidForThis = payments.filter(p => p.invoiceId.toString() === inv._id.toString()).reduce((s, p) => s + p.amount, 0);
                pendingPayments += Math.max(0, inv.grandTotal - paidForThis);
            }
        });

        const monthlyData = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear();
            const month = d.getMonth();

            const monthPayments = payments.filter(p => {
                const pDate = new Date(p.date);
                return pDate.getMonth() === month && pDate.getFullYear() === year;
            });
            const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

            const monthExpenses = expenses.filter(e => {
                const eDate = new Date(e.date);
                return eDate.getMonth() === month && eDate.getFullYear() === year;
            });
            const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

            monthlyData.push({
                month: monthName,
                revenue: monthRevenue,
                expenses: monthExpenseTotal
            });
        }

        res.json({
            totalRevenue,
            totalExpenses,
            pendingPayments,
            invoiceCount: invoices.length,
            recentInvoices: invoices.slice(-5).reverse(),
            monthlyData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
