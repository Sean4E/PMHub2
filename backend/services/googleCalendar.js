const { google } = require('googleapis');

class GoogleCalendarService {
  constructor(accessToken, refreshToken) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async createEvent(taskTitle, description, startDate, endDate, dueDate, attendees = []) {
    try {
      // Use system timezone instead of hardcoded UTC
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Use due date as event date, or start date if due date not provided
      const eventDate = dueDate || startDate;
      const eventDateTime = new Date(eventDate);
      const eventEndDateTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const event = {
        summary: taskTitle,
        description: description || '',
        start: {
          dateTime: eventDateTime.toISOString(),
          timeZone: userTimeZone
        },
        end: {
          dateTime: eventEndDateTime.toISOString(),
          timeZone: userTimeZone
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      return {
        id: response.data.id,
        url: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  }

  async updateEvent(eventId, taskTitle, description, dueDate) {
    try {
      // Use system timezone instead of hardcoded UTC
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const eventDateTime = new Date(dueDate);
      const eventEndDateTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000);

      const event = {
        summary: taskTitle,
        description: description || '',
        start: {
          dateTime: eventDateTime.toISOString(),
          timeZone: userTimeZone
        },
        end: {
          dateTime: eventEndDateTime.toISOString(),
          timeZone: userTimeZone
        }
      };

      const response = await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event
      });

      return {
        id: response.data.id,
        url: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error('Failed to update Google Calendar event');
    }
  }

  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error('Failed to delete Google Calendar event');
    }
  }

  async listEvents(timeMin, timeMax) {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin ? new Date(timeMin).toISOString() : new Date().toISOString(),
        timeMax: timeMax ? new Date(timeMax).toISOString() : undefined,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items;
    } catch (error) {
      console.error('Error listing Google Calendar events:', error);
      throw new Error('Failed to list Google Calendar events');
    }
  }
}

module.exports = GoogleCalendarService;
