const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const {
    createPayroll,
    getAllPayroll,
    updatePayrollStatus,
    getMyPayroll
} = require('../controllers/payrollController');

router.use(auth);

// Employee-accessible routes (no admin requirement)
router.get('/my', getMyPayroll);

// Admin-only routes
router.get('/all', authorize('admin'), getAllPayroll);
router.post('/', authorize('admin'), createPayroll);
router.put('/:id/status', authorize('admin'), updatePayrollStatus);

module.exports = router;
