const mongoose = require('mongoose');
const User = require('./models/User');
const Timesheet = require('./models/Timesheet');
const Leave = require('./models/Leave');
const dotenv = require('dotenv');

dotenv.config();

async function checkDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const userCount = await User.countDocuments();
        const timesheetCount = await Timesheet.countDocuments();
        const leaveCount = await Leave.countDocuments();

        console.log('\n--- Database Summary ---');
        console.log(`Users: ${userCount}`);
        console.log(`Timesheets: ${timesheetCount}`);
        console.log(`Leaves: ${leaveCount}`);

        if (timesheetCount > 0) {
            console.log('\nSample Timesheet:');
            const sampleTs = await Timesheet.findOne().populate('userId', 'name');
            console.log(JSON.stringify(sampleTs, null, 2));
        }

        if (leaveCount > 0) {
            console.log('\nSample Leave:');
            const sampleLeave = await Leave.findOne().populate('userId', 'name');
            console.log(JSON.stringify(sampleLeave, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDB();
