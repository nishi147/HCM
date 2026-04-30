const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, '_id name email');
    const userIds = users.map(u => u._id.toString());
    
    const timesheets = await Timesheet.find({});
    const orphans = timesheets.filter(ts => !userIds.includes(ts.userId.toString()));
    
    console.log('Total Timesheets:', timesheets.length);
    console.log('Orphan Timesheets:', orphans.length);
    
    if (orphans.length > 0) {
        const uniqueOrphanIds = [...new Set(orphans.map(o => o.userId.toString()))];
        console.log('Unique Orphan User IDs in Timesheets:', uniqueOrphanIds);
    }
    
    process.exit(0);
}

run();
