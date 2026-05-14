const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All finance routes require admin privileges
router.use(auth);
router.use(authorize('admin'));

// Clients
router.get('/clients', financeController.getClients);
router.post('/clients', financeController.createClient);
router.put('/clients/:id', financeController.updateClient);
router.delete('/clients/:id', financeController.deleteClient);

// Invoices
router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.put('/invoices/:id', financeController.updateInvoice);
router.delete('/invoices/:id', financeController.deleteInvoice);

// Payments
router.get('/payments', financeController.getPayments);
router.post('/payments', financeController.createPayment);
router.delete('/payments/:id', financeController.deletePayment);

// Expenses
router.get('/expenses', financeController.getExpenses);
router.post('/expenses', financeController.createExpense);
router.put('/expenses/:id', financeController.updateExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

// Dashboard
router.get('/dashboard', financeController.getDashboardStats);

module.exports = router;
