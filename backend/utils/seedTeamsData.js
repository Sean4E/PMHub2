const { sequelize } = require('../config/database');
const { Team, User, TeamMember } = require('../models');

async function seedTeams() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get all users
    const users = await User.findAll();
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users`);

    // Check if teams already exist
    const existingTeams = await Team.count();
    if (existingTeams > 0) {
      console.log(`⚠️  ${existingTeams} teams already exist. Skipping seed.`);
      process.exit(0);
    }

    // Create teams based on the mock data from ProjectManager.jsx
    const teamsData = [
      {
        name: 'Development',
        description: 'Software development team',
        color: '#60a5fa',
        members: users.slice(0, Math.min(3, users.length)).map(u => u.id)
      },
      {
        name: 'Design',
        description: 'Product design team',
        color: '#f472b6',
        members: users.slice(0, Math.min(2, users.length)).map(u => u.id)
      },
      {
        name: 'Marketing',
        description: 'Marketing and outreach team',
        color: '#34d399',
        members: users.slice(0, Math.min(2, users.length)).map(u => u.id)
      },
      {
        name: 'Sales',
        description: 'Sales and business development team',
        color: '#fbbf24',
        members: users.slice(0, Math.min(2, users.length)).map(u => u.id)
      }
    ];

    console.log('Creating teams...');

    for (const teamData of teamsData) {
      const { members, ...teamInfo } = teamData;

      // Create team
      const team = await Team.create({
        ...teamInfo,
        createdBy: users[0].id // Use first user as creator
      });

      console.log(`✅ Created team: ${team.name}`);

      // Add members using bulkCreate to avoid unique constraint issues
      if (members && members.length > 0) {
        const memberRecords = members.map(userId => ({
          teamId: team.id,
          userId,
          role: 'member'
        }));

        await TeamMember.bulkCreate(memberRecords, { ignoreDuplicates: true });
        console.log(`   Added ${members.length} members`);
      }
    }

    console.log('✅ Teams seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding teams:', error);
    process.exit(1);
  }
}

seedTeams();
