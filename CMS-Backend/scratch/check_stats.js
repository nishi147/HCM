const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Timesheet = require('../models/Timesheet');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const stats = await Timesheet.aggregate([
        { $group: { _id: '$project', total: { $sum: '$duration' }, count: { $sum: 1 } } }
    ]);
    console.log('Project Hours Stats:', stats);
    process.exit(0);
}

run();
