const express = require('express');
const { register, login, changePassword } = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/change_password', changePassword);

// Example protected route
router.get('/me', auth, (req, res) => {
    res.json(req.user);
});

module.exports = router;
