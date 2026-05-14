const express = require('express');
const { register, login, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/change_password', changePassword);

// Fetch current user full profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await require('../models/User').findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
