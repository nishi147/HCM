const Leave = require('../models/Leave');

// Submit leave request
const applyLeave = async (req, res) => {
    try {
        const { startDate, endDate, type, dayType, reason } = req.body;
        const leave = new Leave({
            userId: req.user.id,
            startDate,
            endDate,
            type,
            dayType: dayType || 'Full Day',
            reason,
            status: 'Pending'
        });
        await leave.save();
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all leaves (Admin)
const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get employee's own leaves
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update leave status (Admin)
const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leave = await Leave.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        leave.status = status;
        await leave.save();
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    applyLeave,
    getAllLeaves,
    getMyLeaves,
    updateLeaveStatus
};
