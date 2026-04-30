require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Timesheet = require('../models/Timesheet');
const Leave = require('../models/Leave');
const Project = require('../models/Project');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');

const deleteData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const userRes = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`Deleted ${userRes.deletedCount} employees.`);

        const tsRes = await Timesheet.deleteMany({});
        console.log(`Deleted ${tsRes.deletedCount} timesheets.`);

        const leaveRes = await Leave.deleteMany({});
        console.log(`Deleted ${leaveRes.deletedCount} leaves.`);

        const projRes = await Project.deleteMany({});
        console.log(`Deleted ${projRes.deletedCount} projects.`);

        const payrollRes = await Payroll.deleteMany({});
        console.log(`Deleted ${payrollRes.deletedCount} payrolls.`);

        const attRes = await Attendance.deleteMany({});
        console.log(`Deleted ${attRes.deletedCount} attendance records.`);

        console.log('Data cleanup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error deleting data:', err);
        process.exit(1);
    }
};

deleteData();
