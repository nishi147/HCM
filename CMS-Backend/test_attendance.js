const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testAttendance() {
    try {
        console.log('Logging in as employee...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'sarah@demo.com',
            password: 'password123'
        });
        token = loginRes.data.token;
        console.log('Login successful.');

        // 1. Check status (should be not checked in)
        console.log('Checking status...');
        const statusRes = await axios.get(`${API_URL}/attendance/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status:', statusRes.data.message || 'Check-in found');

        // 2. Check In
        console.log('Testing Check In...');
        const checkInRes = await axios.post(`${API_URL}/attendance/check-in`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Check-in success:', checkInRes.data.checkIn);

        // 3. Check status again
        console.log('Verifying status...');
        const verifyRes = await axios.get(`${API_URL}/attendance/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (verifyRes.data.checkIn) console.log('Status verified: Checked In.');
        else throw new Error('Status verification failed');

        // 4. Check Out
        console.log('Testing Check Out...');
        const checkOutRes = await axios.post(`${API_URL}/attendance/check-out`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Check-out success:', checkOutRes.data.checkOut);

        console.log('ATTENDANCE API TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('ATTENDANCE TEST FAILED:');
        console.error(err.response?.data || err.message);
        process.exit(1);
    }
}

testAttendance();
