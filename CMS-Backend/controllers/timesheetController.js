const Timesheet = require('../models/Timesheet');

// Add new timesheet entry
const addTimesheet = async (req, res) => {
    try {
        const { project, module, phase, date, userId, duration, comment } = req.body;

        // If userId is provided and it's different from the requester's ID, check if the requester is an admin
        let finalUserId = req.user.id;
        if (userId && userId !== req.user.id.toString()) {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can add timesheets for other employees' });
            }
            finalUserId = userId;
        }

        const timesheet = new Timesheet({
            userId: finalUserId,
            project,
            module,
            phase,
            date,
            duration: duration || 0,
            comment: comment || '',
            status: 'Pending'
        });
        await timesheet.save();
        res.status(201).json(timesheet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all timesheets (Admin)
const getAllTimesheets = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { isDeleted: false };

        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            query.date = startDate;
        }

        const timesheets = await Timesheet.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 });
        res.json(timesheets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get employee's own timesheets
const getMyTimesheets = async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = { userId: req.user.id, isDeleted: false };

        if (month && year) {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`; // Simplified for query
            query.date = { $gte: startDate, $lte: endDate };
        }

        const timesheets = await Timesheet.find(query).sort({ date: -1 });
        res.json(timesheets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update timesheet status (Admin: Approve/Reject)
const updateTimesheetStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const timesheet = await Timesheet.findById(req.params.id);
        if (!timesheet) {
            return res.status(404).json({ message: 'Timesheet not found' });
        }

        timesheet.status = status;
        await timesheet.save();
        res.json(timesheet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTimesheet = async (req, res) => {
    try {
        const timesheet = await Timesheet.findById(req.params.id);
        if (!timesheet) {
            return res.status(404).json({ message: 'Timesheet not found' });
        }

        // Only allow user to delete their own or admin to delete any
        if (timesheet.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        timesheet.isDeleted = true;
        await timesheet.save();
        res.json({ message: 'Timesheet removed from panel' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addTimesheet,
    getAllTimesheets,
    getMyTimesheets,
    updateTimesheetStatus,
    deleteTimesheet
};
