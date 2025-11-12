const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOAuth2Client,
  GmailAPI,
  DriveAPI,
  DocsAPI,
  SheetsAPI,
  SlidesAPI,
  CalendarAPI
} = require('../utils/googleApis');

// Middleware to get user and setup OAuth2 client
const setupGoogleAuth = async (req, res, next) => {
  try {
    // Re-fetch user with Google tokens since they're excluded from the protect middleware
    const { User } = require('../models');
    const userWithTokens = await User.findByPk(req.user.id, {
      attributes: ['id', 'googleAccessToken', 'googleRefreshToken']
    });

    if (!userWithTokens || !userWithTokens.googleAccessToken) {
      return res.status(401).json({
        success: false,
        message: 'Google account not connected. Please authenticate with Google.'
      });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: userWithTokens.googleAccessToken,
      refresh_token: userWithTokens.googleRefreshToken
    });

    req.oauth2Client = oauth2Client;
    next();
  } catch (error) {
    console.error('Error setting up Google auth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup Google authentication'
    });
  }
};

// Gmail routes
router.get('/gmail/list', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { maxResults = 50, query = '' } = req.query;
    const gmailAPI = new GmailAPI(req.oauth2Client);
    const result = await gmailAPI.listEmails(parseInt(maxResults), query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing emails:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/gmail/message/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const gmailAPI = new GmailAPI(req.oauth2Client);
    const result = await gmailAPI.getEmail(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/gmail/send', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const gmailAPI = new GmailAPI(req.oauth2Client);
    const result = await gmailAPI.sendEmail(to, subject, body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/gmail/labels', protect, setupGoogleAuth, async (req, res) => {
  try {
    const gmailAPI = new GmailAPI(req.oauth2Client);
    const result = await gmailAPI.getLabels();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting labels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Drive routes
router.get('/drive/list', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { pageSize = 50, query = '', orderBy = 'modifiedTime desc', pageToken = null } = req.query;
    const driveAPI = new DriveAPI(req.oauth2Client);
    const result = await driveAPI.listFiles(parseInt(pageSize), query, orderBy, pageToken);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/drive/file/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const driveAPI = new DriveAPI(req.oauth2Client);
    const result = await driveAPI.getFile(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/drive/folder', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const driveAPI = new DriveAPI(req.oauth2Client);
    const result = await driveAPI.createFolder(name, parentId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/drive/file/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const driveAPI = new DriveAPI(req.oauth2Client);
    const result = await driveAPI.deleteFile(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/drive/share', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { fileId, email, role } = req.body;
    const driveAPI = new DriveAPI(req.oauth2Client);
    const result = await driveAPI.shareFile(fileId, email, role);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Docs routes
router.get('/docs/list', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { maxResults = 50 } = req.query;
    const docsAPI = new DocsAPI(req.oauth2Client);
    const result = await docsAPI.listDocs(parseInt(maxResults));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing docs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/docs/document/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const docsAPI = new DocsAPI(req.oauth2Client);
    const result = await docsAPI.getDoc(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting doc:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/docs/create', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const docsAPI = new DocsAPI(req.oauth2Client);
    const result = await docsAPI.createDoc(title, content);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating doc:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sheets routes
router.get('/sheets/list', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { maxResults = 50 } = req.query;
    const sheetsAPI = new SheetsAPI(req.oauth2Client);
    const result = await sheetsAPI.listSheets(parseInt(maxResults));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing sheets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sheets/spreadsheet/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const sheetsAPI = new SheetsAPI(req.oauth2Client);
    const result = await sheetsAPI.getSheet(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sheets/create', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const sheetsAPI = new SheetsAPI(req.oauth2Client);
    const result = await sheetsAPI.createSheet(title);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Slides routes
router.get('/slides/list', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { maxResults = 50 } = req.query;
    const slidesAPI = new SlidesAPI(req.oauth2Client);
    const result = await slidesAPI.listPresentations(parseInt(maxResults));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing presentations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/slides/presentation/:id', protect, setupGoogleAuth, async (req, res) => {
  try {
    const slidesAPI = new SlidesAPI(req.oauth2Client);
    const result = await slidesAPI.getPresentation(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting presentation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/slides/create', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const slidesAPI = new SlidesAPI(req.oauth2Client);
    const result = await slidesAPI.createPresentation(title);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating presentation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Calendar routes
router.get('/calendar/events', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { maxResults = 50, timeMin, timeMax } = req.query;
    const calendarAPI = new CalendarAPI(req.oauth2Client);
    const result = await calendarAPI.listEvents(
      parseInt(maxResults),
      timeMin,
      timeMax
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/calendar/event', protect, setupGoogleAuth, async (req, res) => {
  try {
    const { summary, description, startTime, endTime, attendees } = req.body;
    const calendarAPI = new CalendarAPI(req.oauth2Client);
    const result = await calendarAPI.createEvent(
      summary,
      description,
      startTime,
      endTime,
      attendees
    );
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
