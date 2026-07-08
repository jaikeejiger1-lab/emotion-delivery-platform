/**
 * seed_admin.js — Master Admin Rescue / Seed Script
 * 
 * Usage:
 *   node seed_admin.js
 * 
 * Force-creates or overwrites the Master Admin account in MongoDB:
 *   Email: admin@hardyy.in
 *   Password: Admin@123
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hardyy';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    const adminEmail = 'admin@hardyy.in';
    const adminPassword = 'Admin@123';

    let adminUser = await User.findOne({ email: adminEmail });
    if (adminUser) {
      console.log(`⚠️ Admin account (${adminEmail}) found. Overwriting credentials and restoring superadmin access...`);
      adminUser.password = adminPassword; // Pre-save hook will hash this!
      adminUser.role = 'superadmin';
      adminUser.isVerified = true;
      adminUser.isActive = true;
      adminUser.isBanned = false;
      adminUser.failedLoginAttempts = 0;
      adminUser.accountLockedUntil = null;
      await adminUser.save();
      console.log('✨ Master Admin account updated successfully!');
    } else {
      console.log(`🆕 Creating new Master Admin account (${adminEmail})...`);
      adminUser = await User.create({
        firstName: 'Master',
        lastName: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
        isVerified: true,
        isActive: true,
      });
      console.log('✨ Master Admin account created successfully!');
    }

    console.log('-------------------------------------------');
    console.log('📧 Email:    admin@hardyy.in');
    console.log('🔑 Password: Admin@123');
    console.log('🛡️ Role:     superadmin');
    console.log('-------------------------------------------');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB. You can now log in!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error rescuing Master Admin:', error);
    process.exit(1);
  }
};

seedAdmin();
