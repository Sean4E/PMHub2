const { google } = require('googleapis');

// Initialize OAuth2 client
const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
};

// Gmail API wrapper
class GmailAPI {
  constructor(auth) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async listEmails(maxResults = 50, query = '') {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query
      });

      if (!response.data.messages) {
        return { messages: [], nextPageToken: null };
      }

      // Get full message details for each message
      const messages = await Promise.all(
        response.data.messages.map(async (message) => {
          const details = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          return details.data;
        })
      );

      return {
        messages,
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing emails:', error);
      throw error;
    }
  }

  async getEmail(messageId) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting email:', error);
      throw error;
    }
  }

  async sendEmail(to, subject, body) {
    try {
      const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async getLabels() {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });
      return response.data.labels;
    } catch (error) {
      console.error('Error getting labels:', error);
      throw error;
    }
  }
}

// Drive API wrapper
class DriveAPI {
  constructor(auth) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  async listFiles(pageSize = 50, query = '', orderBy = 'modifiedTime desc', pageToken = null) {
    try {
      const params = {
        pageSize,
        q: query,
        orderBy,
        fields: 'nextPageToken, files(id, name, mimeType, iconLink, createdTime, modifiedTime, size, webViewLink, thumbnailLink, owners, shared)'
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await this.drive.files.list(params);

      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async getFile(fileId) {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, iconLink, createdTime, modifiedTime, size, webViewLink, thumbnailLink, owners, shared, description'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async createFolder(name, parentId = null) {
    try {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, mimeType'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId
      });
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async shareFile(fileId, email, role = 'reader') {
    try {
      const response = await this.drive.permissions.create({
        fileId,
        requestBody: {
          type: 'user',
          role,
          emailAddress: email
        },
        fields: 'id'
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }
}

// Docs API wrapper
class DocsAPI {
  constructor(auth) {
    this.docs = google.docs({ version: 'v1', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async listDocs(maxResults = 50) {
    try {
      const response = await this.drive.files.list({
        pageSize: maxResults,
        q: "mimeType='application/vnd.google-apps.document'",
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, iconLink, createdTime, modifiedTime, webViewLink, thumbnailLink)'
      });

      return {
        documents: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing docs:', error);
      throw error;
    }
  }

  async getDoc(documentId) {
    try {
      const response = await this.docs.documents.get({
        documentId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting doc:', error);
      throw error;
    }
  }

  async createDoc(title, content = '') {
    try {
      const response = await this.docs.documents.create({
        requestBody: {
          title
        }
      });

      if (content) {
        await this.docs.documents.batchUpdate({
          documentId: response.data.documentId,
          requestBody: {
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: content
                }
              }
            ]
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error creating doc:', error);
      throw error;
    }
  }
}

// Sheets API wrapper
class SheetsAPI {
  constructor(auth) {
    this.sheets = google.sheets({ version: 'v4', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async listSheets(maxResults = 50) {
    try {
      const response = await this.drive.files.list({
        pageSize: maxResults,
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, iconLink, createdTime, modifiedTime, webViewLink, thumbnailLink)'
      });

      return {
        spreadsheets: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing sheets:', error);
      throw error;
    }
  }

  async getSheet(spreadsheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting sheet:', error);
      throw error;
    }
  }

  async createSheet(title) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title
          }
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }
  }
}

// Slides API wrapper
class SlidesAPI {
  constructor(auth) {
    this.slides = google.slides({ version: 'v1', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async listPresentations(maxResults = 50) {
    try {
      const response = await this.drive.files.list({
        pageSize: maxResults,
        q: "mimeType='application/vnd.google-apps.presentation'",
        orderBy: 'modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, iconLink, createdTime, modifiedTime, webViewLink, thumbnailLink)'
      });

      return {
        presentations: response.data.files || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing presentations:', error);
      throw error;
    }
  }

  async getPresentation(presentationId) {
    try {
      const response = await this.slides.presentations.get({
        presentationId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting presentation:', error);
      throw error;
    }
  }

  async createPresentation(title) {
    try {
      const response = await this.slides.presentations.create({
        requestBody: {
          title
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating presentation:', error);
      throw error;
    }
  }
}

// Calendar API wrapper
class CalendarAPI {
  constructor(auth) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async listEvents(maxResults = 50, timeMin = null, timeMax = null) {
    try {
      const params = {
        calendarId: 'primary',
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      const response = await this.calendar.events.list(params);

      return {
        events: response.data.items || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error listing events:', error);
      throw error;
    }
  }

  async createEvent(summary, description, startTime, endTime, attendees = [], timeZone = null) {
    try {
      // Use provided timezone, or default to system timezone
      const userTimeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      const event = {
        summary,
        description,
        start: {
          dateTime: startTime,
          timeZone: userTimeZone
        },
        end: {
          dateTime: endTime,
          timeZone: userTimeZone
        }
      };

      if (attendees.length > 0) {
        event.attendees = attendees.map(email => ({ email }));
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
}

module.exports = {
  getOAuth2Client,
  GmailAPI,
  DriveAPI,
  DocsAPI,
  SheetsAPI,
  SlidesAPI,
  CalendarAPI
};
