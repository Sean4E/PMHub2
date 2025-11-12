const { Task, Project, User, TaskAssignee, Attachment, Comment } = require('../models');
const GoogleCalendarService = require('../services/googleCalendar');
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

// Helper function to update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const project = await Project.findByPk(projectId, {
      include: [{
        model: Task,
        as: 'tasks',
        attributes: ['id', 'status', 'subtasks']
      }]
    });

    if (!project || !project.tasks) return;

    const totalTasks = project.tasks.length;
    if (totalTasks === 0) {
      await project.update({ progress: 0 });
      return;
    }

    // Calculate progress considering both task status and subtasks
    let totalProgress = 0;
    project.tasks.forEach(task => {
      totalProgress += calculateTaskCompletion(task);
    });

    const progress = Math.round(totalProgress / totalTasks);

    await project.update({ progress });
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { projectId: req.params.projectId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: [] }
        },
        {
          model: Attachment,
          as: 'attachments'
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email', 'avatar'],
          through: { attributes: [] }
        },
        {
          model: Attachment,
          as: 'attachments'
        },
        {
          model: Comment,
          as: 'comments',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'avatar']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, estimatedHours, assignees, createCalendarEvent } = req.body;

    // Verify project exists
    const project = await Project.findByPk(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create task
    const task = await Task.create({
      projectId: req.params.projectId,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      estimatedHours: estimatedHours || 0,
      createdBy: req.user.id
    });

    // Add assignees
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        await TaskAssignee.create({
          taskId: task.id,
          userId: assigneeId
        });

        // Send assignment email
        const assignee = await User.findByPk(assigneeId);
        if (assignee) {
          await emailService.sendTaskAssignmentEmail(assignee, task, project);
        }
      }
    }

    // Create Google Calendar event if requested
    if (createCalendarEvent && req.user.googleAccessToken && dueDate) {
      try {
        const calendarService = new GoogleCalendarService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );

        // Gather attendee emails
        const attendeeEmails = [];
        if (assignees && assignees.length > 0) {
          for (const assigneeId of assignees) {
            const assignee = await User.findByPk(assigneeId);
            if (assignee && assignee.email) {
              attendeeEmails.push(assignee.email);
            }
          }
        }

        const event = await calendarService.createEvent(
          title,
          description || 'Task created in PM Hub',
          project.startDate,
          project.endDate,
          dueDate,
          attendeeEmails
        );

        task.calendarEventId = event.id;
        task.calendarEventUrl = event.url;
        await task.save();
      } catch (error) {
        console.error('Error creating calendar event:', error);
        // Continue without calendar event
      }
    }

    // Fetch complete task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: User,
          as: 'assignees',
          attributes: ['id', 'name', 'email', 'avatar']
        }
      ]
    });

    // Update project progress
    await updateProjectProgress(req.params.projectId);

    res.status(201).json({
      success: true,
      data: createdTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update task
    const oldStatus = task.status;
    await task.update(req.body);

    // Mark as completed if status changed to done
    if (req.body.status === 'done' && oldStatus !== 'done') {
      task.completedDate = new Date();
      await task.save();
    }

    // Update calendar event if it exists and due date changed
    if (task.calendarEventId && req.body.dueDate && req.user.googleAccessToken) {
      try {
        const calendarService = new GoogleCalendarService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );

        await calendarService.updateEvent(
          task.calendarEventId,
          req.body.title || task.title,
          req.body.description || task.description,
          req.body.dueDate
        );
      } catch (error) {
        console.error('Error updating calendar event:', error);
      }
    }

    // Update project progress
    await updateProjectProgress(task.projectId);

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Store projectId before deletion
    const projectId = task.projectId;

    // Delete calendar event if exists
    if (task.calendarEventId && req.user.googleAccessToken) {
      try {
        const calendarService = new GoogleCalendarService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );
        await calendarService.deleteEvent(task.calendarEventId);
      } catch (error) {
        console.error('Error deleting calendar event:', error);
      }
    }

    await task.destroy();

    // Update project progress
    await updateProjectProgress(projectId);

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @desc    Add assignee to task
// @route   POST /api/tasks/:id/assignees
// @access  Private
exports.addAssignee = async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if already assigned
    const existing = await TaskAssignee.findOne({
      where: { taskId: task.id, userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to this task'
      });
    }

    await TaskAssignee.create({
      taskId: task.id,
      userId
    });

    // Send email
    const assignee = await User.findByPk(userId);
    if (assignee) {
      await emailService.sendTaskAssignmentEmail(assignee, task, task.project);
    }

    res.json({
      success: true,
      message: 'Assignee added successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error adding assignee'
    });
  }
};

// @desc    Remove assignee from task
// @route   DELETE /api/tasks/:id/assignees/:userId
// @access  Private
exports.removeAssignee = async (req, res) => {
  try {
    await TaskAssignee.destroy({
      where: {
        taskId: req.params.id,
        userId: req.params.userId
      }
    });

    res.json({
      success: true,
      message: 'Assignee removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error removing assignee'
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await Comment.create({
      taskId: req.params.id,
      userId: req.user.id,
      content
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    res.status(201).json({
      success: true,
      data: commentWithUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only comment creator can delete
    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};
