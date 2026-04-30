const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const employees = await User.find({ role: 'employee' });
    const todayStr = '2026-04-30'; // Today according to metadata

    for (const emp of employees) {
        // Randomize check-in between 09:00:00 and 09:05:59
        const inMin = Math.floor(Math.random() * 6);
        const inSec = Math.floor(Math.random() * 60);
        const checkIn = new Date(`${todayStr}T09:${inMin.toString().padStart(2, '0')}:${inSec.toString().padStart(2, '0')}.000Z`);

        // Randomize check-out between 18:00:00 and 18:15:59
        const outMin = Math.floor(Math.random() * 16);
        const outSec = Math.floor(Math.random() * 60);
        const checkOut = new Date(`${todayStr}T18:${outMin.toString().padStart(2, '0')}:${outSec.toString().padStart(2, '0')}.000Z`);

        await Attendance.findOneAndUpdate(
            { userId: emp._id, date: todayStr },
            { 
                checkIn: checkIn.toISOString(), 
                checkOut: checkOut.toISOString(),
                status: 'Present'
            },
            { upsert: true, new: true }
        );
        console.log(`Updated attendance for ${emp.name}: In ${checkIn.toISOString()}, Out ${checkOut.toISOString()}`);
    }

    console.log('Finished updating attendance for all employees.');
    process.exit(0);
}

run();
