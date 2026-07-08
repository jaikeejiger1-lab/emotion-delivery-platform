const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users.");

    // Generate hashed OTP for delivery partner (pin: 123456)
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash('123456', salt);

    // Create test users
    const users = [
      {
        firstName: 'Demo',
        lastName: 'Customer',
        email: 'customer@hardyy.in',
        phone: '+919876543210',
        password: 'Password123',
        role: 'customer',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'admin@hardyy.in',
        phone: '+919876543211',
        password: 'Password123',
        role: 'admin',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Demo',
        lastName: 'Staff',
        email: 'staff@hardyy.in',
        phone: '+919876543213',
        password: 'Password123',
        role: 'staff',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Demo',
        lastName: 'Rider',
        email: 'delivery@hardyy.in',
        phone: '+919876543212',
        password: 'Password123',
        role: 'delivery_partner',
        isVerified: true,
        isActive: true,
        otpHash: otpHash,
        otpExpire: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiration
      }
    ];

    for (const u of users) {
      await User.create(u);
    }

    console.log("✅ Seeded test users successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
