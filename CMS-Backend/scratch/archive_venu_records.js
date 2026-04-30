const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Timesheet = require('../models/Timesheet');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email: 'manshu.venu@gmail.com' });
    if (!user) {
        console.error('User not found');
        process.exit(1);
    }

    const result = await Timesheet.updateMany(
        { 
            userId: user._id, 
            project: { $regex: /010|011/ } 
        },
        { $set: { isDeleted: true } }
    );

    console.log(`Archived ${result.modifiedCount} timesheet records for ${user.email}`);
    process.exit(0);
}

run();
