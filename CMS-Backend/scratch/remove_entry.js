const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms';

const TimesheetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: String,
    module: String,
    phase: String,
    date: String,
    duration: Number,
    comment: String,
    status: String
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String
});

const Timesheet = mongoose.model('Timesheet', TimesheetSchema);
const User = mongoose.model('User', UserSchema);

async function removeEntry() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the user
        const user = await User.findOne({ name: 'Venugopal Byrapaneni' });
        if (!user) {
            console.log('User Venugopal Byrapaneni not found');
            return;
        }

        console.log('Found user with ID:', user._id);

        // Find and delete the timesheet
        const result = await Timesheet.deleteOne({
            userId: user._id,
            project: 'HCM update',
            module: 'sales',
            phase: 'alpha'
        });

        if (result.deletedCount > 0) {
            console.log('Successfully removed timesheet entry');
        } else {
            console.log('No matching timesheet entry found');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.connection.close();
    }
}

removeEntry();
