const { User, Team, TeamMember, sequelize } = require('../models');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Starting Teams and Users seeding...');

    // Check if we already have users (don't overwrite existing data)
    const existingUsersCount = await User.count();
    if (existingUsersCount > 1) {
      console.log('⚠️  Users already exist. Skipping user seeding to preserve existing data.');
      return;
    }

    // Sample users data
    const usersData = [
      { name: 'Alex Johnson', email: 'alex@company.com', avatar: 'AJ', role: 'member', password: 'password123' },
      { name: 'Sam Chen', email: 'sam@company.com', avatar: 'SC', role: 'member', password: 'password123' },
      { name: 'Jordan Blake', email: 'jordan@company.com', avatar: 'JB', role: 'manager', password: 'password123' },
      { name: 'Morgan Lee', email: 'morgan@company.com', avatar: 'ML', role: 'member', password: 'password123' },
      { name: 'Casey Rivers', email: 'casey@company.com', avatar: 'CR', role: 'member', password: 'password123' }
    ];

    // Create users
    console.log('Creating users...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Get the first user as the team creator (or use the authenticated user)
    const creator = createdUsers[0];

    // Sample teams data
    const teamsData = [
      {
        name: 'Engineering',
        description: 'Engineering and development team',
        color: '#60a5fa',
        members: [createdUsers[0].id, createdUsers[1].id, createdUsers[3].id] // Alex, Sam, Morgan
      },
      {
        name: 'Design',
        description: 'Design and UX team',
        color: '#8b5cf6',
        members: [createdUsers[0].id, createdUsers[2].id] // Alex, Jordan
      },
      {
        name: 'Marketing',
        description: 'Marketing and communications team',
        color: '#ec4899',
        members: [createdUsers[2].id, createdUsers[4].id] // Jordan, Casey
      }
    ];

    // Create teams
    console.log('\nCreating teams...');
    for (const teamData of teamsData) {
      const { members, ...teamInfo } = teamData;
      const team = await Team.create({
        ...teamInfo,
        createdBy: creator.id
      });

      // Add members to team
      for (const userId of members) {
        await TeamMember.create({
          teamId: team.id,
          userId
        });
      }

      console.log(`✅ Created team: ${team.name} with ${members.length} members`);
    }

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📝 Sample credentials:');
    console.log('Email: alex@company.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seeding
seedData();
