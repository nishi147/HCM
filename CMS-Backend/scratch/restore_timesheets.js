const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Project = require('../models/Project');
const Timesheet = require('../models/Timesheet');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const employees = await User.find({ role: 'employee' });
    const projects = await Project.find({});
    
    const marketing = projects.find(p => p.name === 'Marketing');
    const cenovus = projects.find(p => p.name === '010_Cenovus_Phase_II');
    const united = projects.find(p => p.name === '009_United Machining');

    if (!marketing || !cenovus || !united) {
        console.error('Missing projects! Make sure you created them.');
        process.exit(1);
    }

    // Clear existing timesheets for these projects to avoid duplicates if any
    await Timesheet.deleteMany({ project: { $in: ['Marketing', '010_Cenovus_Phase_II', '009_United Machining'] } });

    const timesheets = [];

    // 1. Marketing: 51 Hrs (Alpha)
    // We'll give 8.5 hours each to 6 employees
    employees.forEach((emp, i) => {
        if (i >= 6) return;
        timesheets.push({
            userId: emp._id,
            project: 'Marketing',
            module: 'Module 1',
            phase: 'alpha',
            duration: 8.5,
            date: `2026-04-${(10 + i).toString().padStart(2, '0')}`,
            comment: 'Marketing work',
            status: 'Approved'
        });
    });

    // 2. Cenovus: 34 Hrs (Beta: 26, SCORM: 8)
    // Beta: 26 Hrs (approx 4.33 each for 6 emps)
    employees.forEach((emp, i) => {
        if (i >= 6) return;
        timesheets.push({
            userId: emp._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 1',
            phase: 'beta',
            duration: 4, // 4 * 6 = 24
            date: `2026-04-${(15 + i).toString().padStart(2, '0')}`,
            comment: 'Cenovus Beta work',
            status: 'Approved'
        });
    });
    // Add 2 more hours to get to 26
    timesheets[6].duration += 2; 

    // SCORM: 8 Hrs (approx 1.33 each for 6 emps)
    employees.forEach((emp, i) => {
        if (i >= 6) return;
        timesheets.push({
            userId: emp._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 2',
            phase: 'scorm',
            duration: 1, // 1 * 6 = 6
            date: `2026-04-${(20 + i).toString().padStart(2, '0')}`,
            comment: 'Cenovus SCORM work',
            status: 'Approved'
        });
    });
    // Add 2 more hours to get to 8
    timesheets[12].duration += 2;

    // 3. United Machining: 6 Hrs (Beta: 6)
    // 1 hour each for 6 emps
    employees.forEach((emp, i) => {
        if (i >= 6) return;
        timesheets.push({
            userId: emp._id,
            project: '009_United Machining',
            module: 'Module 1',
            phase: 'beta',
            duration: 1,
            date: `2026-04-${(25 + i).toString().padStart(2, '0')}`,
            comment: 'United Machining work',
            status: 'Approved'
        });
    });

    await Timesheet.insertMany(timesheets);
    console.log(`Successfully restored ${timesheets.length} timesheet records to populate analytics.`);

    process.exit(0);
}

run();
