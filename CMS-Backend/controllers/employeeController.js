const User = require('../models/User');

// Get all employees
const getEmployees = async (req, res) => {
    try {
        const employees = await User.find({ role: 'employee' }).select('-password');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add new employee
const addEmployee = async (req, res) => {
    try {
        const { name, email, password, role, department, position, doj, dob, status, baseSalary } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const employee = new User({
            name,
            email,
            password: password || 'password123',
            role: role || 'employee',
            department,
            position,
            doj,
            dob,
            baseSalary: baseSalary || 0,
            status: status || 'Active'
        });

        await employee.save();
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update employee
const updateEmployee = async (req, res) => {
    try {
        const { name, email, password, role, department, position, doj, dob, status, baseSalary } = req.body;
        const employee = await User.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        employee.name = name || employee.name;
        employee.email = email || employee.email;
        employee.role = role || employee.role;
        employee.department = department || employee.department;
        employee.position = position || employee.position;
        employee.doj = doj || employee.doj;
        employee.dob = dob || employee.dob;
        employee.baseSalary = baseSalary !== undefined ? baseSalary : employee.baseSalary;
        employee.status = status || employee.status;

        if (password && password.trim() !== '') {
            employee.password = password;
        }

        await employee.save();
        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'Employee removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee
};
