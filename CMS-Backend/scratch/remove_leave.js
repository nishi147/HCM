const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// scratch/ is inside CMS-Backend/, so ../ goes up to CMS-Backend/
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
console.log('MONGODB_URI loaded:', !!MONGODB_URI);

const UserSchema = new mongoose.Schema({ name: String });
const LeaveSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    startDate: String,
    endDate: String,
    reason: String,
    status: String
});

const User = mongoose.model('User', UserSchema);
const Leave = mongoose.model('Leave', LeaveSchema);

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('Connected');

    const user = await User.findOne({ name: /venugopal/i });
    if (!user) {
        console.log('User not found. Listing first 10 users:');
        const all = await User.find({}, 'name').limit(10);
        all.forEach(u => console.log(' -', u.name, u._id));
        return;
    }

    console.log('Found user:', user.name, user._id.toString());
    const leaves = await Leave.find({ userId: user._id });
    console.log('All leaves:');
    leaves.forEach(l => console.log(' -', l._id, l.type, l.startDate, '->', l.endDate, `reason:"${l.reason}"`, l.status));

    const result = await Leave.deleteOne({ userId: user._id, reason: 'jjj' });
    console.log('Deleted count:', result.deletedCount);

}).catch(e => console.error(e)).finally(() => mongoose.connection.close());
