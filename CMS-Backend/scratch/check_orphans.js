const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, '_id name email');
    const userIds = users.map(u => u._id.toString());
    
    const attendance = await Attendance.find({});
    const orphans = attendance.filter(a => !userIds.includes(a.userId.toString()));
    
    console.log('Total Attendance:', attendance.length);
    console.log('Orphan Records:', orphans.length);
    
    if (orphans.length > 0) {
        const uniqueOrphanIds = [...new Set(orphans.map(o => o.userId.toString()))];
        console.log('Unique Orphan User IDs:', uniqueOrphanIds);
    }
    
    process.exit(0);
}

run();
