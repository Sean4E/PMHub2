const { Team, User, TeamMember } = require('../models');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching teams'
    });
  }
};

// @desc    Create team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { name, description, color, members } = req.body;

    const team = await Team.create({
      name,
      description,
      color: color || '#60a5fa',
      createdBy: req.user.id
    });

    // Add members if provided
    if (members && Array.isArray(members)) {
      for (const userId of members) {
        await TeamMember.create({
          teamId: team.id,
          userId
        });
      }
    }

    // Fetch team with members
    const teamWithMembers = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
          through: { attributes: [] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: teamWithMembers
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team'
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Update team details
    await team.update({
      name: name || team.name,
      description: description !== undefined ? description : team.description,
      color: color || team.color
    });

    // Update members if provided
    if (members && Array.isArray(members)) {
      // Remove existing members
      await TeamMember.destroy({ where: { teamId: team.id } });

      // Add new members
      for (const userId of members) {
        await TeamMember.create({
          teamId: team.id,
          userId
        });
      }
    }

    // Fetch updated team with members
    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'name', 'email', 'avatar', 'role'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team'
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    await team.destroy();

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team'
    });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'avatar', 'role']
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, avatar } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user details
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      avatar: avatar !== undefined ? avatar : user.avatar
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

