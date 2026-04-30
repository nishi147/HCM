const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const byDate = await Attendance.aggregate([
        { $match: { date: { $regex: /^2026-04/ } } },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    
    console.log('Attendance counts per day in April 2026:');
    console.log(JSON.stringify(byDate, null, 2));
    
    const totalRecords = byDate.reduce((acc, curr) => acc + curr.count, 0);
    console.log('Total records:', totalRecords);
    
    process.exit(0);
}

run();
