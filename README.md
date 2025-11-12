# PM Hub v2 - Project Management Application

A modern, full-stack project management application with beautiful glassmorphism UI, real-time collaboration, and powerful integrations.

## ✨ Features

### Core Features
- 🎯 **Project Management** - Create, track, and manage multiple projects
- ✅ **Task Management** - Kanban board, Gantt chart, and list views
- 👥 **Team Collaboration** - Team management and role-based access
- 📊 **Analytics & Insights** - Six Sigma metrics and performance tracking
- 🔔 **Real-time Updates** - WebSocket-powered live collaboration
- 🔐 **Secure Authentication** - JWT + OAuth2 (Google)

### Integrations
- 📁 **Google Drive** - Auto-create project folders and file storage
- 📅 **Google Calendar** - Automatic event creation for tasks
- 📧 **Email Notifications** - Task assignments and deadline reminders
- 📎 **File Attachments** - Upload and manage task files

### UI/UX
- 🎨 **Beautiful Glassmorphism Design** - Modern, clean interface
- 🌙 **Dark Theme** - Easy on the eyes
- 📱 **Responsive** - Works on all devices
- ⚡ **Fast & Intuitive** - Optimized user experience
- 🎭 **Custom Dropdowns** - Enhanced select inputs

## 🚀 Tech Stack

### Backend
- **Node.js** & **Express** - Server framework
- **PostgreSQL** - Relational database
- **Sequelize** - ORM
- **Socket.IO** - Real-time communication
- **Passport.js** - Authentication
- **JWT** - Secure tokens
- **Nodemailer** - Email service
- **Multer** - File uploads
- **Google APIs** - Drive & Calendar integration

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time events
- **React Router** - Navigation
- **React Toastify** - Notifications
- **Lucide React** - Icons

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **PostgreSQL** 12+
- **Google Cloud Console** account (for OAuth and APIs)
- **Gmail account** (for email notifications)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PM_Hub_v2
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configurations:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pm_hub
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@pmhub.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Database Setup

Create PostgreSQL database:

```bash
createdb pm_hub
```

Or using psql:

```sql
CREATE DATABASE pm_hub;
```

The application will automatically create tables on first run in development mode.

## 🔑 Google APIs Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Calendar API
   - Google+ API

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret** to your `.env` files

### 3. Get Gmail App Password

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Generate new app password
4. Copy the password to `SMTP_PASSWORD` in backend `.env`

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
PM_Hub_v2/
├── backend/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   └── passport.js          # Passport OAuth config
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── projectController.js # Project CRUD
│   │   ├── taskController.js    # Task CRUD
│   │   └── uploadController.js  # File upload logic
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── upload.js            # Multer configuration
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Project.js           # Project model
│   │   ├── Task.js              # Task model
│   │   ├── Team.js              # Team model
│   │   └── index.js             # Model associations
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── projects.js          # Project routes
│   │   └── tasks.js             # Task routes
│   ├── services/
│   │   ├── googleDrive.js       # Google Drive service
│   │   ├── googleCalendar.js    # Google Calendar service
│   │   └── emailService.js      # Email service
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProjectManager.jsx # Main component
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── services/
│   │   │   ├── api.js             # API client
│   │   │   └── socket.js          # Socket service
│   │   ├── App.jsx                # Root component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/projects/:projectId/tasks` - Get project tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/projects/:projectId/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assignees` - Add assignee
- `DELETE /api/tasks/:id/assignees/:userId` - Remove assignee
- `POST /api/tasks/:id/comments` - Add comment
- `DELETE /api/tasks/comments/:id` - Delete comment
- `POST /api/tasks/:taskId/attachments` - Upload file
- `GET /api/tasks/attachments/:id/download` - Download file
- `DELETE /api/tasks/attachments/:id` - Delete attachment

## 🔄 Real-time Events (WebSocket)

### Client → Server
- `project:join` - Join project room
- `project:leave` - Leave project room
- `project:update` - Update project
- `task:create` - Create task
- `task:update` - Update task
- `task:delete` - Delete task
- `comment:add` - Add comment
- `comment:typing` - User is typing
- `task:viewing` - User viewing task

### Server → Client
- `user:online` - User came online
- `user:offline` - User went offline
- `user:joined-project` - User joined project
- `project:updated` - Project was updated
- `task:created` - Task was created
- `task:updated` - Task was updated
- `task:deleted` - Task was deleted
- `comment:added` - Comment was added
- `comment:user-typing` - User is typing
- `task:user-viewing` - User viewing task

## 🎨 UI Components

- **Glassmorphism Cards** - Modern frosted glass effect
- **Animated Transitions** - Smooth fade-in, slide-in, scale-in
- **Custom Dropdowns** - Styled select inputs
- **Loading States** - Beautiful spinners
- **Toast Notifications** - Real-time feedback
- **Modal Dialogs** - Overlay forms
- **Badge Components** - Status and priority indicators
- **Progress Bars** - Visual progress tracking

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet.js security headers
- CORS protection
- SQL injection prevention (Sequelize ORM)
- XSS protection
- File upload validation
- OAuth2 secure flow

## 📊 Analytics & Metrics

- **Completion Rate** - Percentage of completed tasks
- **On-Time Rate** - Tasks completed by due date
- **Estimation Accuracy** - Within 20% of estimated hours
- **Cycle Time Efficiency** - Average task completion time
- **Process Capability** - Six Sigma metrics
- **Value Stream Flow** - Task flow efficiency

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres -d pm_hub
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### Google OAuth Not Working
- Verify redirect URIs in Google Console match exactly
- Check client ID and secret are correct
- Ensure APIs are enabled in Google Console

### Email Notifications Failing
- Use Gmail app-specific password, not regular password
- Enable "Less secure app access" if needed
- Check SMTP credentials

## 📝 Development Tips

### Hot Reload
- Backend uses `nodemon` for auto-restart
- Frontend uses Vite's HMR

### Database Reset
```bash
# Drop and recreate database
dropdb pm_hub
createdb pm_hub
npm run dev  # Tables will be recreated
```

### View Logs
```bash
# Backend logs are printed to console
# Check terminal running backend server
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Tailwind CSS for the styling framework
- Lucide React for beautiful icons
- Socket.IO for real-time capabilities
- Google for OAuth and API services

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API responses for error messages

---

**Built with ❤️ using modern web technologies**
