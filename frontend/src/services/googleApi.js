import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Gmail API
export const gmailApi = {
  listEmails: async (maxResults = 50, query = '') => {
    const response = await axios.get(
      `${API_URL}/google/gmail/list?maxResults=${maxResults}&query=${query}`,
      getAuthHeaders()
    );
    return response.data;
  },

  getEmail: async (messageId) => {
    const response = await axios.get(
      `${API_URL}/google/gmail/message/${messageId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  sendEmail: async (to, subject, body) => {
    const response = await axios.post(
      `${API_URL}/google/gmail/send`,
      { to, subject, body },
      getAuthHeaders()
    );
    return response.data;
  },

  getLabels: async () => {
    const response = await axios.get(
      `${API_URL}/google/gmail/labels`,
      getAuthHeaders()
    );
    return response.data;
  }
};

// Drive API
export const driveApi = {
  listFiles: async (pageSize = 50, query = '', orderBy = 'modifiedTime desc', pageToken = null) => {
    let url = `${API_URL}/google/drive/list?pageSize=${pageSize}&query=${query}&orderBy=${orderBy}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  getFile: async (fileId) => {
    const response = await axios.get(
      `${API_URL}/google/drive/file/${fileId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  createFolder: async (name, parentId = null) => {
    const response = await axios.post(
      `${API_URL}/google/drive/folder`,
      { name, parentId },
      getAuthHeaders()
    );
    return response.data;
  },

  deleteFile: async (fileId) => {
    const response = await axios.delete(
      `${API_URL}/google/drive/file/${fileId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  shareFile: async (fileId, email, role = 'reader') => {
    const response = await axios.post(
      `${API_URL}/google/drive/share`,
      { fileId, email, role },
      getAuthHeaders()
    );
    return response.data;
  }
};

// Docs API
export const docsApi = {
  listDocs: async (maxResults = 50, pageToken = null) => {
    let url = `${API_URL}/google/docs/list?maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  getDoc: async (documentId) => {
    const response = await axios.get(
      `${API_URL}/google/docs/document/${documentId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  createDoc: async (title, content = '') => {
    const response = await axios.post(
      `${API_URL}/google/docs/create`,
      { title, content },
      getAuthHeaders()
    );
    return response.data;
  }
};

// Sheets API
export const sheetsApi = {
  listSheets: async (maxResults = 50, pageToken = null) => {
    let url = `${API_URL}/google/sheets/list?maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  getSheet: async (spreadsheetId) => {
    const response = await axios.get(
      `${API_URL}/google/sheets/spreadsheet/${spreadsheetId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  createSheet: async (title) => {
    const response = await axios.post(
      `${API_URL}/google/sheets/create`,
      { title },
      getAuthHeaders()
    );
    return response.data;
  }
};

// Slides API
export const slidesApi = {
  listPresentations: async (maxResults = 50, pageToken = null) => {
    let url = `${API_URL}/google/slides/list?maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }
    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  getPresentation: async (presentationId) => {
    const response = await axios.get(
      `${API_URL}/google/slides/presentation/${presentationId}`,
      getAuthHeaders()
    );
    return response.data;
  },

  createPresentation: async (title) => {
    const response = await axios.post(
      `${API_URL}/google/slides/create`,
      { title },
      getAuthHeaders()
    );
    return response.data;
  }
};

// Calendar API
export const calendarApi = {
  listEvents: async (maxResults = 50, timeMin = null, timeMax = null) => {
    let url = `${API_URL}/google/calendar/events?maxResults=${maxResults}`;
    if (timeMin) url += `&timeMin=${timeMin}`;
    if (timeMax) url += `&timeMax=${timeMax}`;

    const response = await axios.get(url, getAuthHeaders());
    return response.data;
  },

  createEvent: async (summary, description, startTime, endTime, attendees = []) => {
    const response = await axios.post(
      `${API_URL}/google/calendar/event`,
      { summary, description, startTime, endTime, attendees },
      getAuthHeaders()
    );
    return response.data;
  }
};
