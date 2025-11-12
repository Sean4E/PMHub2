const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/', getAllUsers);
router.put('/:id', updateUser);

module.exports = router;
