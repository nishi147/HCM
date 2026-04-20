const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    updateLeaveStatus
} = require('../controllers/leaveController');

router.use(auth);

router.post('/', applyLeave);
router.get('/my', getMyLeaves);
router.get('/all', authorize('admin'), getAllLeaves);
router.put('/:id/status', authorize('admin'), updateLeaveStatus);

module.exports = router;
