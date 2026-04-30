const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const nasreen = await User.findOne({ email: 'manshu.nasreen@gmail.com' });
    if (!nasreen) {
        console.error('Nasreen not found');
        process.exit(1);
    }

    // Add the specific timesheets from the screenshot
    const timesheets = [
        {
            userId: nasreen._id,
            project: '011_Proofpoint_OWASP',
            module: 'M08',
            phase: 'Beta',
            duration: 8,
            date: '2026-04-27',
            comment: 'Working on OWASP M08 Beta tasks',
            status: 'Approved'
        },
        {
            userId: nasreen._id,
            project: '011_Proofpoint_OWASP',
            module: 'M08',
            phase: 'Beta',
            duration: 9,
            date: '2026-04-24',
            comment: 'Completing OWASP M08 Beta implementation',
            status: 'Approved'
        }
    ];

    await Timesheet.insertMany(timesheets);
    console.log('Added timesheets for Shaik Nasreen');

    process.exit(0);
}

run();
