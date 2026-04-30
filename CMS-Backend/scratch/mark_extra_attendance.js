const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const targetEmails = [
        'manshu.vajramani@gmail.com',
        'manshu.pujitha@gmail.com',
        'manshu.sireesha@gmail.com',
        'manshu.nasreen@gmail.com',
        'manshu.venu@gmail.com',
        'pavithra@manshulearning.com'
    ];

    const employees = await User.find({ email: { $in: targetEmails } });
    console.log(`Found ${employees.length} employees to update`);

    const dates = ['2026-04-28', '2026-04-29'];
    const attendanceRecords = [];

    for (const emp of employees) {
        for (const date of dates) {
            attendanceRecords.push({
                userId: emp._id,
                date: date,
                checkIn: '09:00:00',
                checkOut: '18:00:00',
                status: 'Present'
            });
        }
    }

    for (const rec of attendanceRecords) {
        await Attendance.findOneAndUpdate(
            { userId: rec.userId, date: rec.date },
            rec,
            { upsert: true }
        );
    }

    console.log(`Successfully marked attendance for 28th and 29th April for ${employees.length} employees`);
    process.exit(0);
}

run();
