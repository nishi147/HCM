const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    phase: {
        type: String,
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 0
    },
    comment: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Timesheet', timesheetSchema);
