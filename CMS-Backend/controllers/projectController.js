const Project = require('../models/Project');

// Create a new project
const createProject = async (req, res) => {
    try {
        const { name, description, modules, phases } = req.body;
        const project = new Project({
            name,
            description,
            modules,
            phases
        });
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a project
const updateProject = async (req, res) => {
    try {
        const { name, description, modules, phases, status } = req.body;
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.name = name || project.name;
        project.description = description || project.description;
        project.modules = modules || project.modules;
        project.phases = phases || project.phases;
        project.status = status || project.status;

        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a project
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProject,
    getProjects,
    updateProject,
    deleteProject
};
