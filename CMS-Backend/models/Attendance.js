const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // String format YYYY-MM-DD for easier querying by day
        required: true
    },
    checkIn: {
        type: String // HH:MM:SS
    },
    checkOut: {
        type: String // HH:MM:SS
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late', 'Leave'],
        default: 'Present'
    }
}, { timestamps: true });

// Ensure unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
