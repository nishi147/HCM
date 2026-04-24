const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const findUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'venu.manshu@gmail.com' });
    if (user) {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      // We can't see the password, but we can check if it matches a default
      const isDefault = await user.comparePassword('password123');
      console.log('Password is default (password123):', isDefault);
    } else {
      console.log('User not found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findUser();
