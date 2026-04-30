const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ name: 'Mallela Vajramani' });
    const att = await Attendance.find({ 
        userId: user._id, 
        date: { $regex: /^2026-04/ } 
    }).sort({ date: 1 });
    
    console.log('Attendance dates for Mallela Vajramani in April 2026:');
    console.log(JSON.stringify(att.map(a => a.date), null, 2));
    
    process.exit(0);
}

run();
