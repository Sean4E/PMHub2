import React, { useState, useEffect } from 'react';
import { Presentation, Search, RefreshCw, Plus, AlertCircle, X, Edit3, Share2 } from 'lucide-react';
import { slidesApi } from '../../services/googleApi';

const SlidesTab = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await slidesApi.listPresentations(50);
      if (response.success) {
        setPresentations(response.data.presentations || []);
      }
    } catch (err) {
      console.error('Error loading presentations:', err);
      setError(err.response?.data?.message || 'Failed to load presentations. Please make sure you are signed in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlide = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await slidesApi.createPresentation(newSlideTitle);
      if (response.success) {
        setShowCreateModal(false);
        setNewSlideTitle('');
        setSelectedSlide({ id: response.data.presentationId, name: newSlideTitle });
      }
    } catch (err) {
      console.error('Error creating presentation:', err);
      setError(err.response?.data?.message || 'Failed to create presentation');
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
    const shareableUrl = `https://docs.google.com/presentation/d/${selectedSlide.id}/edit`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Unable to Connect to Google Slides</h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadPresentations}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {selectedSlide ? (
        // Presentation Editor View
        <div className="h-full flex flex-col">
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-orange-50'}`}>
            <div className="flex items-center gap-3">
              <Presentation className="w-5 h-5 text-orange-500" />
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedSlide.name}</h3>
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
                onClick={() => setSelectedSlide(null)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={`https://docs.google.com/presentation/d/${selectedSlide.id}/edit`}
              className="w-full h-full border-0"
              title={selectedSlide.name}
              allow="clipboard-read; clipboard-write"
            />
          </div>
        </div>
      ) : (
        // Presentation List View
        <>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                <Presentation className="w-5 h-5 text-orange-500" />
                Google Slides
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Presentation
                </button>
                <button
                  onClick={loadPresentations}
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
            ) : presentations.length === 0 ? (
              <div className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Presentation className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No presentations found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Create Your First Presentation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {presentations.map((slide) => (
                  <div
                    key={slide.id}
                    onClick={() => setSelectedSlide(slide)}
                    className={`rounded-lg p-4 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group ${isDark ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                          <Presentation className="w-12 h-12 text-orange-500" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate group-hover:text-orange-600 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {slide.name}
                        </h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Modified: {formatDate(slide.modifiedTime)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-full py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center justify-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Open Presentation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Presentation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Presentation</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <form onSubmit={handleCreateSlide} className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Presentation Title
                </label>
                <input
                  type="text"
                  value={newSlideTitle}
                  onChange={(e) => setNewSlideTitle(e.target.value)}
                  placeholder="Untitled Presentation"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
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
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
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
      {showShareModal && selectedSlide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Share Presentation</h3>
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
                  https://docs.google.com/presentation/d/{selectedSlide.id}/edit
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

export default SlidesTab;
