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
    
    console.log(`Found ${employees.length} employees and ${projects.length} projects`);

    // Target projects exactly as they are in the DB
    const projectNames = ['Marketing', '010_Cenovus_Phase_II', '009_United Machining'];
    const dbProjects = projects.filter(p => projectNames.includes(p.name));
    
    console.log('Projects found in DB:', dbProjects.map(p => p.name));

    // Clear and restore
    await Timesheet.deleteMany({ project: { $in: projectNames } });

    const timesheets = [];

    // Marketing (51 Hrs)
    for (let i = 0; i < 6; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: 'Marketing',
            module: 'Module 1',
            phase: 'Alpha', // Using capitalized to match frontend defaults
            duration: 8.5,
            date: '2026-04-15',
            status: 'Approved',
            comment: 'Marketing tasks'
        });
    }

    // Cenovus (34 Hrs: 26 Beta, 8 SCORM)
    for (let i = 0; i < 6; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 1',
            phase: 'Beta',
            duration: 4,
            date: '2026-04-16',
            status: 'Approved',
            comment: 'Cenovus Beta work'
        });
    }
    // Adjust to 26
    timesheets[timesheets.length - 1].duration += 2;

    for (let i = 0; i < 4; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 2',
            phase: 'SCORM',
            duration: 2,
            date: '2026-04-17',
            status: 'Approved',
            comment: 'Cenovus SCORM work'
        });
    }

    // United Machining (6 Hrs Beta)
    for (let i = 0; i < 3; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '009_United Machining',
            module: 'Module 1',
            phase: 'Beta',
            duration: 2,
            date: '2026-04-18',
            status: 'Approved',
            comment: 'United work'
        });
    }

    await Timesheet.insertMany(timesheets);
    console.log(`Successfully restored ${timesheets.length} timesheets.`);

    process.exit(0);
}

run();
