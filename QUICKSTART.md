# 🚀 Quick Start Guide

Get PM Hub v2 up and running in 5 minutes!

## Step 1: Install Dependencies (2 min)

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

## Step 2: Set Up Database (1 min)

```bash
# Create PostgreSQL database
createdb pm_hub
```

## Step 3: Configure Environment (1 min)

### Backend (.env)

```bash
cd backend
cp .env.example .env
```

**Minimum required configuration:**

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pm_hub
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=change_this_to_a_random_secret_key
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
cd ../frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Step 4: Run the Application (1 min)

Open **two terminal windows**:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Access the App

Open your browser and go to: **http://localhost:5173**

🎉 **Done!** You can now:
1. Create an account (email/password)
2. Create your first project
3. Add tasks to the project
4. View the Kanban board, Gantt chart, and analytics

---

## 🔧 Optional: Enable Google Integration

### Quick Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project**

3. **Enable APIs:**
   - Google Drive API
   - Google Calendar API
   - Google+ API

4. **Create OAuth credentials:**
   - Go to Credentials → Create Credentials → OAuth Client ID
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`

5. **Add to backend .env:**
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

6. **Add to frontend .env:**
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

7. **Restart both servers**

Now you can:
- Sign in with Google
- Auto-create Google Drive folders for projects
- Auto-create Google Calendar events for tasks

---

## 📧 Optional: Enable Email Notifications

### Gmail Setup

1. **Enable 2-Step Verification** in your Google Account

2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password

3. **Add to backend .env:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password
EMAIL_FROM=noreply@pmhub.com
```

4. **Restart backend server**

Now you'll receive:
- Task assignment notifications
- Deadline reminders
- Project invitation emails

---

## 🎯 Quick Test

1. **Create account** - Use email/password or Google
2. **Create project** - Click "New Project"
3. **Add task** - Click "New Task" in Kanban view
4. **Drag and drop** - Move tasks between columns
5. **View analytics** - Check the Analytics tab
6. **Open in another browser** - See real-time updates!

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify database exists: `psql -l | grep pm_hub`
- Check port 5000 is free: `npx kill-port 5000`

### Frontend won't start
- Check port 5173 is free: `npx kill-port 5173`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Database connection error
- Update DB_PASSWORD in backend .env
- Test connection: `psql -U postgres -d pm_hub`

### Can't create account
- Check backend console for errors
- Verify JWT_SECRET is set in .env

---

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the [API endpoints](./README.md#-api-endpoints)
- Learn about [real-time features](./README.md#-real-time-events-websocket)
- Customize the [UI colors and labels](./README.md#-ui-components)

---

**Need help?** Check the main README.md or open an issue on GitHub!
