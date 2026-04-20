const express = require('express');
const { register, login } = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Example protected route
router.get('/me', auth, (req, res) => {
    res.json(req.user);
});

module.exports = router;
