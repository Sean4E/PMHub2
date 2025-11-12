import React, { useState, useEffect } from 'react';
import { Mail, Search, RefreshCw, Plus, Inbox, Send, Star, Trash2, AlertCircle, X, FileText, Archive } from 'lucide-react';
import { gmailApi } from '../../services/googleApi';

const GmailTab = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [error, setError] = useState(null);
  const [activeFolder, setActiveFolder] = useState('INBOX');

  // Compose email state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  // Folder definitions
  const folders = [
    { id: 'INBOX', name: 'Inbox', icon: Inbox, color: 'text-blue-500' },
    { id: 'SENT', name: 'Sent', icon: Send, color: 'text-green-500' },
    { id: 'DRAFT', name: 'Drafts', icon: FileText, color: 'text-yellow-500' },
    { id: 'STARRED', name: 'Starred', icon: Star, color: 'text-amber-500' },
    { id: 'TRASH', name: 'Trash', icon: Trash2, color: 'text-red-500' }
  ];

  useEffect(() => {
    loadEmails();
  }, [activeFolder]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query based on active folder
      let query = searchQuery;
      if (activeFolder === 'INBOX' && !searchQuery) {
        query = 'in:inbox';
      } else if (activeFolder === 'SENT' && !searchQuery) {
        query = 'in:sent';
      } else if (activeFolder === 'DRAFT' && !searchQuery) {
        query = 'in:drafts';
      } else if (activeFolder === 'STARRED' && !searchQuery) {
        query = 'is:starred';
      } else if (activeFolder === 'TRASH' && !searchQuery) {
        query = 'in:trash';
      }

      const response = await gmailApi.listEmails(50, query);
      if (response.success) {
        setEmails(response.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading emails:', err);
      setError(err.response?.data?.message || 'Failed to load emails. Please make sure you are signed in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadEmails();
  };

  const handleEmailClick = async (email) => {
    setSelectedEmail(email);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      const response = await gmailApi.sendEmail(composeTo, composeSubject, composeBody);
      if (response.success) {
        setShowCompose(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        loadEmails();
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setError(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const getEmailHeader = (headers, name) => {
    const header = headers?.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const getEmailBody = (payload) => {
    if (payload.body && payload.body.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }

    if (payload.parts) {
      const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        return atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    return 'No message body';
  };

  const formatDate = (internalDate) => {
    const date = new Date(parseInt(internalDate));
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const currentFolder = folders.find(f => f.id === activeFolder);
  const FolderIcon = currentFolder?.icon || Inbox;

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Unable to Connect to Gmail
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadEmails}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Sidebar with Folders */}
      <div className={`w-60 border-r flex flex-col ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        {/* Compose Button */}
        <div className="p-4">
          <button
            onClick={() => setShowCompose(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            Compose
          </button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto">
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setActiveFolder(folder.id);
                  setSelectedEmail(null);
                }}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/20 border-r-4 border-r-blue-500 text-blue-400'
                      : 'bg-blue-50 border-r-4 border-r-blue-500 text-blue-600'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : folder.color}`} />
                <span className="font-medium">{folder.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email List */}
      <div className={`w-96 border-r flex flex-col ${isDark ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-50'}`}>
        {/* Header */}
        <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <FolderIcon className={`w-5 h-5 ${currentFolder?.color || 'text-blue-500'}`} />
              {currentFolder?.name || 'Inbox'}
            </h2>
            <button
              onClick={loadEmails}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </form>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
          ) : emails.length === 0 ? (
            <div className={`text-center p-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No emails found</p>
            </div>
          ) : (
            emails.map((email) => {
              const from = getEmailHeader(email.payload?.headers, 'From');
              const subject = getEmailHeader(email.payload?.headers, 'Subject');
              const snippet = email.snippet;
              const date = formatDate(email.internalDate);
              const isUnread = email.labelIds?.includes('UNREAD');

              return (
                <div
                  key={email.id}
                  onClick={() => handleEmailClick(email)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    isDark ? 'border-gray-700' : 'border-gray-200'
                  } ${
                    selectedEmail?.id === email.id
                      ? isDark
                        ? 'bg-blue-600/20 border-l-4 border-l-blue-500'
                        : 'bg-blue-50 border-l-4 border-l-blue-500'
                      : isDark
                      ? isUnread
                        ? 'bg-gray-800/50 hover:bg-gray-700'
                        : 'hover:bg-gray-800'
                      : isUnread
                      ? 'bg-blue-50/30 hover:bg-white'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className={`font-semibold text-sm truncate flex-1 ${
                      isUnread ? 'font-bold' : ''
                    } ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {from.split('<')[0].trim()}
                    </p>
                    <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {date}
                    </span>
                  </div>
                  <p className={`text-sm truncate mb-1 ${
                    isUnread ? 'font-semibold' : ''
                  } ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {subject || '(no subject)'}
                  </p>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    {snippet}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Email View */}
      <div className={`flex-1 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {getEmailHeader(selectedEmail.payload?.headers, 'Subject') || '(no subject)'}
              </h2>
              <div className={`flex items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex-1">
                  <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {getEmailHeader(selectedEmail.payload?.headers, 'From')}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    To: {getEmailHeader(selectedEmail.payload?.headers, 'To')}
                  </p>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {new Date(parseInt(selectedEmail.internalDate)).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <pre className={`whitespace-pre-wrap font-sans text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getEmailBody(selectedEmail.payload)}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            <div className="text-center">
              <Mail className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                New Message
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6">
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="To"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject"
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Message"
                    required
                    rows={12}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailTab;
