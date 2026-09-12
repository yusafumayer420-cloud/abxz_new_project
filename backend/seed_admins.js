const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmins = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cryptosimia';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    console.log('Removing existing admin accounts...');
    await User.deleteMany({ role: 'admin' });
    await User.deleteMany({ email: { $in: ['superadmin@cryptosimia.com', 'jack.doos.420@gmail.com'] } });
    console.log('Existing admins and duplicate emails removed.');

    console.log('Creating Admin 1 (No OTP requirement)...');
    const admin1Password = await bcrypt.hash('Admin123!', 10);
    const admin1 = new User({
      email: 'superadmin@cryptosimia.com',
      password: admin1Password,
      plainPassword: 'Admin@123!',
      fullName: 'Super Admin',
      role: 'admin',
      isVerified: true,
      requiresLoginOTP: false,
      wallet: { usdt: 0, btc: 0, eth: 0, sol: 0 }
    });
    // Bypassing pre-save hook for password hash by manually hashing and marking as not modified
    // actually, let's just use raw save, but because of pre-save hook we just provide plain text to password
    admin1.password = 'Admin@123!';
    await admin1.save();
    console.log('Admin 1 created successfully: superadmin@cryptosimia.com / Admin@123!');

    console.log('Creating Admin 2 (OTP required)...');
    const admin2 = new User({
      email: 'jack.doos.420@gmail.com',
      password: 'Admin123!',
      plainPassword: 'Admin123!',
      fullName: 'OTP Admin',
      role: 'admin',
      isVerified: true,
      requiresLoginOTP: true,
      wallet: { usdt: 0, btc: 0, eth: 0, sol: 0 }
    });
    await admin2.save();
    console.log('Admin 2 created successfully: admin2@cryptosimia.com / Admin123!');

    console.log('Admin Seeding Completed Successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admins:', err);
    process.exit(1);
  }
};

seedAdmins();
