const Role = require('../models/Role');
const Department = require('../models/Department');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    // 1. Seed Roles
    const rolesToSeed = ['STUDENT', 'STAFF', 'HOD', 'PRINCIPAL', 'ADMIN'];
    for (const rName of rolesToSeed) {
      const existingRole = await Role.findOne({ roleName: rName });
      if (!existingRole) {
        await Role.create({ roleName: rName });
        console.log(`Role seeded: ${rName}`);
      }
    }

    // 2. Seed Departments
    const departmentsToSeed = [
      { name: "Computer Science", code: "CSE" },
      { name: "Information Technology", code: "IT" },
      { name: "Artificial Intelligence and Data Science", code: "AIDS" },
      { name: "Electronics and Communication", code: "ECE" },
      { name: "Electrical and Electronics", code: "EEE" },
      { name: "Mechanical", code: "MECH" },
      { name: "Civil", code: "CIVIL" }
    ];

    for (const dept of departmentsToSeed) {
      const existingDept = await Department.findOne({ departmentName: dept.name });
      if (!existingDept) {
        await Department.create({
          departmentName: dept.name,
          departmentCode: dept.code
        });
        console.log(`Department seeded: ${dept.name} (${dept.code})`);
      }
    }

    // 3. Seed Default Admin User
    const adminEmail = 'admin@college.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const adminRole = await Role.findOne({ roleName: 'ADMIN' });
      if (!adminRole) {
        throw new Error('ADMIN role not found after seeding roles');
      }

      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        fullName: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: adminRole._id,
        active: true
      });
      console.log('Default Admin user seeded successfully.');
    }
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
  }
};

module.exports = seedData;
