const Holiday = require('../models/Holiday');

// Get all holidays
const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ date: 1 });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add new holiday
const addHoliday = async (req, res) => {
    try {
        const { date, name, type } = req.body;
        const existingHoliday = await Holiday.findOne({ date });
        if (existingHoliday) {
            return res.status(400).json({ message: 'Holiday already exists for this date' });
        }
        const holiday = new Holiday({ date, name, type });
        await holiday.save();
        res.status(201).json(holiday);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update holiday
const updateHoliday = async (req, res) => {
    try {
        const { date, name, type } = req.body;
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        holiday.date = date || holiday.date;
        holiday.name = name || holiday.name;
        holiday.type = type || holiday.type;
        await holiday.save();
        res.json(holiday);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete holiday
const deleteHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        await Holiday.deleteOne({ _id: req.params.id });
        res.json({ message: 'Holiday removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getHolidays,
    addHoliday,
    updateHoliday,
    deleteHoliday
};
