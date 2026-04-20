const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/authMiddleware');
const {
    createProject,
    getProjects,
    updateProject,
    deleteProject
} = require('../controllers/projectController');

// All project routes require authentication
router.use(auth);

// Get all projects is available to both employees and admins
router.get('/', getProjects);

// CRUD operations are restricted to admins
router.post('/', authorize('admin'), createProject);
router.put('/:id', authorize('admin'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

module.exports = router;
