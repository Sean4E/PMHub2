import React, { useState, useEffect } from 'react';
import { HardDrive, Search, RefreshCw, Folder, FolderPlus, Grid, List, File, FileText, Image, Sheet, Presentation, AlertCircle, X, Eye, Download, Share2, Trash2, Code, Archive, Video, Music, ArrowUpDown, ChevronRight, Home } from 'lucide-react';
import { driveApi } from '../../services/googleApi';

const DriveTab = ({ theme = 'light' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('modifiedTime'); // 'name', 'modifiedTime', 'foldersFirst'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [previewFile, setPreviewFile] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [folderPath, setFolderPath] = useState([{ id: null, name: 'My Drive' }]); // Breadcrumb trail

  const isDark = theme === 'dark';

  useEffect(() => {
    loadFiles();
  }, []);

  // Reload files when currentFolderId changes
  useEffect(() => {
    loadFiles();
  }, [currentFolderId]);

  const loadFiles = async (resetPagination = true) => {
    try {
      setLoading(true);
      setError(null);
      setNextPageToken(null);
      setHasMore(false);

      // Build query for current folder
      let query = currentFolderId
        ? `'${currentFolderId}' in parents and trashed=false`
        : `'root' in parents and trashed=false`;

      // Add search query if exists
      if (searchQuery) {
        query += ` and name contains '${searchQuery}'`;
      }

      // Only use valid Google Drive orderBy values
      let apiOrderBy = 'modifiedTime desc';
      if (sortBy === 'name') {
        apiOrderBy = `name ${sortOrder}`;
      } else if (sortBy === 'modifiedTime') {
        apiOrderBy = `modifiedTime ${sortOrder}`;
      }
      // For foldersFirst, we'll sort on the client side

      const response = await driveApi.listFiles(100, query, apiOrderBy, null);
      if (response.success) {
        let fetchedFiles = response.data.files || [];

        // Apply custom sorting for folders first
        if (sortBy === 'foldersFirst') {
          fetchedFiles = fetchedFiles.sort((a, b) => {
            const aIsFolder = a.mimeType.includes('folder');
            const bIsFolder = b.mimeType.includes('folder');
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.name.localeCompare(b.name);
          });
        }

        setFiles(fetchedFiles);
        setNextPageToken(response.data.nextPageToken || null);
        setHasMore(!!response.data.nextPageToken);
      }
    } catch (err) {
      console.error('Error loading files:', err);
      setError(err.response?.data?.message || 'Failed to load Drive files.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFiles = async () => {
    if (!nextPageToken || loadingMore) return;

    try {
      setLoadingMore(true);

      // Build query for current folder with same logic as loadFiles
      let query = currentFolderId
        ? `'${currentFolderId}' in parents and trashed=false`
        : `'root' in parents and trashed=false`;

      // Add search query if exists
      if (searchQuery) {
        query += ` and name contains '${searchQuery}'`;
      }

      // Use the same orderBy that was used for initial load
      let apiOrderBy = 'modifiedTime desc';
      if (sortBy === 'name') {
        apiOrderBy = `name ${sortOrder}`;
      } else if (sortBy === 'modifiedTime') {
        apiOrderBy = `modifiedTime ${sortOrder}`;
      }

      const response = await driveApi.listFiles(100, query, apiOrderBy, nextPageToken);
      if (response.success) {
        let fetchedFiles = response.data.files || [];

        // Apply custom sorting for folders first
        if (sortBy === 'foldersFirst') {
          fetchedFiles = fetchedFiles.sort((a, b) => {
            const aIsFolder = a.mimeType.includes('folder');
            const bIsFolder = b.mimeType.includes('folder');
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.name.localeCompare(b.name);
          });
        }

        setFiles(prevFiles => [...prevFiles, ...fetchedFiles]);
        setNextPageToken(response.data.nextPageToken || null);
        setHasMore(!!response.data.nextPageToken);
      }
    } catch (err) {
      console.error('Error loading more files:', err);
      setError(err.response?.data?.message || 'Failed to load more files.');
    } finally {
      setLoadingMore(false);
    }
  };

  const navigateToFolder = (folderId, folderName) => {
    if (folderId === currentFolderId) return; // Already in this folder

    // Find if this folder is already in the path (going back)
    const existingIndex = folderPath.findIndex(item => item.id === folderId);

    if (existingIndex !== -1) {
      // Going back to a parent folder - slice the path
      setFolderPath(folderPath.slice(0, existingIndex + 1));
    } else {
      // Going forward into a subfolder - add to path
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    }

    setCurrentFolderId(folderId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadFiles();
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await driveApi.createFolder(newFolderName);
      if (response.success) {
        setShowCreateFolder(false);
        setNewFolderName('');
        loadFiles();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(err.response?.data?.message || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  const cycleSort = () => {
    if (sortBy === 'modifiedTime') {
      setSortBy('name');
      setSortOrder('asc');
    } else if (sortBy === 'name' && sortOrder === 'asc') {
      setSortBy('name');
      setSortOrder('desc');
    } else if (sortBy === 'name' && sortOrder === 'desc') {
      setSortBy('foldersFirst');
      setSortOrder('asc');
    } else {
      setSortBy('modifiedTime');
      setSortOrder('desc');
    }
    setTimeout(loadFiles, 100);
  };

  const getSortLabel = () => {
    if (sortBy === 'foldersFirst') return 'Folders First';
    if (sortBy === 'name') return sortOrder === 'asc' ? 'Name (A-Z)' : 'Name (Z-A)';
    return 'Modified Date';
  };

  const getFileIcon = (mimeType, name = '', size = 'w-6 h-6') => {
    const ext = name.split('.').pop().toLowerCase();

    if (mimeType.includes('folder'))
      return <Folder className={`${size} text-yellow-500`} />;
    if (mimeType.includes('document'))
      return <FileText className={`${size} text-blue-500`} />;
    if (mimeType.includes('spreadsheet'))
      return <Sheet className={`${size} text-green-500`} />;
    if (mimeType.includes('presentation'))
      return <Presentation className={`${size} text-orange-500`} />;
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext))
      return <Image className={`${size} text-purple-500`} />;
    if (['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java', 'cpp', 'c'].includes(ext))
      return <Code className={`${size} text-cyan-500`} />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext))
      return <Archive className={`${size} text-amber-600`} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext))
      return <Video className={`${size} text-red-500`} />;
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext))
      return <Music className={`${size} text-pink-500`} />;

    return <File className={`${size} text-gray-500`} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewUrl = (file) => {
    const mimeType = file.mimeType;
    if (mimeType.includes('document')) return `https://docs.google.com/document/d/${file.id}/preview`;
    if (mimeType.includes('spreadsheet')) return `https://docs.google.com/spreadsheets/d/${file.id}/preview`;
    if (mimeType.includes('presentation')) return `https://docs.google.com/presentation/d/${file.id}/preview`;
    return `https://drive.google.com/file/d/${file.id}/preview`;
  };

  const canPreview = (mimeType) => {
    return (
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation') ||
      mimeType.includes('image') ||
      mimeType.includes('pdf')
    );
  };

  const handleFileClick = (file) => {
    if (file.mimeType.includes('folder')) {
      // Navigate to folder
      navigateToFolder(file.id, file.name);
    } else if (canPreview(file.mimeType)) {
      // Preview file
      setPreviewFile(file);
    }
  };

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center p-8 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Unable to Connect to Google Drive
          </h3>
          <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={loadFiles}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <HardDrive className="w-5 h-5 text-yellow-500" />
            My Drive
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateFolder(true)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <button
              onClick={cycleSort}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={`Sort by: ${getSortLabel()}`}
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={viewMode === 'grid' ? 'List View' : 'Grid View'}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
            </button>
            <button
              onClick={loadFiles}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </form>

        {/* Sort indicator */}
        <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Sorted by: {getSortLabel()}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center gap-2 overflow-x-auto">
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id || 'root'}>
              {index > 0 && (
                <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
              <button
                onClick={() => navigateToFolder(folder.id, folder.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  index === folderPath.length - 1
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-200'
                }`}
                disabled={index === folderPath.length - 1}
              >
                {index === 0 ? (
                  <>
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </>
                ) : (
                  <>
                    <Folder className="w-4 h-4" />
                    <span className="text-sm font-medium">{folder.name}</span>
                  </>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
        ) : files.length === 0 ? (
          <div className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No files found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className={`border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 flex items-center justify-center mb-3 bg-white/5 rounded-lg">
                    {file.thumbnailLink && (file.mimeType.includes('image') || file.mimeType.includes('video')) ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getFileIcon(file.mimeType, file.name, 'w-12 h-12')}
                      </div>
                    )}
                  </div>
                  <p className={`text-sm font-medium text-center truncate w-full ${
                    isDark ? 'text-gray-200' : 'text-gray-800'
                  }`} title={file.name}>
                    {file.name}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {file.mimeType.includes('folder') ? 'Folder' : formatFileSize(file.size)}
                  </p>
                </div>
                {file.mimeType.includes('folder') ? (
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center justify-center gap-1">
                      <Folder className="w-3 h-3" />
                      Open
                    </button>
                  </div>
                ) : canPreview(file.mimeType) ? (
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-full py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer group ${
                  isDark
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.mimeType, file.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {file.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Modified: {formatDate(file.modifiedTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {file.mimeType.includes('folder') ? 'Folder' : formatFileSize(file.size)}
                  </span>
                  {file.mimeType.includes('folder') ? (
                    <button className="opacity-0 group-hover:opacity-100 p-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                      <Folder className="w-4 h-4" />
                    </button>
                  ) : canPreview(file.mimeType) ? (
                    <button className="opacity-0 group-hover:opacity-100 p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && hasMore && files.length > 0 && (
          <div className="flex justify-center mt-6 pb-4">
            <button
              onClick={loadMoreFiles}
              disabled={loadingMore}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading More...
                </>
              ) : (
                <>
                  <HardDrive className="w-5 h-5" />
                  Load More Files
                </>
              )}
            </button>
          </div>
        )}

        {/* Files Count Indicator */}
        {files.length > 0 && (
          <div className={`text-center py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {files.length} file{files.length !== 1 ? 's' : ''}{hasMore ? ' • More available' : ' • All files loaded'}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Folder</h3>
              <button
                onClick={() => setShowCreateFolder(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New Folder"
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(previewFile.mimeType, previewFile.name)}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {previewFile.name}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatFileSize(previewFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  title="Open in Google Drive"
                >
                  <Download className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <iframe
                src={getPreviewUrl(previewFile)}
                className="w-full h-full border-0"
                title={previewFile.name}
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveTab;
