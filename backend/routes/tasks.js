const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addAssignee,
  removeAssignee,
  addComment,
  deleteComment
} = require('../controllers/taskController');
const { uploadAttachment, downloadAttachment, deleteAttachment } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// Task routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Assignee routes
router.route('/:id/assignees')
  .post(addAssignee);

router.route('/:id/assignees/:userId')
  .delete(removeAssignee);

// Comment routes
router.route('/:id/comments')
  .post(addComment);

router.route('/comments/:id')
  .delete(deleteComment);

// Attachment routes
router.route('/:taskId/attachments')
  .post(upload.single('file'), uploadAttachment);

router.route('/attachments/:id/download')
  .get(downloadAttachment);

router.route('/attachments/:id')
  .delete(deleteAttachment);

module.exports = router;
