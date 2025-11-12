import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, BarChart3, Layout, FolderKanban, ChevronDown, Plus, X, Check, Clock, TrendingUp, Target, AlertCircle, Menu, LogOut, Search, Filter, Download, Upload, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleWorkspace from './GoogleWorkspace';
import AnalyticsDashboard from './AnalyticsDashboard';
import { projectsAPI, tasksAPI, teamsAPI, usersAPI, authAPI } from '../services/api';

const ProjectManager = ({ user: propUser }) => {
  const { logout } = useAuth();
  // Settings state with default terminology
  const [settings, setSettings] = useState({
    projectLabel: 'Project',
    projectsLabel: 'Projects',
    taskLabel: 'Task',
    tasksLabel: 'Tasks',
    appName: 'Project Manager',
    primaryColor: '#60a5fa',
    accentColor: '#8b5cf6',
    enableGmail: true,
    enableDrive: true,
    enableDocs: true,
    enableSheets: true,
    enableSlides: true,
    enableCalendar: true,
    enableGoogleDrive: true,
    enableGoogleCalendar: true,
    autoCreateFolders: true,
    autoCreateEvents: true,
    pmHubFolderName: 'PM Hub',
    projectsFolderName: 'Projects'
  });

  // User state from props
  const [currentUser, setCurrentUser] = useState(propUser || null);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  // App state
  const [currentView, setCurrentView] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showGoogleWorkspace, setShowGoogleWorkspace] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedGanttProject, setSelectedGanttProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tasks, setTasks] = useState([]);

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  // API data loading functions
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.getAll();
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasks = async () => {
    try {
      const allTasks = [];
      for (const project of projects) {
        const response = await tasksAPI.getByProject(project.id);
        if (response.data.success) {
          allTasks.push(...response.data.data);
        }
      }
      setTasks(allTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      if (response.data.success) {
        // Transform teams data to match expected format
        const transformedTeams = response.data.data.map(team => ({
          ...team,
          members: team.members ? team.members.map(m => m.id) : []
        }));
        setTeams(transformedTeams);
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Load projects, teams and users on mount
  useEffect(() => {
    loadProjects();
    loadTeams();
    loadUsers();
  }, []);

  // Load tasks when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadAllTasks();
    }
  }, [projects]);

  // Google Drive integration
  const createDriveFolder = async (projectName, projectId) => {
    if (!settings.enableGoogleDrive || !settings.autoCreateFolders) return null;

    // Structure: PM Hub / Projects_2025 / ProjectName / Tasks
    const year = new Date().getFullYear();
    const mainFolder = settings.pmHubFolderName || 'PM Hub';
    const projectsFolder = `${settings.projectsFolderName || 'Projects'}_${year}`;

    // Mock API call - in production, this would call Google Drive API
    console.log(`Creating Drive folder structure:`);
    console.log(`  ${mainFolder} / ${projectsFolder} / ${projectName} / Tasks`);

    return {
      mainFolderId: `drive.google.com/folder/${Math.random().toString(36).substr(2, 9)}`,
      projectsFolderId: `drive.google.com/folder/${Math.random().toString(36).substr(2, 9)}`,
      projectFolderId: `drive.google.com/folder/${Math.random().toString(36).substr(2, 9)}`,
      tasksFolderId: `drive.google.com/folder/${Math.random().toString(36).substr(2, 9)}`
    };
  };

  // Create task folder within project
  const createTaskFolder = async (taskName, projectId) => {
    if (!settings.enableGoogleDrive || !settings.autoCreateFolders) return null;

    const project = projects.find(p => p.id === projectId);
    if (!project || !project.driveFolder) return null;

    // Mock API call - in production, this would create folder in Tasks subfolder
    console.log(`Creating task folder: ${taskName} in project ${project.name}`);
    return `drive.google.com/folder/${Math.random().toString(36).substr(2, 9)}`;
  };

  // Google Calendar integration
  const createCalendarEvent = async (task, project) => {
    if (!settings.enableGoogleCalendar || !settings.autoCreateEvents) return null;

    // Calculate event times
    const dueDate = new Date(task.dueDate);
    const estimatedHours = task.estimatedHours || 1;
    const startDate = new Date(dueDate.getTime() - (estimatedHours * 60 * 60 * 1000));

    // Gather attendees from task assignees and assigned teams
    const attendees = [];

    // Add individual assignees
    if (task.assignees && task.assignees.length > 0) {
      task.assignees.forEach(userId => {
        const user = users.find(u => u.id === userId);
        if (user && user.email) {
          attendees.push({ email: user.email, name: user.name });
        }
      });
    }

    // Add team members from assigned teams
    if (task.assignedTeams && task.assignedTeams.length > 0) {
      task.assignedTeams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team && team.members) {
          team.members.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (user && user.email && !attendees.find(a => a.email === user.email)) {
              attendees.push({ email: user.email, name: user.name });
            }
          });
        }
      });
    }

    // Mock API call - in production, this would call Google Calendar API
    console.log(`Creating calendar event:`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Description: ${task.description || 'No description'}`);
    console.log(`  Project: ${project?.name || 'N/A'}`);
    console.log(`  Start: ${startDate.toISOString()}`);
    console.log(`  End: ${dueDate.toISOString()}`);
    console.log(`  Duration: ${estimatedHours} hours`);
    console.log(`  Attendees:`, attendees);

    return `calendar.google.com/event/${Math.random().toString(36).substr(2, 9)}`;
  };

  // Subtask Component
  const SubtaskList = ({ task }) => {
    // Parse subtasks - it might be a JSON string from SQLite
    const parseSubtasks = (subtasks) => {
      if (!subtasks) return [];
      if (Array.isArray(subtasks)) return subtasks;
      if (typeof subtasks === 'string') {
        try {
          return JSON.parse(subtasks);
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    const [subtasks, setSubtasks] = useState(parseSubtasks(task.subtasks));
    const [newSubtask, setNewSubtask] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleToggleSubtask = async (index) => {
      const updated = [...subtasks];
      updated[index].completed = !updated[index].completed;
      setSubtasks(updated);

      try {
        await tasksAPI.update(task.id, { subtasks: updated });
        await loadProjects(); // Refresh to get updated progress
      } catch (err) {
        console.error('Error updating subtask:', err);
        // Revert on error
        setSubtasks(parseSubtasks(task.subtasks));
      }
    };

    const handleAddSubtask = async (e) => {
      e.stopPropagation();
      if (!newSubtask.trim()) return;

      const updated = [...subtasks, {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false
      }];
      setSubtasks(updated);
      setNewSubtask('');
      setIsAdding(false);

      try {
        await tasksAPI.update(task.id, { subtasks: updated });
        await loadProjects();
      } catch (err) {
        console.error('Error adding subtask:', err);
        setSubtasks(parseSubtasks(task.subtasks));
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleAddSubtask(e);
      } else if (e.key === 'Escape') {
        setNewSubtask('');
        setIsAdding(false);
      }
    };

    return (
      <div className="mt-3 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          {subtasks.map((subtask, index) => (
            <label key={subtask.id} className="flex items-center gap-2 text-xs cursor-pointer group/subtask">
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => handleToggleSubtask(index)}
                className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                {subtask.title}
              </span>
            </label>
          ))}
          {isAdding ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  if (!newSubtask.trim()) setIsAdding(false);
                }}
                placeholder="Add subtask..."
                className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/20 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(true);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add subtask
            </button>
          )}
        </div>
      </div>
    );
  };

  // Project handlers
  const handleCreateProject = async (projectData) => {
    try {
      const response = await projectsAPI.create({
        name: projectData.name,
        description: projectData.description,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        color: projectData.color || '#60a5fa',
        createDriveFolder: settings.enableGoogleDrive && settings.autoCreateFolders
      });

      if (response.data.success) {
        setShowProjectModal(false);
        await loadProjects(); // Reload to get new project with progress
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  // Task handlers
  const handleCreateTask = async (taskData) => {
    try {
      const response = await tasksAPI.create(taskData.projectId, {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours || 0,
        assignees: taskData.assignees || [],
        createCalendarEvent: taskData.createCalendarEvent || false
      });

      if (response.data.success) {
        setShowTaskModal(false);
        await loadAllTasks();
        await loadProjects(); // Reload to get updated progress

        // Show success message if calendar event was created
        if (response.data.data.calendarEventId) {
          console.log('Calendar event created:', response.data.data.calendarEventUrl);
        }
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ));

      // API call
      const response = await tasksAPI.update(taskId, { status: newStatus });

      if (response.data.success) {
        // Reload projects to get updated progress
        await loadProjects();
        await loadAllTasks();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert optimistic update
      loadAllTasks();
    }
  };

  // Team handlers
  const handleCreateTeam = (teamData) => {
    const newTeam = {
      id: 'team' + Date.now(),
      name: teamData.name,
      members: teamData.members || [],
      color: teamData.color || '#60a5fa'
    };

    setTeams([...teams, newTeam]);
    setShowTeamModal(false);
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      const response = await teamsAPI.update(editingTeam.id, {
        name: teamData.name,
        color: teamData.color,
        members: teamData.members
      });

      if (response.data.success) {
        await loadTeams(); // Reload teams from database
        setShowEditTeamModal(false);
        setEditingTeam(null);
      }
    } catch (err) {
      console.error('Error updating team:', err);
      setError(err.response?.data?.message || 'Failed to update team');
    }
  };

  // Member handlers
  const handleAddMember = async (memberData) => {
    try {
      // Register new user via auth API
      const password = 'TempPass123!'; // Temporary password - user should reset
      const response = await authAPI.register({
        name: memberData.name,
        email: memberData.email,
        password: password,
        role: memberData.role || 'member'
      });

      if (response.data.success) {
        await loadUsers(); // Reload users from database
        setShowMemberModal(false);
      }
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleUpdateMember = async (memberData) => {
    try {
      const response = await usersAPI.update(editingMember.id, {
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        avatar: memberData.avatar || memberData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      });

      if (response.data.success) {
        await loadUsers(); // Reload users from database
        setShowEditMemberModal(false);
        setEditingMember(null);
      }
    } catch (err) {
      console.error('Error updating member:', err);
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  // Project update handler
  const handleUpdateProject = (projectData) => {
    setProjects(projects.map(p =>
      p.id === editingProject.id
        ? { ...p, ...projectData }
        : p
    ));
    setShowEditProjectModal(false);
    setEditingProject(null);
  };

  // Task update handler
  const handleUpdateTask = (taskData) => {
    setTasks(tasks.map(t =>
      t.id === editingTask.id
        ? { ...t, ...taskData }
        : t
    ));
    setShowEditTaskModal(false);
    setEditingTask(null);
  };

  // Delete handlers
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      return;
    }

    try {
      const response = await projectsAPI.delete(projectId);
      if (response.data.success) {
        await loadProjects();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await tasksAPI.delete(taskId);
      if (response.data.success) {
        await loadAllTasks();
        await loadProjects(); // Refresh to update progress
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }
    setTeams(teams.filter(team => team.id !== teamId));
  };

  const handleDeleteMember = (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    setUsers(users.filter(user => user.id !== userId));
  };

  // Calculate analytics
  const calculateAnalytics = () => {
    const completedTasks = tasks.filter(t => t.status === 'done');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    const onTimeCompletion = completedTasks.filter(t => {
      return t.completedDate && t.dueDate && t.completedDate <= t.dueDate;
    }).length;
    
    const onTimeRate = completedTasks.length > 0 ? (onTimeCompletion / completedTasks.length) * 100 : 0;
    
    const estimationAccuracy = completedTasks.filter(t => {
      const variance = Math.abs(t.actualHours - t.estimatedHours) / t.estimatedHours;
      return variance <= 0.2; // Within 20%
    }).length;
    
    const estimationRate = completedTasks.length > 0 ? (estimationAccuracy / completedTasks.length) * 100 : 0;
    
    return {
      completionRate: completionRate.toFixed(1),
      onTimeRate: onTimeRate.toFixed(1),
      estimationRate: estimationRate.toFixed(1),
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      totalTasks,
      completedTasks: completedTasks.length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length
    };
  };

  const analytics = calculateAnalytics();

  // Main Application
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="PM Hub" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-white hidden sm:block">{settings.appName}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-2 backdrop-blur-xl bg-white/5 rounded-lg border border-white/20">
              {currentUser?.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {currentUser?.avatar || currentUser?.name?.charAt(0)}
                </div>
              )}
              <div className="hidden sm:block">
                <div className="text-white text-sm font-medium">{currentUser?.name}</div>
                <div className="text-gray-400 text-xs">{currentUser?.email}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 backdrop-blur-xl bg-white/5 border-r border-white/20 transition-transform duration-300 mt-16 lg:mt-0`}>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Layout className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => setCurrentView('kanban')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === 'kanban'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <FolderKanban className="w-5 h-5" />
              <span className="font-medium">Kanban</span>
            </button>
            
            <button
              onClick={() => setCurrentView('gantt')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === 'gantt'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Gantt Chart</span>
            </button>
            
            <button
              onClick={() => setCurrentView('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === 'analytics'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </button>
            
            <button
              onClick={() => setCurrentView('teams')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === 'teams'
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Teams</span>
            </button>

            <button
              onClick={() => setShowGoogleWorkspace(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gray-300 hover:bg-white/5 bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-red-500/30"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">Google</span>
            </button>
          </nav>
          
          <div className="p-4 mt-4 border-t border-white/20">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">{settings.projectsLabel}</h3>
            <div className="space-y-1">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project.id);
                    setCurrentView('kanban');
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedProject === project.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                  <p className="text-gray-400 mt-1">Overview of all {settings.projectsLabel.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New {settings.projectLabel}
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{settings.projectsLabel}</p>
                      <p className="text-3xl font-bold text-white mt-1">{analytics.totalProjects}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <FolderKanban className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-sm text-green-400 mt-4">{analytics.activeProjects} active</p>
                </div>

                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Completion Rate</p>
                      <p className="text-3xl font-bold text-white mt-1">{analytics.completionRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">{analytics.completedTasks} of {analytics.totalTasks} {settings.tasksLabel.toLowerCase()}</p>
                </div>

                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">On-Time Rate</p>
                      <p className="text-3xl font-bold text-white mt-1">{analytics.onTimeRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">Six Sigma metric</p>
                </div>

                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Estimation Accuracy</p>
                      <p className="text-3xl font-bold text-white mt-1">{analytics.estimationRate}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">Within 20% variance</p>
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                  
                  return (
                    <div
                      key={project.id}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all cursor-pointer group relative"
                      onClick={() => {
                        setSelectedProject(project.id);
                        setCurrentView('kanban');
                      }}
                    >
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setShowEditProjectModal(true);
                          }}
                          className="p-2 bg-white/5 hover:bg-white/20 rounded-lg transition-all"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                          <p className="text-gray-400 text-sm">{project.description}</p>
                        </div>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white font-medium">{project.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{settings.tasksLabel}</span>
                          <span className="text-white">{completedTasks}/{projectTasks.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Team</span>
                          <div className="flex -space-x-2">
                            {(project.members || []).slice(0, 3).map((member, index) => {
                              return (
                                <div
                                  key={member.id}
                                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium"
                                  title={member?.name}
                                >
                                  {member?.avatar?.[0] || member?.name?.[0] || '?'}
                                </div>
                              );
                            })}
                            {(project.members || []).length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-slate-900 flex items-center justify-center text-white text-xs font-medium">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {project.driveFolder && (
                          <div className="flex items-center gap-2 text-xs text-blue-400 pt-2 border-t border-white/10">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7.71 3.5L1.15 15l3.42 6h14.86l3.42-6-6.56-11.5H7.71zM8.5 10l3.5-6h3l3.5 6-3.5 6h-3l-3.5-6z"/>
                            </svg>
                            <span>Google Drive connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kanban View */}
          {currentView === 'kanban' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Kanban Board</h2>
                  {selectedProject && (
                    <p className="text-gray-400 mt-1">
                      {projects.find(p => p.id === selectedProject)?.name || 'All ' + settings.projectsLabel}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value || null)}
                    className="pl-4 pr-10 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                  >
                    <option value="">All {settings.projectsLabel}</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New {settings.taskLabel}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['todo', 'in-progress', 'review', 'done'].map(status => {
                  const statusTasks = tasks.filter(t => 
                    t.status === status && (!selectedProject || t.projectId === selectedProject)
                  );
                  
                  const statusLabels = {
                    'todo': 'To Do',
                    'in-progress': 'In Progress',
                    'review': 'Review',
                    'done': 'Done'
                  };
                  
                  const statusColors = {
                    'todo': 'text-gray-400',
                    'in-progress': 'text-blue-400',
                    'review': 'text-yellow-400',
                    'done': 'text-green-400'
                  };
                  
                  return (
                    <div key={status} className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-semibold ${statusColors[status]}`}>
                          {statusLabels[status]}
                        </h3>
                        <span className="text-gray-400 text-sm">{statusTasks.length}</span>
                      </div>
                      
                      <div className="space-y-3">
                        {statusTasks.map(task => {
                          const project = projects.find(p => p.id === task.projectId);
                          
                          return (
                            <div
                              key={task.id}
                              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all cursor-pointer group relative"
                            >
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask(task);
                                    setShowEditTaskModal(true);
                                  }}
                                  className="p-1.5 bg-white/5 hover:bg-white/20 rounded-lg transition-all"
                                  title="Edit Task"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-white" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-all"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-white text-sm pr-8">{task.title}</h4>
                                {task.priority === 'critical' && (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              
                              <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
                              
                              {project && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                  <span className="text-xs text-gray-400">{project.name}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  {(task.assignees || []).map(userId => {
                                    const user = users.find(u => u.id === userId);
                                    return user ? (
                                      <div
                                        key={userId}
                                        className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-white text-xs"
                                        title={user?.name}
                                      >
                                        {user?.avatar?.[0] || '?'}
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                                
                                {task.dueDate && (
                                  <span className="text-xs text-gray-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                              </div>
                              
                              {task.calendarEvent && (
                                <div className="mt-2 pt-2 border-t border-white/10">
                                  <div className="flex items-center gap-1 text-xs text-blue-400">
                                    <Calendar className="w-3 h-3" />
                                    <span>Calendar event created</span>
                                  </div>
                                </div>
                              )}

                              {/* Subtasks */}
                              <SubtaskList task={task} />

                              <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {status !== 'todo' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const statuses = ['todo', 'in-progress', 'review', 'done'];
                                      const currentIndex = statuses.indexOf(status);
                                      if (currentIndex > 0) {
                                        handleUpdateTaskStatus(task.id, statuses[currentIndex - 1]);
                                      }
                                    }}
                                    className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded transition-all"
                                  >
                                    ←
                                  </button>
                                )}
                                {status !== 'done' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const statuses = ['todo', 'in-progress', 'review', 'done'];
                                      const currentIndex = statuses.indexOf(status);
                                      if (currentIndex < statuses.length - 1) {
                                        handleUpdateTaskStatus(task.id, statuses[currentIndex + 1]);
                                      }
                                    }}
                                    className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded transition-all"
                                  >
                                    →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gantt Chart View */}
          {currentView === 'gantt' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Gantt Chart</h2>
                  <p className="text-gray-400 mt-1">
                    {selectedGanttProject
                      ? `Timeline view of ${projects.find(p => p.id === selectedGanttProject)?.name} tasks`
                      : `Timeline view of all ${settings.projectsLabel.toLowerCase()}`}
                  </p>
                </div>
                <div>
                  <select
                    value={selectedGanttProject || ''}
                    onChange={(e) => setSelectedGanttProject(e.target.value || null)}
                    className="pl-4 pr-10 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-no-repeat bg-right"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                  >
                    <option value="">All {settings.projectsLabel}</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* Timeline Header */}
                    <div className="flex border-b border-white/20 pb-4 mb-4">
                      <div className="w-64 flex-shrink-0">
                        <span className="text-gray-400 text-sm font-medium">
                          {selectedGanttProject ? settings.taskLabel : settings.projectLabel}
                        </span>
                      </div>
                      <div className="flex-1 grid grid-cols-12 gap-1 text-center">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                          <div key={month} className="text-gray-400 text-xs">{month}</div>
                        ))}
                      </div>
                    </div>

                    {/* Projects or Tasks */}
                    <div className="space-y-4">
                      {selectedGanttProject ? (
                        // Show tasks for selected project
                        tasks
                          .filter(task => task.projectId === selectedGanttProject && task.dueDate)
                          .map(task => {
                            const project = projects.find(p => p.id === task.projectId);
                            const dueDate = new Date(task.dueDate);
                            const createdDate = new Date(task.createdDate);
                            const startMonth = createdDate.getMonth();
                            const duration = Math.max(1, Math.ceil((dueDate - createdDate) / (1000 * 60 * 60 * 24 * 30)));

                            // Calculate progress based on status
                            const statusProgress = {
                              'todo': 0,
                              'in-progress': 50,
                              'review': 75,
                              'done': 100
                            };
                            const taskProgress = statusProgress[task.status] || 0;

                            return (
                              <div key={task.id} className="flex items-center">
                                <div className="w-64 flex-shrink-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project?.color || '#60a5fa' }} />
                                    <span className="text-white text-sm font-medium truncate">{task.title}</span>
                                  </div>
                                  <div className="ml-5 text-xs space-y-0.5">
                                    <div className="text-gray-400">{taskProgress}% complete</div>
                                    <div className="flex -space-x-1">
                                      {task.assignees.slice(0, 3).map(userId => {
                                        const user = users.find(u => u.id === userId);
                                        return user ? (
                                          <div
                                            key={userId}
                                            className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border border-slate-900 flex items-center justify-center text-white text-[9px]"
                                            title={user.name}
                                          >
                                            {user.avatar[0]}
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-1 grid grid-cols-12 gap-1 relative">
                                  <div
                                    className="rounded-lg relative overflow-hidden"
                                    style={{
                                      gridColumn: `${startMonth + 1} / span ${Math.min(duration, 12 - startMonth)}`,
                                      backgroundColor: (project?.color || '#60a5fa') + '40',
                                      border: `1px solid ${(project?.color || '#60a5fa')}80`
                                    }}
                                  >
                                    <div
                                      className="h-8 rounded-lg transition-all"
                                      style={{
                                        width: `${taskProgress}%`,
                                        backgroundColor: project?.color || '#60a5fa'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        // Show all projects
                        projects.map(project => {
                          const start = new Date(project.startDate);
                          const end = new Date(project.endDate);
                          const startMonth = start.getMonth();
                          const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));

                          return (
                            <div key={project.id} className="flex items-center">
                              <div className="w-64 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                                  <span className="text-white text-sm font-medium">{project.name}</span>
                                </div>
                                <span className="text-gray-400 text-xs ml-5">{project.progress}% complete</span>
                              </div>
                              <div className="flex-1 grid grid-cols-12 gap-1 relative">
                                <div
                                  className="rounded-lg relative overflow-hidden"
                                  style={{
                                    gridColumn: `${startMonth + 1} / span ${Math.min(duration, 12 - startMonth)}`,
                                    backgroundColor: project.color + '40',
                                    border: `1px solid ${project.color}80`
                                  }}
                                >
                                  <div
                                    className="h-8 rounded-lg transition-all"
                                    style={{
                                      width: `${project.progress}%`,
                                      backgroundColor: project.color
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics View */}
          {currentView === 'analytics' && (
            <AnalyticsDashboard projects={projects} tasks={tasks} />
          )}

          {/* Teams View */}
          {currentView === 'teams' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Teams</h2>
                  <p className="text-gray-400 mt-1">Manage your teams and members</p>
                </div>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Team
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 group relative">
                    <button
                      onClick={() => {
                        setEditingTeam(team);
                        setShowEditTeamModal(true);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Edit Team"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: team.color + '40' }}>
                          <Users className="w-6 h-6" style={{ color: team.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                          <p className="text-gray-400 text-sm">{team.members.length} members</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {team.members && team.members.map(userId => {
                        const user = users.find(u => u.id === userId);
                        if (!user) return null;

                        return (
                          <div key={userId} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                              {user.avatar?.startsWith('http') ? (
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                              ) : (
                                user.avatar || user.name?.charAt(0) || '?'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-medium text-sm">{user.name}</div>
                              <div className="text-gray-400 text-xs">{user.role}</div>
                            </div>
                            <div className="text-gray-400 text-xs">{user.email}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">All Team Members</h3>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Member
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map(user => {
                    const userTeams = teams.filter(t => t.members.includes(user.id));

                    return (
                      <div key={user.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all group relative">
                        <button
                          onClick={() => {
                            setEditingMember(user);
                            setShowEditMemberModal(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/5 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Member"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white" />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg overflow-hidden">
                          {user.avatar?.startsWith('http') ? (
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            user.avatar || user.name?.charAt(0) || '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">{user.name}</div>
                          <div className="text-gray-400 text-sm">{user.role}</div>
                          <div className="flex gap-1 mt-1">
                            {userTeams.map(team => (
                              <div
                                key={team.id}
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ backgroundColor: team.color + '40', color: team.color }}
                              >
                                {team.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Terminology</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Application Name</label>
                    <input
                      type="text"
                      value={settings.appName}
                      onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Single {settings.projectLabel} Label</label>
                    <input
                      type="text"
                      value={settings.projectLabel}
                      onChange={(e) => setSettings({ ...settings, projectLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Plural {settings.projectsLabel} Label</label>
                    <input
                      type="text"
                      value={settings.projectsLabel}
                      onChange={(e) => setSettings({ ...settings, projectsLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Single {settings.taskLabel} Label</label>
                    <input
                      type="text"
                      value={settings.taskLabel}
                      onChange={(e) => setSettings({ ...settings, taskLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Plural {settings.tasksLabel} Label</label>
                    <input
                      type="text"
                      value={settings.tasksLabel}
                      onChange={(e) => setSettings({ ...settings, tasksLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Accent Color</label>
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Google Drive Integration</h3>
                <p className="text-sm text-gray-400 mb-4">Configure Google Drive folder structure for projects and tasks</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Main Folder Name</label>
                    <input
                      type="text"
                      value={settings.pmHubFolderName}
                      onChange={(e) => setSettings({ ...settings, pmHubFolderName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="PM Hub"
                    />
                    <p className="text-xs text-gray-400 mt-1">Root folder for all project data</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Projects Folder Name</label>
                    <input
                      type="text"
                      value={settings.projectsFolderName}
                      onChange={(e) => setSettings({ ...settings, projectsFolderName: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Projects"
                    />
                    <p className="text-xs text-gray-400 mt-1">Year suffix added automatically (e.g., Projects_2025)</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">
                      <div className="text-blue-300 font-medium mb-1">Folder Structure Preview</div>
                      <div className="text-blue-200/80 font-mono text-xs space-y-0.5">
                        <div>{settings.pmHubFolderName || 'PM Hub'}/</div>
                        <div className="ml-4">{settings.projectsFolderName || 'Projects'}_2025/</div>
                        <div className="ml-8">Project Name/</div>
                        <div className="ml-12">Tasks/</div>
                        <div className="ml-16">Task Name/</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Google Workspace Access Controls</h3>
                <p className="text-sm text-gray-400 mb-4">Control which Google Workspace services are accessible in the application</p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      <div>
                        <div className="text-white font-medium">Gmail</div>
                        <div className="text-gray-400 text-sm">Enable Gmail integration</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableGmail}
                        onChange={(e) => setSettings({ ...settings, enableGmail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableGmail: !settings.enableGmail });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M7.71 3.5L1.15 15l3.42 6h14.86l3.42-6-6.56-11.5H7.71zM8.5 10l3.5-6h3l3.5 6-3.5 6h-3l-3.5-6z"/>
                      </svg>
                      <div>
                        <div className="text-white font-medium">Google Drive</div>
                        <div className="text-gray-400 text-sm">Enable Drive file management</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableDrive}
                        onChange={(e) => setSettings({ ...settings, enableDrive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableDrive: !settings.enableDrive });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      <div>
                        <div className="text-white font-medium">Google Docs</div>
                        <div className="text-gray-400 text-sm">Enable Docs document editing</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableDocs}
                        onChange={(e) => setSettings({ ...settings, enableDocs: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableDocs: !settings.enableDocs });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M19,11H5V13H19V11M19,7H5V9H19V7M19,15H5V17H19V15Z"/>
                      </svg>
                      <div>
                        <div className="text-white font-medium">Google Sheets</div>
                        <div className="text-gray-400 text-sm">Enable Sheets spreadsheet editing</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableSheets}
                        onChange={(e) => setSettings({ ...settings, enableSheets: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableSheets: !settings.enableSheets });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-orange-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z"/>
                      </svg>
                      <div>
                        <div className="text-white font-medium">Google Slides</div>
                        <div className="text-gray-400 text-sm">Enable Slides presentation editing</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableSlides}
                        onChange={(e) => setSettings({ ...settings, enableSlides: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableSlides: !settings.enableSlides });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-500" />
                      <div>
                        <div className="text-white font-medium">Google Calendar</div>
                        <div className="text-gray-400 text-sm">Enable Calendar integration</div>
                      </div>
                    </div>
                    <div className="relative inline-block w-12 h-6">
                      <input
                        type="checkbox"
                        checked={settings.enableCalendar}
                        onChange={(e) => setSettings({ ...settings, enableCalendar: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors cursor-pointer" onClick={(e) => {
                        e.preventDefault();
                        setSettings({ ...settings, enableCalendar: !settings.enableCalendar });
                      }}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/20">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettings(false);
                  // Save settings to localStorage in production
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New {settings.projectLabel}</h2>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateProject({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  startDate: formData.get('startDate'),
                  endDate: formData.get('endDate'),
                  color: formData.get('color')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.projectLabel} Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Color</label>
                <input
                  type="color"
                  name="color"
                  defaultValue="#60a5fa"
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Create {settings.projectLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New {settings.taskLabel}</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedTeams = Array.from(formData.getAll('assignedTeams'));
                handleCreateTask({
                  projectId: formData.get('projectId'),
                  title: formData.get('title'),
                  description: formData.get('description'),
                  status: 'todo',
                  priority: formData.get('priority'),
                  assignees: [formData.get('assignee')],
                  assignedTeams: selectedTeams,
                  dueDate: formData.get('dueDate'),
                  estimatedHours: parseInt(formData.get('estimatedHours')),
                  createCalendarEvent: formData.get('createCalendarEvent') === 'on'
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.projectLabel}</label>
                <select
                  name="projectId"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.taskLabel} Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Priority</label>
                  <select
                    name="priority"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Assignee</label>
                  <select
                    name="assignee"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select assignee</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Assign Teams (optional)</label>
                <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3 space-y-2">
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        name="assignedTeams"
                        value={team.id}
                        className="w-4 h-4 rounded border-gray-600 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: team.color + '40' }}>
                        <Users className="w-4 h-4" style={{ color: team.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{team.name}</div>
                        <div className="text-gray-400 text-xs">{team.members.length} members</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">All team members will be invited to the calendar event</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/20 rounded-lg">
                <input
                  type="checkbox"
                  name="createCalendarEvent"
                  id="createCalendarEvent"
                  defaultChecked={true}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="createCalendarEvent" className="text-sm text-gray-300 cursor-pointer">
                  Create Google Calendar Event
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Create {settings.taskLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New Team</h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedMembers = Array.from(formData.getAll('members'));
                handleCreateTeam({
                  name: formData.get('name'),
                  color: formData.get('color'),
                  members: selectedMembers
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Color</label>
                <input
                  type="color"
                  name="color"
                  defaultValue="#60a5fa"
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Add Members (optional)</label>
                <div className="max-h-48 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3 space-y-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        name="members"
                        value={user.id}
                        className="w-4 h-4 rounded border-gray-600 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                        {user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{user.name}</div>
                        <div className="text-gray-400 text-xs">{user.role}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddMember({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  role: formData.get('role'),
                  avatar: formData.get('avatar')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter member name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="member@company.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Role <span className="text-red-400">*</span></label>
                <select
                  name="role"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="Member">Member</option>
                  <option value="Lead">Lead</option>
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Avatar URL (optional)</label>
                <input
                  type="text"
                  name="avatar"
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg or leave blank for initials"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate initials from name</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && editingTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Team</h2>
              <button
                onClick={() => {
                  setShowEditTeamModal(false);
                  setEditingTeam(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedMembers = Array.from(formData.getAll('members'));
                handleUpdateTeam({
                  name: formData.get('name'),
                  color: formData.get('color'),
                  members: selectedMembers
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingTeam.name}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Color</label>
                <input
                  type="color"
                  name="color"
                  defaultValue={editingTeam.color}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Members</label>
                <div className="max-h-48 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3 space-y-2">
                  {users.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        name="members"
                        value={user.id}
                        defaultChecked={editingTeam.members.includes(user.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                        {user.avatar?.startsWith('http') ? (
                          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          user.avatar || user.name?.charAt(0) || '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{user.name}</div>
                        <div className="text-gray-400 text-xs">{user.role}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTeamModal(false);
                    setEditingTeam(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Member</h2>
              <button
                onClick={() => {
                  setShowEditMemberModal(false);
                  setEditingMember(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateMember({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  role: formData.get('role'),
                  avatar: formData.get('avatar')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingMember.name}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter member name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Email <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editingMember.email}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="member@company.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Role <span className="text-red-400">*</span></label>
                <select
                  name="role"
                  required
                  defaultValue={editingMember.role}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="Member">Member</option>
                  <option value="Lead">Lead</option>
                  <option value="Admin">Admin</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Avatar URL (optional)</label>
                <input
                  type="text"
                  name="avatar"
                  defaultValue={editingMember.avatar?.startsWith('http') ? editingMember.avatar : ''}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg or leave blank for initials"
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate initials from name</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit {settings.projectLabel}</h2>
              <button
                onClick={() => {
                  setShowEditProjectModal(false);
                  setEditingProject(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleUpdateProject({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  startDate: formData.get('startDate'),
                  endDate: formData.get('endDate'),
                  color: formData.get('color'),
                  status: formData.get('status')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.projectLabel} Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingProject.name}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={editingProject.description}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={editingProject.startDate}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    defaultValue={editingProject.endDate}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingProject.status}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Color</label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingProject.color}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit {settings.taskLabel}</h2>
              <button
                onClick={() => {
                  setShowEditTaskModal(false);
                  setEditingTask(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const selectedTeams = Array.from(formData.getAll('assignedTeams'));
                handleUpdateTask({
                  projectId: formData.get('projectId'),
                  title: formData.get('title'),
                  description: formData.get('description'),
                  status: formData.get('status'),
                  priority: formData.get('priority'),
                  assignees: [formData.get('assignee')],
                  assignedTeams: selectedTeams,
                  dueDate: formData.get('dueDate'),
                  estimatedHours: parseInt(formData.get('estimatedHours'))
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.projectLabel}</label>
                <select
                  name="projectId"
                  required
                  defaultValue={editingTask.projectId}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">{settings.taskLabel} Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingTask.title}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  defaultValue={editingTask.description}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Status</label>
                  <select
                    name="status"
                    required
                    defaultValue={editingTask.status}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Priority</label>
                  <select
                    name="priority"
                    required
                    defaultValue={editingTask.priority}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Assignee</label>
                <select
                  name="assignee"
                  required
                  defaultValue={editingTask.assignees?.[0] || ''}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Assign Teams (optional)</label>
                <div className="max-h-40 overflow-y-auto bg-white/5 border border-white/20 rounded-lg p-3 space-y-2">
                  {teams.map(team => (
                    <label key={team.id} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        name="assignedTeams"
                        value={team.id}
                        defaultChecked={editingTask.assignedTeams?.includes(team.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-white/10 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: team.color + '40' }}>
                        <Users className="w-4 h-4" style={{ color: team.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{team.name}</div>
                        <div className="text-gray-400 text-xs">{team.members.length} members</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">All team members will be invited to the calendar event</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    defaultValue={editingTask.dueDate}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    required
                    min="1"
                    defaultValue={editingTask.estimatedHours}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditTaskModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Workspace Modal */}
      {showGoogleWorkspace && (
        <GoogleWorkspace onClose={() => setShowGoogleWorkspace(false)} />
      )}
    </div>
  );
};

export default ProjectManager;