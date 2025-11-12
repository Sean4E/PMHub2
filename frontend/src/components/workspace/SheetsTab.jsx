import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, RefreshCw, Plus, AlertCircle, X, Edit3, Share2 } from 'lucide-react';
import { sheetsApi } from '../../services/googleApi';

const SheetsTab = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  const loadSpreadsheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sheetsApi.listSheets(50);
      if (response.success) {
        setSpreadsheets(response.data.spreadsheets || []);
      }
    } catch (err) {
      console.error('Error loading spreadsheets:', err);
      setError(err.response?.data?.message || 'Failed to load spreadsheets. Please make sure you are signed in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await sheetsApi.createSheet(newSheetTitle);
      if (response.success) {
        setShowCreateModal(false);
        setNewSheetTitle('');
        setSelectedSheet({ id: response.data.spreadsheetId, name: newSheetTitle });
      }
    } catch (err) {
      console.error('Error creating spreadsheet:', err);
      setError(err.response?.data?.message || 'Failed to create spreadsheet');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopyLink = () => {
    const shareableUrl = `https://docs.google.com/spreadsheets/d/${selectedSheet.id}/edit`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Unable to Connect to Google Sheets</h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadSpreadsheets}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {selectedSheet ? (
        // Spreadsheet Editor View
        <div className="h-full flex flex-col">
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-green-50'}`}>
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedSheet.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShareModal(true)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => setSelectedSheet(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`https://docs.google.com/spreadsheets/d/${selectedSheet.id}/edit`}
              className="w-full h-full border-0"
              title={selectedSheet.name}
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      ) : (
        // Spreadsheet List View
        <>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <FileSpreadsheet className="w-5 h-5 text-green-500" />
                Google Sheets
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Sheet
                </button>
                <button
                  onClick={loadSpreadsheets}
                  disabled={loading}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : spreadsheets.length === 0 ? (
              <div className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No spreadsheets found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create Your First Spreadsheet
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {spreadsheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet)}
                    className={`rounded-lg p-4 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group ${isDark ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
                          <FileSpreadsheet className="w-12 h-12 text-green-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate group-hover:text-green-600 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {sheet.name}
                        </h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Modified: {formatDate(sheet.modifiedTime)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-full py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Open Spreadsheet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Spreadsheet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Spreadsheet</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <form onSubmit={handleCreateSheet} className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Spreadsheet Title
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Untitled Spreadsheet"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedSheet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Share Spreadsheet</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Shareable Link
                </label>
                <div className={`w-full px-4 py-3 border rounded-lg break-all ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>
                  https://docs.google.com/spreadsheets/d/{selectedSheet.id}/edit
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  Close
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SheetsTab;
