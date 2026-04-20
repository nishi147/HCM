const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';

const request = (method, url, data, token) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                let responseBody = {};
                if (body) {
                    try {
                        responseBody = JSON.parse(body);
                    } catch (e) {
                        responseBody = body;
                    }
                }
                const response = {
                    status: res.statusCode,
                    data: responseBody
                };
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(response);
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

async function verifyFix() {
    try {
        console.log('Logging in as admin...');
        const loginRes = await request('POST', `${API_URL}/auth/login`, {
            email: 'admin@demo.com',
            password: 'adminpassword'
        });
        const adminToken = loginRes.data.token;
        console.log('Admin login successful.');

        // 1. Get employees
        console.log('Fetching employees...');
        const employeesRes = await request('GET', `${API_URL}/employees`, null, adminToken);

        // Find a non-admin employee
        const employee = employeesRes.data.find(e => e.role === 'employee');
        if (!employee) {
            console.error('No employee found to test with.');
            process.exit(1);
        }
        console.log(`Testing with employee: ${employee.name} (${employee._id})`);

        // 2. Add timesheet as Admin for Employee
        console.log(`Adding timesheet for ${employee.name} using admin token...`);
        const timesheetData = {
            userId: employee._id,
            project: 'Verification Project ' + Date.now(),
            module: 'Fix Verification',
            phase: 'Testing',
            date: new Date().toISOString().split('T')[0],
            hours: 5
        };

        const addRes = await request('POST', `${API_URL}/timesheets`, timesheetData, adminToken);

        const newTimesheet = addRes.data;
        console.log('Timesheet created:', newTimesheet._id);

        // 3. Verify the userId in the created timesheet
        if (newTimesheet.userId === employee._id) {
            console.log('SUCCESS: Timesheet correctly assigned to the employee ID.');
        } else {
            console.error(`FAILURE: Timesheet assigned to ${newTimesheet.userId} instead of ${employee._id}`);
            process.exit(1);
        }

        // 4. Verify in the list (populate)
        console.log('Verifying in the complete list...');
        const allRes = await request('GET', `${API_URL}/timesheets/all`, null, adminToken);

        const verifiedEntry = allRes.data.find(t => t._id === newTimesheet._id);
        if (verifiedEntry && verifiedEntry.userId && (verifiedEntry.userId.name === employee.name || verifiedEntry.userId._id === employee._id)) {
            console.log(`SUCCESS: Found correctly assigned timesheet in list.`);
        } else {
            console.error('FAILURE: Employee not found or incorrect in the list.');
            process.exit(1);
        }

        console.log('\nVERIFICATION PASSED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('VERIFICATION FAILED:');
        console.error(err.message);
        process.exit(1);
    }
}

verifyFix();
