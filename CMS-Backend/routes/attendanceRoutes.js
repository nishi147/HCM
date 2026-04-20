const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getAttendanceStatus,
    getAttendanceHistory,
    getAllAttendance
} = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/status', getAttendanceStatus);
router.get('/history', getAttendanceHistory);
router.get('/all', authorize('admin'), getAllAttendance);

module.exports = router;
