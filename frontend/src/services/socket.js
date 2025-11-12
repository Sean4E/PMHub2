import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // Project events
  joinProject(projectId) {
    this.socket?.emit('project:join', projectId);
  }

  leaveProject(projectId) {
    this.socket?.emit('project:leave', projectId);
  }

  updateProject(projectId, project) {
    this.socket?.emit('project:update', { projectId, project });
  }

  onProjectUpdated(callback) {
    this.socket?.on('project:updated', callback);
    this.listeners.set('project:updated', callback);
  }

  // Task events
  createTask(projectId, task) {
    this.socket?.emit('task:create', { projectId, task });
  }

  updateTask(projectId, task) {
    this.socket?.emit('task:update', { projectId, task });
  }

  deleteTask(projectId, taskId) {
    this.socket?.emit('task:delete', { projectId, taskId });
  }

  onTaskCreated(callback) {
    this.socket?.on('task:created', callback);
    this.listeners.set('task:created', callback);
  }

  onTaskUpdated(callback) {
    this.socket?.on('task:updated', callback);
    this.listeners.set('task:updated', callback);
  }

  onTaskDeleted(callback) {
    this.socket?.on('task:deleted', callback);
    this.listeners.set('task:deleted', callback);
  }

  // Comment events
  addComment(projectId, taskId, comment) {
    this.socket?.emit('comment:add', { projectId, taskId, comment });
  }

  typingComment(projectId, taskId) {
    this.socket?.emit('comment:typing', { projectId, taskId });
  }

  onCommentAdded(callback) {
    this.socket?.on('comment:added', callback);
    this.listeners.set('comment:added', callback);
  }

  onUserTyping(callback) {
    this.socket?.on('comment:user-typing', callback);
    this.listeners.set('comment:user-typing', callback);
  }

  // User presence
  viewingTask(projectId, taskId) {
    this.socket?.emit('task:viewing', { projectId, taskId });
  }

  onUserViewing(callback) {
    this.socket?.on('task:user-viewing', callback);
    this.listeners.set('task:user-viewing', callback);
  }

  onUserOnline(callback) {
    this.socket?.on('user:online', callback);
    this.listeners.set('user:online', callback);
  }

  onUserOffline(callback) {
    this.socket?.on('user:offline', callback);
    this.listeners.set('user:offline', callback);
  }

  onUserJoinedProject(callback) {
    this.socket?.on('user:joined-project', callback);
    this.listeners.set('user:joined-project', callback);
  }

  // Remove listeners
  removeAllListeners() {
    this.listeners.forEach((callback, event) => {
      this.socket?.off(event, callback);
    });
    this.listeners.clear();
  }
}

export default new SocketService();
