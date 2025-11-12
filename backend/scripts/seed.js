const { sequelize } = require('../config/database');
const { Project, Task, User } = require('../models');

async function seed() {
  try {
    console.log('Starting database seed...');

    // Get the current user (should be the logged in user)
    const user = await User.findOne();
    if (!user) {
      console.error('No user found. Please login first.');
      process.exit(1);
    }

    console.log(`Seeding data for user: ${user.name}`);

    // Create projects
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      status: 'active',
      progress: 0,
      startDate: '2025-01-15',
      endDate: '2025-03-30',
      color: '#60a5fa',
      ownerId: user.id
    });

    const project2 = await Project.create({
      name: 'Mobile App Launch',
      description: 'iOS and Android app development',
      status: 'active',
      progress: 0,
      startDate: '2025-02-01',
      endDate: '2025-05-15',
      color: '#8b5cf6',
      ownerId: user.id
    });

    const project3 = await Project.create({
      name: 'Marketing Campaign Q2',
      description: 'Q2 2025 marketing initiatives',
      status: 'planning',
      progress: 0,
      startDate: '2025-03-01',
      endDate: '2025-06-30',
      color: '#ec4899',
      ownerId: user.id
    });

    console.log('✅ Projects created');

    // Create tasks for Project 1
    const task1 = await Task.create({
      projectId: project1.id,
      title: 'Design mockups',
      description: 'Create high-fidelity mockups for all pages',
      status: 'done',
      priority: 'high',
      dueDate: '2025-01-30',
      estimatedHours: 40,
      actualHours: 38,
      subtasks: [
        { id: '1', title: 'Homepage design', completed: true },
        { id: '2', title: 'Product page design', completed: true },
        { id: '3', title: 'Contact page design', completed: true }
      ],
      createdBy: user.id
    });

    const task2 = await Task.create({
      projectId: project1.id,
      title: 'Frontend development',
      description: 'Implement React components',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2025-02-28',
      estimatedHours: 80,
      actualHours: 45,
      subtasks: [
        { id: '1', title: 'Setup project structure', completed: true },
        { id: '2', title: 'Build navigation', completed: true },
        { id: '3', title: 'Create page components', completed: false },
        { id: '4', title: 'Add animations', completed: false }
      ],
      createdBy: user.id
    });

    const task3 = await Task.create({
      projectId: project1.id,
      title: 'Content migration',
      description: 'Migrate existing content to new system',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-03-15',
      estimatedHours: 30,
      actualHours: 0,
      subtasks: [],
      createdBy: user.id
    });

    console.log('✅ Tasks created for Website Redesign');

    // Create tasks for Project 2
    const task4 = await Task.create({
      projectId: project2.id,
      title: 'API integration',
      description: 'Integrate backend APIs',
      status: 'in-progress',
      priority: 'critical',
      dueDate: '2025-02-15',
      estimatedHours: 60,
      actualHours: 32,
      subtasks: [
        { id: '1', title: 'Authentication API', completed: true },
        { id: '2', title: 'User data API', completed: false },
        { id: '3', title: 'Payment API', completed: false }
      ],
      createdBy: user.id
    });

    const task5 = await Task.create({
      projectId: project2.id,
      title: 'User testing',
      description: 'Conduct user acceptance testing',
      status: 'todo',
      priority: 'medium',
      dueDate: '2025-04-01',
      estimatedHours: 40,
      actualHours: 0,
      subtasks: [],
      createdBy: user.id
    });

    console.log('✅ Tasks created for Mobile App Launch');

    // Create tasks for Project 3
    const task6 = await Task.create({
      projectId: project3.id,
      title: 'Campaign strategy',
      description: 'Develop Q2 campaign strategy',
      status: 'in-progress',
      priority: 'high',
      dueDate: '2025-03-10',
      estimatedHours: 20,
      actualHours: 8,
      subtasks: [
        { id: '1', title: 'Market research', completed: true },
        { id: '2', title: 'Competitor analysis', completed: false },
        { id: '3', title: 'Create strategy doc', completed: false }
      ],
      createdBy: user.id
    });

    const task7 = await Task.create({
      projectId: project3.id,
      title: 'Social media content',
      description: 'Create social media content calendar',
      status: 'review',
      priority: 'medium',
      dueDate: '2025-03-20',
      estimatedHours: 15,
      actualHours: 12,
      subtasks: [
        { id: '1', title: 'Instagram posts', completed: true },
        { id: '2', title: 'Twitter threads', completed: true },
        { id: '3', title: 'LinkedIn articles', completed: false }
      ],
      createdBy: user.id
    });

    console.log('✅ Tasks created for Marketing Campaign');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`Created ${3} projects and ${7} tasks`);
    console.log('\nProjects with calculated progress:');

    // Fetch and display projects with progress
    const projects = await Project.findAll({
      include: [{ model: Task, as: 'tasks' }]
    });

    for (const project of projects) {
      const tasks = project.tasks;
      let totalProgress = 0;

      tasks.forEach(task => {
        let subtasks = task.subtasks;
        // Parse if it's a JSON string
        if (typeof subtasks === 'string') {
          try {
            subtasks = JSON.parse(subtasks);
          } catch (e) {
            subtasks = [];
          }
        }

        if (!subtasks || subtasks.length === 0) {
          totalProgress += task.status === 'done' ? 100 : 0;
        } else {
          const completed = subtasks.filter(st => st.completed).length;
          totalProgress += Math.round((completed / subtasks.length) * 100);
        }
      });

      const progress = Math.round(totalProgress / tasks.length);
      await project.update({ progress });

      console.log(`  - ${project.name}: ${progress}% complete`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seed();
