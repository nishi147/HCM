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

async function checkEntry() {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await User.findOne({ name: 'Venugopal Byrapaneni' });
        if (user) {
            const entries = await Timesheet.find({
                userId: user._id,
                project: 'HCM update',
                module: 'sales',
                phase: 'alpha'
            });
            console.log(`Found ${entries.length} entries remaining for this criteria.`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

checkEntry();
