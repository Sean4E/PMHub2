const { Attachment, Task } = require('../models');
const GoogleDriveService = require('../services/googleDrive');
const fs = require('fs');
const path = require('path');

// @desc    Upload file attachment to task
// @route   POST /api/tasks/:taskId/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const task = await Task.findByPk(req.params.taskId, {
      include: [{ model: require('../models').Project, as: 'project' }]
    });

    if (!task) {
      // Delete uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create attachment record
    const attachment = await Attachment.create({
      taskId: task.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id
    });

    // Upload to Google Drive if user has access and project has Drive folder
    if (req.user.googleAccessToken && task.project.driveFolderId) {
      try {
        const driveService = new GoogleDriveService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );

        const driveFile = await driveService.uploadFile(
          req.file.originalname,
          req.file.path,
          req.file.mimetype,
          task.project.driveFolderId
        );

        attachment.driveFileId = driveFile.id;
        attachment.driveFileUrl = driveFile.url;
        await attachment.save();
      } catch (error) {
        console.error('Error uploading to Drive:', error);
        // Continue without Drive upload
      }
    }

    res.status(201).json({
      success: true,
      data: attachment
    });
  } catch (error) {
    console.error(error);
    // Clean up file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// @desc    Download attachment
// @route   GET /api/attachments/:id/download
// @access  Private
exports.downloadAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(attachment.filePath, attachment.originalName);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
};

// @desc    Delete attachment
// @route   DELETE /api/attachments/:id
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check authorization
    if (attachment.uploadedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this attachment'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    // Delete from Google Drive if exists
    if (attachment.driveFileId && req.user.googleAccessToken) {
      try {
        const driveService = new GoogleDriveService(
          req.user.googleAccessToken,
          req.user.googleRefreshToken
        );
        await driveService.deleteFile(attachment.driveFileId);
      } catch (error) {
        console.error('Error deleting from Drive:', error);
      }
    }

    await attachment.destroy();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attachment'
    });
  }
};
