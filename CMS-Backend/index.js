console.log('CMS Backend Starting...');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const projectRoutes = require('./routes/projectRoutes');
const settingRoutes = require('./routes/settingRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'https://hcm-8e7v.vercel.app'],
    credentials: true
}));

// Routes
const { changePassword } = require('./controllers/authController');
app.post('/api/auth/change-password', changePassword);
app.post('/api/auth/change_password', changePassword);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingRoutes);

app.get('/', (req, res) => {
    res.send('CMS Backend API is running...');
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.log('MongoDB connection error:', err);
    });
