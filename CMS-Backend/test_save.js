const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const userData = {
            name: 'Sarah Test',
            email: 'sarah@demo.com',
            password: 'password123',
            role: 'employee'
        };

        console.log('Deleting existing...');
        await User.deleteOne({ email: userData.email });

        console.log('Saving new user...');
        const user = new User(userData);
        try {
            await user.save();
            console.log('SAVE SUCCESSFUL');
        } catch (saveErr) {
            console.error('SAVE FAILED BEYOND EXPECTATION:');
            console.error(JSON.stringify(saveErr, null, 2));
            console.error(saveErr.message);
            if (saveErr.errors) {
                console.error('Validation Errors:', saveErr.errors);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('OUTER ERROR:');
        console.error(err);
        process.exit(1);
    }
}

run();
