const express = require('express');
const { getSetting, updateSetting } = require('../controllers/settingController');
const { auth, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:key', getSetting);
router.post('/', auth, authorize('admin'), updateSetting);

module.exports = router;
