const mongoose = require('mongoose');
const User = require('./models/User');
const Timesheet = require('./models/Timesheet');
const Leave = require('./models/Leave');
const Holiday = require('./models/Holiday');
const Payroll = require('./models/Payroll');
const dotenv = require('dotenv');

dotenv.config();

const users = [
    {
        name: 'Sarah Johnson',
        email: 'sarah@demo.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Engineer',
        doj: '2024-01-15',
        status: 'Active'
    },
    {
        name: 'Michael Chen',
        email: 'michael@demo.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Engineer',
        doj: '2023-11-10',
        status: 'Active'
    },
    {
        name: 'Emily Davis',
        email: 'emily@demo.com',
        password: 'password123',
        role: 'employee',
        department: 'Design',
        position: 'Design',
        doj: '2024-02-01',
        status: 'Active'
    },
    {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: 'adminpassword',
        role: 'admin',
        department: 'Management',
        position: 'System Admin',
        doj: '2023-01-01',
        status: 'Active'
    }
];

const initialHolidays = [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-14', name: 'Tamil New Year' },
    { date: '2026-05-01', name: 'May Day' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-11-01', name: 'Diwali' },
    { date: '2026-11-14', name: "Children's Day" },
    { date: '2026-12-25', name: 'Christmas' }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        await Timesheet.deleteMany({});
        await Leave.deleteMany({});
        await Holiday.deleteMany({});
        await Payroll.deleteMany({});

        console.log('Seeding Holidays...');
        await Holiday.insertMany(initialHolidays);

        for (const u of users) {
            console.log(`Working on ${u.email}...`);
            await User.deleteOne({ email: u.email });
            const user = new User(u);
            const savedUser = await user.save();
            console.log(`Successfully created ${u.email}`);

            if (u.role === 'employee') {
                // Sample Timesheets
                const timesheetEntries = [
                    {
                        userId: savedUser._id,
                        project: 'Customer Portal',
                        module: 'Dashboard',
                        phase: 'Development',
                        date: '2026-03-03',
                        hours: 8,
                        status: 'Approved'
                    },
                    {
                        userId: savedUser._id,
                        project: u.name === 'Sarah Johnson' ? 'HR Management' : 'Inventory System',
                        module: 'Database',
                        phase: 'Development',
                        date: '2026-03-04',
                        hours: 7,
                        status: 'Pending'
                    }
                ];
                await Timesheet.insertMany(timesheetEntries);

                // Sample Leaves
                if (u.name === 'Sarah Johnson') {
                    await Leave.create({
                        userId: savedUser._id,
                        startDate: '2026-03-15',
                        endDate: '2026-03-16',
                        type: 'Casual Leave',
                        reason: 'Personal work',
                        status: 'Pending'
                    });
                }

                // Sample Payrolls (Matching Screenshot)
                const payrolls = [];
                if (u.name === 'Sarah Johnson') {
                    payrolls.push(
                        { userId: savedUser._id, month: 'January 2026', base: 7083, bonus: 500, tax: 1200, deductions: 300, netPay: 6083, status: 'Paid' },
                        { userId: savedUser._id, month: 'February 2026', base: 7083, bonus: 0, tax: 1200, deductions: 300, netPay: 5583, status: 'Paid' },
                        { userId: savedUser._id, month: 'March 2026', base: 7083, bonus: 750, tax: 1200, deductions: 300, netPay: 6333, status: 'Pending' }
                    );
                } else if (u.name === 'Michael Chen') {
                    payrolls.push(
                        { userId: savedUser._id, month: 'January 2026', base: 7667, bonus: 600, tax: 1400, deductions: 350, netPay: 6517, status: 'Paid' },
                        { userId: savedUser._id, month: 'February 2026', base: 7667, bonus: 0, tax: 1400, deductions: 350, netPay: 5917, status: 'Paid' },
                        { userId: savedUser._id, month: 'March 2026', base: 7667, bonus: 800, tax: 1400, deductions: 350, netPay: 6717, status: 'Pending' }
                    );
                } else if (u.name === 'Emily Davis') {
                    payrolls.push(
                        { userId: savedUser._id, month: 'March 2026', base: 6500, bonus: 300, tax: 1000, deductions: 250, netPay: 5550, status: 'Pending' }
                    );
                }
                await Payroll.insertMany(payrolls);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('SEED ERROR:');
        console.error(err);
        process.exit(1);
    }
}

seed();
