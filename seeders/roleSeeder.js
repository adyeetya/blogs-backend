const Role = require('../models/Role');

const seedRoles = async () => {
  const roles = [
    {
      name: 'USER',
      description: 'Regular user with read access',
      permissions: ['read_blogs']
    },
    {
      name: 'AUTHOR',
      description: 'Blog author with write permissions',
      permissions: ['read_blogs', 'write_blogs', 'edit_own_blogs', 'delete_own_blogs']
    },
    {
      name: 'ADMIN',
      description: 'Admin with elevated permissions',
      permissions: [
        'read_blogs', 'write_blogs', 'edit_own_blogs', 'edit_all_blogs',
        'delete_own_blogs', 'delete_all_blogs', 'manage_users', 'manage_categories',
        'view_analytics'
      ]
    },
    {
      name: 'SUPER_ADMIN',
      description: 'Super admin with full system access',
      permissions: [
        'read_blogs', 'write_blogs', 'edit_own_blogs', 'edit_all_blogs',
        'delete_own_blogs', 'delete_all_blogs', 'manage_users', 'manage_admins',
        'manage_categories', 'view_analytics', 'manage_system'
      ]
    }
  ];

  for (const role of roles) {
    const existingRole = await Role.findOne({ name: role.name });
    if (!existingRole) {
      await Role.create(role);
      console.log(`✅ Role '${role.name}' created`);
    }
  }
};

module.exports = { seedRoles };
