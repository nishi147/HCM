const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const {
    getHolidays,
    addHoliday,
    updateHoliday,
    deleteHoliday
} = require('../controllers/holidayController');

router.get('/', getHolidays);
router.post('/', auth, authorize('admin'), addHoliday);
router.put('/:id', auth, authorize('admin'), updateHoliday);
router.delete('/:id', auth, authorize('admin'), deleteHoliday);

module.exports = router;
