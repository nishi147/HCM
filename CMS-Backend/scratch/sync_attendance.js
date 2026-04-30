const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const approvedLeaves = await Leave.find({ status: 'Approved' });
    console.log(`Found ${approvedLeaves.length} approved leaves`);

    for (const leave of approvedLeaves) {
        // Mark attendance as 'Leave' for the days covered by the leave
        // For now, since startDate and endDate are the same in our restore script:
        await Attendance.findOneAndUpdate(
            { userId: leave.userId, date: leave.startDate },
            { status: 'Leave', checkIn: null, checkOut: null },
            { upsert: true }
        );
        console.log(`Marked ${leave.startDate} as Leave for userId ${leave.userId}`);
    }

    process.exit(0);
}

run();
