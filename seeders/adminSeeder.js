const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

const seedSuperAdmin = async () => {
  const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
  if (!superAdminRole) {
    console.error('❌ SUPER_ADMIN role not found');
    return;
  }

  const existingAdmin = await User.findOne({ email: 'admin@blog.com' });
  if (!existingAdmin) {
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@blog.com',
      password: 'admin123',
      role: superAdminRole._id,
      isActive: true
    });

    await superAdmin.save();
    console.log('✅ Super Admin created: admin@blog.com / admin123');
  }
};

module.exports = { seedSuperAdmin };
