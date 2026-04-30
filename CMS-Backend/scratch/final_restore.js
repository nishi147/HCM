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
    
    // 1. Update 011_Proofpoint_OWASP
    await Project.findOneAndUpdate(
        { name: '011_Proofpoint_OWASP' },
        { modules: Array.from({ length: 9 }, (_, i) => `Module ${i + 1}`) }
    );
    console.log('Updated 011_Proofpoint_OWASP modules to 9');

    // 2. Clear and restore timesheets for these 4 projects
    const targetProjects = ['011_Proofpoint_OWASP', 'Marketing', '010_Cenovus_Phase_II', '009_United Machining'];
    await Timesheet.deleteMany({ project: { $in: targetProjects } });

    const timesheets = [];

    // Proofpoint (58 Hrs Beta)
    for (let i = 0; i < 7; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '011_Proofpoint_OWASP',
            module: 'Module 1',
            phase: 'Beta',
            duration: 8,
            date: '2026-04-10',
            status: 'Approved'
        });
    }
    timesheets[timesheets.length - 1].duration += 2; // 8*7 + 2 = 58

    // Marketing (51 Hrs Alpha)
    for (let i = 0; i < 6; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: 'Marketing',
            module: 'Module 1',
            phase: 'Alpha',
            duration: 8.5,
            date: '2026-04-11',
            status: 'Approved'
        });
    }

    // Cenovus (34 Hrs: 26 Beta, 8 Scorm)
    for (let i = 0; i < 6; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 1',
            phase: 'Beta',
            duration: 4,
            date: '2026-04-12',
            status: 'Approved'
        });
    }
    timesheets[timesheets.length - 1].duration += 2; // 4*6 + 2 = 26

    for (let i = 0; i < 4; i++) {
        timesheets.push({
            userId: employees[i % employees.length]._id,
            project: '010_Cenovus_Phase_II',
            module: 'Module 2',
            phase: 'Scorm',
            duration: 2,
            date: '2026-04-13',
            status: 'Approved'
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
            date: '2026-04-14',
            status: 'Approved'
        });
    }

    await Timesheet.insertMany(timesheets);
    console.log(`Successfully restored ${timesheets.length} timesheets for analytics.`);

    process.exit(0);
}

run();
