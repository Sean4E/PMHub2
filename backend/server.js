require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const passport = require('./config/passport');
const { connectDB } = require('./config/database');
const { verifyToken } = require('./utils/jwt');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize Passport
app.use(passport.initialize());

// Rate limiting - Very high limit for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10000, // Very high for development
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/users', require('./routes/users'));
app.use('/api/google', require('./routes/google'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PM Hub API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum file size is 10MB.'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// WebSocket connection handling
const connectedUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const { User } = require('./models');
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'avatar']
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

  // Store user connection
  connectedUsers.set(socket.user.id, {
    socketId: socket.id,
    user: socket.user
  });

  // Notify others that user is online
  socket.broadcast.emit('user:online', {
    userId: socket.user.id,
    user: socket.user
  });

  // Join project rooms
  socket.on('project:join', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`User ${socket.user.name} joined project ${projectId}`);

    // Notify others in the project
    socket.to(`project:${projectId}`).emit('user:joined-project', {
      userId: socket.user.id,
      user: socket.user,
      projectId
    });
  });

  // Leave project room
  socket.on('project:leave', (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`User ${socket.user.name} left project ${projectId}`);
  });

  // Task updates
  socket.on('task:update', (data) => {
    const { projectId, task } = data;
    socket.to(`project:${projectId}`).emit('task:updated', {
      task,
      updatedBy: socket.user
    });
  });

  // Task created
  socket.on('task:create', (data) => {
    const { projectId, task } = data;
    socket.to(`project:${projectId}`).emit('task:created', {
      task,
      createdBy: socket.user
    });
  });

  // Task deleted
  socket.on('task:delete', (data) => {
    const { projectId, taskId } = data;
    socket.to(`project:${projectId}`).emit('task:deleted', {
      taskId,
      deletedBy: socket.user
    });
  });

  // Project updates
  socket.on('project:update', (data) => {
    const { projectId, project } = data;
    socket.to(`project:${projectId}`).emit('project:updated', {
      project,
      updatedBy: socket.user
    });
  });

  // Comment added
  socket.on('comment:add', (data) => {
    const { projectId, taskId, comment } = data;
    socket.to(`project:${projectId}`).emit('comment:added', {
      taskId,
      comment,
      addedBy: socket.user
    });
  });

  // Typing indicator
  socket.on('comment:typing', (data) => {
    const { projectId, taskId } = data;
    socket.to(`project:${projectId}`).emit('comment:user-typing', {
      taskId,
      user: socket.user
    });
  });

  // User is viewing a task
  socket.on('task:viewing', (data) => {
    const { projectId, taskId } = data;
    socket.to(`project:${projectId}`).emit('task:user-viewing', {
      taskId,
      user: socket.user
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);

    // Remove from connected users
    connectedUsers.delete(socket.user.id);

    // Notify others that user is offline
    socket.broadcast.emit('user:offline', {
      userId: socket.user.id
    });
  });
});

// Make io accessible to controllers
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║        🚀 PM Hub Server Running!              ║
║                                                ║
║        Port: ${PORT}                               ║
║        Environment: ${process.env.NODE_ENV || 'development'}              ║
║        Database: PostgreSQL                    ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

