const { User } = require('../src/models/User');
const { sequelize } = require('../src/config/database');
require('dotenv').config();

async function promoteToAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const email = process.argv[2] || '1776simon@gmail.com';

    const [count] = await User.update(
      { role: 'admin' },
      { where: { email } }
    );

    if (count > 0) {
      console.log(`✅ Successfully promoted ${email} to admin role`);

      const user = await User.findOne({ where: { email } });
      console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);
    } else {
      console.log(`❌ No user found with email: ${email}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

promoteToAdmin();
