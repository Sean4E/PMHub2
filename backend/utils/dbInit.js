/**
 * Database Initialization Script
 *
 * This script initializes the database with seed data
 * Run: node utils/dbInit.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Project, Task, Team, ProjectMember, TaskAssignee, TeamMember } = require('../models');

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    console.log('🔄 Synchronizing database models...');
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables!
    console.log('✅ Database models synchronized');

    console.log('🔄 Creating seed data...');

    // Create users
    const users = await User.bulkCreate([
      {
        name: 'Admin User',
        email: 'admin@pmhub.com',
        password: 'password123',
        role: 'admin',
        avatar: 'AU'
      },
      {
        name: 'John Doe',
        email: 'john@pmhub.com',
        password: 'password123',
        role: 'manager',
        avatar: 'JD'
      },
      {
        name: 'Jane Smith',
        email: 'jane@pmhub.com',
        password: 'password123',
        role: 'member',
        avatar: 'JS'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@pmhub.com',
        password: 'password123',
        role: 'member',
        avatar: 'MJ'
      },
      {
        name: 'Sarah Williams',
        email: 'sarah@pmhub.com',
        password: 'password123',
        role: 'member',
        avatar: 'SW'
      }
    ], { individualHooks: true }); // Enable hooks for password hashing

    console.log(`✅ Created ${users.length} users`);

    // Create teams
    const teams = await Team.bulkCreate([
      {
        name: 'Engineering',
        description: 'Development team',
        color: '#60a5fa',
        createdBy: users[0].id
      },
      {
        name: 'Design',
        description: 'Design team',
        color: '#8b5cf6',
        createdBy: users[0].id
      },
      {
        name: 'Marketing',
        description: 'Marketing team',
        color: '#ec4899',
        createdBy: users[0].id
      }
    ]);

    console.log(`✅ Created ${teams.length} teams`);

    // Add team members
    await TeamMember.bulkCreate([
      { teamId: teams[0].id, userId: users[1].id, role: 'lead' },
      { teamId: teams[0].id, userId: users[3].id, role: 'member' },
      { teamId: teams[1].id, userId: users[2].id, role: 'lead' },
      { teamId: teams[2].id, userId: users[4].id, role: 'lead' }
    ]);

    console.log('✅ Added team members');

    // Create projects
    const projects = await Project.bulkCreate([
      {
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        status: 'active',
        progress: 65,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-03-30'),
        color: '#60a5fa',
        ownerId: users[0].id
      },
      {
        name: 'Mobile App Launch',
        description: 'iOS and Android app development',
        status: 'active',
        progress: 40,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-05-15'),
        color: '#8b5cf6',
        ownerId: users[1].id
      },
      {
        name: 'Marketing Campaign Q2',
        description: 'Q2 2025 marketing initiatives',
        status: 'planning',
        progress: 15,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-06-30'),
        color: '#ec4899',
        ownerId: users[0].id
      }
    ]);

    console.log(`✅ Created ${projects.length} projects`);

    // Add project members
    await ProjectMember.bulkCreate([
      { projectId: projects[0].id, userId: users[0].id, role: 'owner' },
      { projectId: projects[0].id, userId: users[1].id, role: 'admin' },
      { projectId: projects[0].id, userId: users[2].id, role: 'member' },
      { projectId: projects[1].id, userId: users[1].id, role: 'owner' },
      { projectId: projects[1].id, userId: users[3].id, role: 'member' },
      { projectId: projects[2].id, userId: users[0].id, role: 'owner' },
      { projectId: projects[2].id, userId: users[4].id, role: 'member' }
    ]);

    console.log('✅ Added project members');

    // Create tasks
    const tasks = await Task.bulkCreate([
      {
        projectId: projects[0].id,
        title: 'Design mockups',
        description: 'Create high-fidelity mockups for all pages',
        status: 'done',
        priority: 'high',
        dueDate: new Date('2025-01-30'),
        completedDate: new Date('2025-01-28'),
        estimatedHours: 40,
        actualHours: 38,
        createdBy: users[0].id
      },
      {
        projectId: projects[0].id,
        title: 'Frontend development',
        description: 'Implement React components',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2025-02-28'),
        estimatedHours: 80,
        actualHours: 45,
        createdBy: users[0].id
      },
      {
        projectId: projects[0].id,
        title: 'Content migration',
        description: 'Migrate existing content to new system',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2025-03-15'),
        estimatedHours: 30,
        actualHours: 0,
        createdBy: users[0].id
      },
      {
        projectId: projects[1].id,
        title: 'API integration',
        description: 'Integrate backend APIs',
        status: 'in-progress',
        priority: 'critical',
        dueDate: new Date('2025-02-15'),
        estimatedHours: 60,
        actualHours: 32,
        createdBy: users[1].id
      },
      {
        projectId: projects[1].id,
        title: 'User testing',
        description: 'Conduct user acceptance testing',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2025-04-01'),
        estimatedHours: 40,
        actualHours: 0,
        createdBy: users[1].id
      },
      {
        projectId: projects[2].id,
        title: 'Campaign strategy',
        description: 'Develop Q2 campaign strategy',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2025-03-10'),
        estimatedHours: 20,
        actualHours: 8,
        createdBy: users[0].id
      }
    ]);

    console.log(`✅ Created ${tasks.length} tasks`);

    // Assign tasks
    await TaskAssignee.bulkCreate([
      { taskId: tasks[0].id, userId: users[2].id },
      { taskId: tasks[1].id, userId: users[1].id },
      { taskId: tasks[2].id, userId: users[2].id },
      { taskId: tasks[3].id, userId: users[1].id },
      { taskId: tasks[3].id, userId: users[3].id },
      { taskId: tasks[4].id, userId: users[3].id },
      { taskId: tasks[5].id, userId: users[4].id }
    ]);

    console.log('✅ Assigned tasks to users');

    console.log('\n🎉 Database initialization complete!\n');
    console.log('Sample users created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach(user => {
      console.log(`📧 ${user.email} | 🔑 password123 | 👤 ${user.role}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now start the server and log in with any of these accounts.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
