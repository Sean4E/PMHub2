const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const Team = require('./Team');
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Junction tables
const ProjectMember = sequelize.define('ProjectMember', {
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member', 'viewer'),
    defaultValue: 'member'
  }
}, {
  tableName: 'project_members',
  timestamps: true
});

const TaskAssignee = sequelize.define('TaskAssignee', {
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'task_assignees',
  timestamps: false
});

const TeamMember = sequelize.define('TeamMember', {
  role: {
    type: DataTypes.ENUM('lead', 'member'),
    defaultValue: 'member'
  }
}, {
  tableName: 'team_members',
  timestamps: true
});

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'attachments'
});

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'comments'
});

// Define associations
// User relationships
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
User.hasMany(Task, { foreignKey: 'createdBy', as: 'createdTasks' });
User.hasMany(Team, { foreignKey: 'createdBy', as: 'createdTeams' });

// Project relationships
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId' });

// Task relationships
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Task.belongsToMany(User, { through: TaskAssignee, as: 'assignees', foreignKey: 'taskId' });
Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments', onDelete: 'CASCADE' });
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });

// Team relationships
Team.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Team.belongsToMany(User, { through: TeamMember, as: 'members', foreignKey: 'teamId' });

// Attachment relationships
Attachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Comment relationships
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Many-to-many through tables
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId' });
User.belongsToMany(Task, { through: TaskAssignee, as: 'assignedTasks', foreignKey: 'userId' });
User.belongsToMany(Team, { through: TeamMember, as: 'teams', foreignKey: 'userId' });

module.exports = {
  User,
  Project,
  Task,
  Team,
  ProjectMember,
  TaskAssignee,
  TeamMember,
  Attachment,
  Comment,
  sequelize
};
