const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const findVenu = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ name: /Venugopal/i });
    if (user) {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      const isDefault = await user.comparePassword('password123');
      console.log('Password is default (password123):', isDefault);
    } else {
      console.log('User Venugopal not found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findVenu();
