import React, { useState, useEffect } from 'react';
import { Mail, Calendar as CalendarIcon, HardDrive, FileText, Sheet, Presentation, X, Maximize2, Minimize2, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GmailTab from './workspace/GmailTab';
import DriveTab from './workspace/DriveTab';
import DocsTab from './workspace/DocsTab';
import SheetsTab from './workspace/SheetsTab';
import SlidesTab from './workspace/SlidesTab';
import CalendarTab from './workspace/CalendarTab';

const GoogleWorkspace = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('gmail');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('googleWorkspaceTheme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('googleWorkspaceTheme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(current => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'auto';
      return 'light';
    });
  };

  const getEffectiveTheme = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const effectiveTheme = getEffectiveTheme();

  const tabs = [
    { id: 'gmail', name: 'Gmail', icon: Mail, color: 'from-red-500 to-pink-500' },
    { id: 'drive', name: 'Drive', icon: HardDrive, color: 'from-yellow-500 to-orange-500' },
    { id: 'docs', name: 'Docs', icon: FileText, color: 'from-blue-500 to-blue-600' },
    { id: 'sheets', name: 'Sheets', icon: Sheet, color: 'from-green-500 to-green-600' },
    { id: 'slides', name: 'Slides', icon: Presentation, color: 'from-yellow-500 to-yellow-600' },
    { id: 'calendar', name: 'Calendar', icon: CalendarIcon, color: 'from-blue-500 to-cyan-500' }
  ];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render content based on active tab
  const renderContent = () => {
    const themeProps = { theme: effectiveTheme };
    switch (activeTab) {
      case 'gmail':
        return <GmailTab {...themeProps} />;
      case 'drive':
        return <DriveTab {...themeProps} />;
      case 'docs':
        return <DocsTab {...themeProps} />;
      case 'sheets':
        return <SheetsTab {...themeProps} />;
      case 'slides':
        return <SlidesTab {...themeProps} />;
      case 'calendar':
        return <CalendarTab {...themeProps} />;
      default:
        return null;
    }
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm";

  const innerClasses = isFullscreen
    ? "w-full h-full flex flex-col"
    : "w-full h-full max-w-7xl max-h-[90vh] m-4 backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl flex flex-col";

  return (
    <div className={containerClasses}>
      <div className={innerClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 backdrop-blur-xl bg-white/5">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <h2 className="text-2xl font-bold text-white">Google Workspace</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={`Theme: ${theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}`}
            >
              {theme === 'light' && <Sun className="w-6 h-6 text-white" />}
              {theme === 'dark' && <Moon className="w-6 h-6 text-white" />}
              {theme === 'auto' && <Monitor className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6 text-white" />
              ) : (
                <Maximize2 className="w-6 h-6 text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/20 overflow-x-auto backdrop-blur-xl bg-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'backdrop-blur-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:scale-102'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-hidden relative ${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default GoogleWorkspace;
