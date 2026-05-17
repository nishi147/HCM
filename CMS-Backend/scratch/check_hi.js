const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Attendance = require('../models/Attendance');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const employee = await User.findOne({ email: 'hi@gmail.com' });
        if (!employee) {
            console.log('Employee hi@gmail.com not found!');
            process.exit(1);
        }

        console.log('\n--- Employee Details ---');
        console.log(`ID: ${employee._id}`);
        console.log(`Name: ${employee.name}`);
        console.log(`Email: ${employee.email}`);
        console.log(`DOJ: ${employee.doj}`);
        console.log(`Created At: ${employee.createdAt}`);

        const attendanceList = await Attendance.find({ userId: employee._id });
        console.log('\n--- Attendance Records ---');
        console.log(`Count: ${attendanceList.length}`);
        console.log(JSON.stringify(attendanceList, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
