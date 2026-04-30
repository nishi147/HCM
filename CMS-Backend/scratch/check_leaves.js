const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Leave = require('../models/Leave');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const leaves = await Leave.find({
        $or: [
            { startDate: { $regex: '^2026-04' } },
            { endDate: { $regex: '^2026-04' } }
        ]
    });
    console.log(JSON.stringify(leaves, null, 2));
    process.exit(0);
}

run();
