const express = require('express');
const router = express.Router();
const { getAllTeams, createTeam, updateTeam, deleteTeam, getAllUsers } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getAllTeams);
router.post('/', createTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
