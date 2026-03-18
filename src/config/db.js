const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin@akademiacbt.com';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AkadaPassword#2!';

  const existingAdmin = await User.findOne({ username: defaultAdminUsername });
  if (existingAdmin) {
    // Ensure the existing account uses the Admin role
    if (existingAdmin.role !== 'Admin') {
      existingAdmin.role = 'Admin';
      await existingAdmin.save();
      console.log('✅ Updated existing user to Admin role');
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(defaultAdminPassword, 12);
  await User.create({
    username: defaultAdminUsername,
    password: hashedPassword,
    role: 'Admin'
  });

  console.log(`✅ Default admin created (${defaultAdminUsername})`);
};

const connectDB = async () => {
  try {
    // Ensure your .env has MONGO_URI
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Ensure a default Admin account exists (default credentials are documented)
    await ensureDefaultAdmin();
  } catch (error) {
    console.error(`❌ Database Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;