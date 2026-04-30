const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Holiday = require('../models/Holiday');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const holidays = await Holiday.find({});
    const aprilHolidays = holidays.filter(h => h.date && h.date.startsWith('2026-04'));
    console.log(JSON.stringify(aprilHolidays, null, 2));
    process.exit(0);
}

run();
