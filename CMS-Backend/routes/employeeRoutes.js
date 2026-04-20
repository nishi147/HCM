const express = require('express');
const router = express.Router();
const {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require admin privileges
router.use(auth);
router.use(authorize('admin'));

router.get('/', getEmployees);
router.post('/', addEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
