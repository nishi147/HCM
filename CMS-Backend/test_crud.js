const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testCRUD() {
    try {
        console.log('Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'adminpassword'
        });
        token = loginRes.data.token;
        console.log('Login successful.');

        // 1. Create
        console.log('Testing CREATE employee...');
        const createRes = await axios.post(`${API_URL}/employees`, {
            name: 'Test Employee API',
            email: 'test-api@demo.com',
            password: 'password123',
            role: 'employee'
        }, { headers: { Authorization: `Bearer ${token}` } });
        const employeeId = createRes.data._id;
        console.log(`Employee created with ID: ${employeeId}`);

        // 2. Read (Verify creation)
        console.log('Testing READ employees...');
        const readRes = await axios.get(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const found = readRes.data.find(e => e._id === employeeId);
        if (found) console.log('Found created employee in list.');
        else throw new Error('Created employee not found in list');

        // 3. Update
        console.log('Testing UPDATE employee...');
        await axios.put(`${API_URL}/employees/${employeeId}`, {
            name: 'Test Employee UPDATED'
        }, { headers: { Authorization: `Bearer ${token}` } });

        const verifyUpdate = await axios.get(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updated = verifyUpdate.data.find(e => e._id === employeeId);
        if (updated.name === 'Test Employee UPDATED') console.log('Update verified.');
        else throw new Error('Update failed');

        // 4. Delete
        console.log('Testing DELETE employee...');
        await axios.delete(`${API_URL}/employees/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const verifyDelete = await axios.get(`${API_URL}/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const deleted = verifyDelete.data.find(e => e._id === employeeId);
        if (!deleted) console.log('Deletion verified.');
        else throw new Error('Deletion failed');

        console.log('ALL CRUD TESTS PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('CRUD TEST FAILED:');
        console.error(err.response?.data || err.message);
        process.exit(1);
    }
}

testCRUD();
