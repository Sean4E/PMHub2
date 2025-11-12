const { Project, Task, User, ProjectMember } = require('../models');
const GoogleDriveService = require('../services/googleDrive');
const emailService = require('../services/emailService');

// Helper function to calculate task completion percentage based on subtasks
const calculateTaskCompletion = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) {
    // No subtasks - use status
    return task.status === 'done' ? 100 : 0;
  }

  // Has subtasks - calculate based on completed subtasks
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
};

// Helper function to calculate project progress
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  // Calculate progress considering both task status and subtasks
  let totalProgress = 0;
  tasks.forEach(task => {
    totalProgress += calculateTaskCompletion(task);
  });

  return Math.round(totalProgress / tasks.length);
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
          through: { attributes: ['role'] }
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['id', 'status']
        }
      ],
      where: {
        [require('sequelize').Op.or]: [
          { ownerId: req.user.id },
          { '$members.id$': req.user.id }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    // Calculate and update progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const calculatedProgress = calculateProgress(project.tasks);

        // Update progress in database if it changed
        if (project.progress !== calculatedProgress) {
          await project.update({ progress: calculatedProgress });
        }

        return project;
      })
    );

    res.json({
      success: true,
      count: projectsWithProgress.length,
      data: projectsWithProgress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
          through: { attributes: ['role'] }
        },
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: User,
              as: 'assignees',
              attributes: ['id', 'name', 'email', 'avatar']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access
    const hasAccess = project.ownerId === req.user.id ||
                     project.members.some(member => member.id === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Calculate and update progress
    const calculatedProgress = calculateProgress(project.tasks);
    if (project.progress !== calculatedProgress) {
      await project.update({ progress: calculatedProgress });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, color, createDriveFolder } = req.body;

    // Create project
    const project = await Project.create({
      name,
      description,
      startDate,
      endDate,
      color: color || '#60a5fa',
      ownerId: req.user.id
    });

    // Add owner as project member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'owner'
    });

    // Create Google Drive folder if requested and user has tokens
    if (createDriveFolder && req.user.googleAccessToken) {
      try {
        const driveService = new GoogleDriveService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );

        const folder = await driveService.createFolder(name);
        project.driveFolderId = folder.id;
        project.driveFolderUrl = folder.url;
        await project.save();
      } catch (error) {
        console.error('Error creating Drive folder:', error);
        // Continue without Drive folder
      }
    }

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error creating project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin
    if (project.ownerId !== req.user.id) {
      const member = await ProjectMember.findOne({
        where: { projectId: project.id, userId: req.user.id }
      });

      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this project'
        });
      }
    }

    await project.update(req.body);

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating project'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only owner can delete
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can delete the project'
      });
    }

    // Delete Drive folder if exists
    if (project.driveFolderId && req.user.googleAccessToken) {
      try {
        const driveService = new GoogleDriveService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );
        await driveService.deleteFile(project.driveFolderId);
      } catch (error) {
        console.error('Error deleting Drive folder:', error);
        // Continue with project deletion
      }
    }

    await project.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project'
    });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (project.ownerId !== req.user.id) {
      const member = await ProjectMember.findOne({
        where: { projectId: project.id, userId: req.user.id }
      });

      if (!member || member.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add members'
        });
      }
    }

    // Check if member already exists
    const existingMember = await ProjectMember.findOne({
      where: { projectId: project.id, userId }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }

    // Add member
    await ProjectMember.create({
      projectId: project.id,
      userId,
      role: role || 'member'
    });

    // Send invitation email
    const newMember = await User.findByPk(userId);
    if (newMember) {
      await emailService.sendProjectInvitation(newMember, project, req.user);
    }

    res.json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error adding member'
    });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only project owner can remove members'
      });
    }

    // Can't remove owner
    if (req.params.userId === project.ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove project owner'
      });
    }

    await ProjectMember.destroy({
      where: {
        projectId: project.id,
        userId: req.params.userId
      }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
};
