const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const {
    addTimesheet,
    getAllTimesheets,
    getMyTimesheets,
    updateTimesheetStatus
} = require('../controllers/timesheetController');

router.use(auth);

router.post('/', addTimesheet);
router.get('/my', getMyTimesheets);
router.get('/all', authorize('admin'), getAllTimesheets);
router.put('/:id/status', authorize('admin'), updateTimesheetStatus);

module.exports = router;
