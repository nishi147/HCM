const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
    try {
        console.log('Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'admin@demo.com';
        await User.deleteOne({ email });
        console.log('Deleted old admin.');

        const hashedPassword = await bcrypt.hash('adminpassword', 10);
        const user = new User({
            name: 'Admin User',
            email: email,
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        console.log('Admin account created successfully.');

        process.exit(0);
    } catch (err) {
        console.error('FAILED:');
        console.error(err.message);
        process.exit(1);
    }
}

run();
