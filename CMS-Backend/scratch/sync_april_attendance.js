const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const employees = await User.find({ role: 'employee' });
    const leaves = await Leave.find({ status: 'Approved' });

    const monthPrefix = '2026-04';
    const totalDays = 30;

    for (const emp of employees) {
        console.log(`Processing ${emp.name}...`);
        
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${monthPrefix}-${d.toString().padStart(2, '0')}`;
            
            // Find if there's a leave for this day
            const leave = leaves.find(l => 
                l.userId.toString() === emp._id.toString() && 
                dateStr >= l.startDate && dateStr <= l.endDate
            );

            let status = 'Present';
            let checkIn = null;
            let checkOut = null;

            if (leave) {
                status = 'Leave';
                if (leave.dayType === 'Half Day') {
                    // Randomize half day work
                    const inMin = Math.floor(Math.random() * 6);
                    const inSec = Math.floor(Math.random() * 60);
                    checkIn = new Date(`${dateStr}T09:${inMin.toString().padStart(2, '0')}:${inSec.toString().padStart(2, '0')}.000Z`).toISOString();
                    
                    const outMin = Math.floor(Math.random() * 10);
                    const outSec = Math.floor(Math.random() * 60);
                    checkOut = new Date(`${dateStr}T13:${outMin.toString().padStart(2, '0')}:${outSec.toString().padStart(2, '0')}.000Z`).toISOString();
                }
            } else {
                // Regular Present day
                const inMin = Math.floor(Math.random() * 10);
                const inSec = Math.floor(Math.random() * 60);
                checkIn = new Date(`${dateStr}T09:${inMin.toString().padStart(2, '0')}:${inSec.toString().padStart(2, '0')}.000Z`).toISOString();
                
                const outMin = Math.floor(Math.random() * 30);
                const outSec = Math.floor(Math.random() * 60);
                checkOut = new Date(`${dateStr}T18:${outMin.toString().padStart(2, '0')}:${outSec.toString().padStart(2, '0')}.000Z`).toISOString();
            }

            await Attendance.findOneAndUpdate(
                { userId: emp._id, date: dateStr },
                { status, checkIn, checkOut },
                { upsert: true }
            );
        }
    }

    console.log('Finished synchronizing April attendance for all employees.');
    process.exit(0);
}

run();
