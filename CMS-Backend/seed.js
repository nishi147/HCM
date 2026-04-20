const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const users = [
    {
        name: 'Sarah Employee',
        email: 'sarah@demo.com',
        password: 'password123',
        role: 'employee'
    },
    {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: 'adminpassword',
        role: 'admin'
    }
];

const seedDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');

        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB.');

        for (const userData of users) {
            console.log(`Processing user: ${userData.email}`);

            // Delete if exists
            await User.deleteOne({ email: userData.email });

            // Create new user
            const user = new User(userData);
            await user.save();

            console.log(`User seeded: ${userData.label || userData.name}`);
        }

        console.log('All test users seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed with error:');
        console.error(err);
        if (err.stack) console.error(err.stack);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`- Field ${key}: ${err.errors[key].message}`);
            });
        }
        process.exit(1);
    }
};

seedDB();
