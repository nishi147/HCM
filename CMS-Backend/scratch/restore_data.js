const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    // 1. Update/Create Users
    const usersData = [
        { name: 'Angalakuduru Pavithra', email: 'pavithra@manshulearning.com', role: 'employee', department: 'Engineering', position: 'Software Engineer', doj: '2025-01-01', status: 'Active', password: 'password123' },
        { name: 'Venugopal Byrapaneni', email: 'manshu.venu@gmail.com' }
    ];

    let pavithra = await User.findOne({ email: 'pavithra@manshulearning.com' });
    if (!pavithra) {
        pavithra = await User.create(usersData[0]);
        console.log('Created Angalakuduru Pavithra');
    }

    await User.findOneAndUpdate({ email: 'manshu.venu@gmail.com' }, { name: 'Venugopal Byrapaneni' });
    console.log('Updated Venugopal name');

    const allEmployees = await User.find({ role: 'employee' });
    const userMap = {};
    allEmployees.forEach(u => {
        userMap[u.name] = u._id;
    });

    // 2. Clear and Populate Leaves
    await Leave.deleteMany({});
    const leaves = [
        { name: 'Angalakuduru Pavithra', date: '2026-04-25', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'United Machining_Customer c...' },
        { name: 'Angalakuduru Pavithra', date: '2026-04-26', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'Personal' },
        { name: 'Angalakuduru Pavithra', date: '2026-04-25', type: 'Comp Off', dayType: 'Full Day', status: 'Rejected', reason: 'Electrical Work Practice - QA ...' },
        { name: 'Gowri Sirisha', date: '2026-04-27', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'Personal Leave' },
        { name: 'Y Naga pujitha', date: '2026-04-24', type: 'Paid Leave', dayType: 'Half Day', status: 'Approved', reason: 'Personal work' },
        { name: 'Mallela Vajramani', date: '2026-04-24', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'personal' },
        { name: 'Venugopal Byrapaneni', date: '2026-04-23', type: 'Paid Leave', dayType: 'Half Day', status: 'Approved', reason: 'half day leve' },
        { name: 'Mallela Vajramani', date: '2026-04-18', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'Electrical Work Practice - Alph...' },
        { name: 'Mallela Vajramani', date: '2026-04-20', type: 'Comp Off', dayType: 'Full Day', status: 'Rejected', reason: 'Electrical Work Practice - Alph...' },
        { name: 'Angalakuduru Pavithra', date: '2026-04-19', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'Cenovus Phase II - Electrical_...' },
        { name: 'Mallela Vajramani', date: '2026-04-19', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'Electrical Work Practice_1 slid...' },
        { name: 'Gowri Sirisha', date: '2026-04-18', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'Woking on HAS054_electrical...' },
        { name: 'Shaik Nasreen', date: '2026-04-18', type: 'Comp Off', dayType: 'Full Day', status: 'Approved', reason: 'Working on Electrical_Work_P...' },
        { name: 'Mallela Vajramani', date: '2026-04-14', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'Personal' },
        { name: 'Shaik Nasreen', date: '2026-04-16', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'Personal Leave' },
        { name: 'Mallela Vajramani', date: '2026-04-10', type: 'Unpaid Leave', dayType: 'Full Day', status: 'Approved', reason: 'Personal' },
        { name: 'Angalakuduru Pavithra', date: '2026-04-07', type: 'Paid Leave', dayType: 'Full Day', status: 'Approved', reason: 'personal' }
    ];

    const leaveDocs = leaves.map(l => ({
        userId: userMap[l.name],
        startDate: l.date,
        endDate: l.date,
        type: l.type,
        dayType: l.dayType,
        status: l.status,
        reason: l.reason
    })).filter(l => l.userId);

    await Leave.insertMany(leaveDocs);
    console.log(`Inserted ${leaveDocs.length} leave records`);

    // 3. Populate Attendance (Present for all working days)
    // We'll skip weekends and holidays for a cleaner look, but the user wants "green bar".
    // I'll mark all Mon-Fri as Present.
    const holidays = ['2026-04-03', '2026-04-14'];
    const attendanceRecords = [];

    for (let day = 1; day <= 27; day++) {
        const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
        const date = new Date(2026, 3, day); // April is month 3
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        if (isWeekend || holidays.includes(dateStr)) continue;

        allEmployees.forEach(u => {
            if (u.role === 'admin' || u.name === 'test') return;
            
            // Check if user already has attendance for this day
            attendanceRecords.push({
                userId: u._id,
                date: dateStr,
                checkIn: '09:00:00',
                checkOut: '18:00:00',
                status: 'Present'
            });
        });
    }

    // Use upsert to avoid duplicates if some records exist
    for (const rec of attendanceRecords) {
        await Attendance.findOneAndUpdate(
            { userId: rec.userId, date: rec.date },
            rec,
            { upsert: true }
        );
    }
    console.log(`Populated/Updated attendance for ${attendanceRecords.length} records`);

    process.exit(0);
}

run();
