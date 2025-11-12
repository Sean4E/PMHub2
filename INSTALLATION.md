# 📦 Complete Installation Guide

## Prerequisites Checklist

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] PostgreSQL 12+ installed (`psql --version`)
- [ ] Git installed (optional, `git --version`)

---

## Installation Steps

### 1. Install Node.js Packages

```bash
# Install backend dependencies
cd backend
npm install

# Expected packages installed:
# - express, pg, sequelize, bcryptjs, jsonwebtoken
# - passport, cors, dotenv, helmet, morgan
# - socket.io, googleapis, nodemailer, multer
# - and more...

# Install frontend dependencies
cd ../frontend
npm install

# Expected packages installed:
# - react, react-dom, axios, socket.io-client
# - react-router-dom, lucide-react, tailwindcss
# - vite, @vitejs/plugin-react
# - and more...
```

### 2. Set Up PostgreSQL Database

#### Option A: Using createdb command
```bash
createdb pm_hub
```

#### Option B: Using psql
```bash
psql -U postgres
```
```sql
CREATE DATABASE pm_hub;
\q
```

#### Option C: Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Click "Create" → "Database"
4. Name: `pm_hub`
5. Click "Save"

### 3. Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# === REQUIRED CONFIGURATION ===

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (UPDATE THESE!)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pm_hub
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_AT_LEAST_32_CHARACTERS_LONG
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Frontend URL
FRONTEND_URL=http://localhost:5173


# === OPTIONAL CONFIGURATION ===

# Google OAuth (for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Google APIs (for Drive & Calendar)
GOOGLE_DRIVE_API_KEY=your_drive_api_key
GOOGLE_CALENDAR_API_KEY=your_calendar_api_key

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@pmhub.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Google Client ID (optional, for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Generate JWT Secret

You need a strong, random secret key for JWT. Use one of these methods:

#### Option A: Node.js (recommended)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Option B: OpenSSL
```bash
openssl rand -hex 32
```

#### Option C: Online Generator
Visit: https://www.grc.com/passwords.htm (use "63 random alpha-numeric characters")

Copy the generated key to `JWT_SECRET` in `backend/.env`

### 5. Set Up Google OAuth (Optional but Recommended)

#### Step 1: Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: `PM Hub` (or your choice)
4. Click "Create"

#### Step 2: Enable APIs

1. Go to: "APIs & Services" → "Library"
2. Search and enable:
   - **Google Drive API**
   - **Google Calendar API**
   - **Google+ API**

#### Step 3: Configure OAuth Consent Screen

1. Go to: "APIs & Services" → "OAuth consent screen"
2. User Type: **External**
3. Fill in:
   - App name: `PM Hub`
   - User support email: your email
   - Developer contact: your email
4. Scopes: Add these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `drive.file`
   - `calendar`
5. Save and continue

#### Step 4: Create OAuth Credentials

1. Go to: "APIs & Services" → "Credentials"
2. Click: "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `PM Hub Web Client`
5. Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:5173/auth/callback` (for frontend)
6. Click "Create"
7. Copy **Client ID** and **Client Secret**

#### Step 5: Add Credentials to Environment

Add to `backend/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Add to `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

### 6. Set Up Gmail for Email Notifications (Optional)

#### Step 1: Enable 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Click "Get Started" and follow instructions

#### Step 2: Generate App Password

1. After enabling 2-Step Verification
2. Go to: https://myaccount.google.com/apppasswords
3. Select app: "Mail"
4. Select device: "Other" (enter "PM Hub")
5. Click "Generate"
6. Copy the 16-character password

#### Step 3: Add to Environment

Add to `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=the_16_character_password_from_google
EMAIL_FROM=noreply@pmhub.com
```

### 7. Initialize Database

The application will automatically create database tables on first run.

To manually verify database connection:

```bash
cd backend
node -e "require('dotenv').config(); const {sequelize} = require('./config/database'); sequelize.authenticate().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e))"
```

---

## Running the Application

### Development Mode (Recommended)

Open **two separate terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connection established successfully.
✅ Database models synchronized.

╔════════════════════════════════════════════════╗
║        🚀 PM Hub Server Running!              ║
║        Port: 5000                             ║
║        Environment: development               ║
╚════════════════════════════════════════════════╝
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Start Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Serve Frontend:**
```bash
cd frontend
npm run preview
```

---

## Verification Checklist

After installation, verify everything works:

- [ ] Backend server starts without errors
- [ ] Frontend loads in browser
- [ ] Can create an account (email/password)
- [ ] Can log in successfully
- [ ] Dashboard loads with projects
- [ ] Can create a new project
- [ ] Can create a new task
- [ ] Kanban board shows tasks
- [ ] Real-time updates work (open 2 browser tabs)
- [ ] Google Sign-In works (if configured)
- [ ] File upload works
- [ ] Email notifications sent (if configured)

---

## Common Installation Issues

### Issue: "Cannot connect to database"

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   pg_ctl status

   # Linux/Mac
   sudo service postgresql status
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -c "\l" | grep pm_hub
   ```

3. Test connection manually:
   ```bash
   psql -U postgres -d pm_hub
   ```

4. Check DB credentials in `backend/.env`

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process
netstat -ano | findstr :5000    # Windows
lsof -i :5000                   # Linux/Mac

# Kill process
npx kill-port 5000
```

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Google OAuth redirect error"

**Solution:**
1. Verify redirect URI in Google Console exactly matches:
   `http://localhost:5000/api/auth/google/callback`
2. Check GOOGLE_CALLBACK_URL in backend .env
3. Ensure FRONTEND_URL is correct in backend .env

### Issue: "Email notifications not sending"

**Solution:**
1. Use Gmail App Password (not regular password)
2. Verify 2-Step Verification is enabled
3. Check SMTP_USER and SMTP_PASSWORD in .env
4. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```

### Issue: "Frontend shows API connection error"

**Solution:**
1. Verify backend is running on port 5000
2. Check VITE_API_URL in frontend .env
3. Check browser console for CORS errors
4. Verify FRONTEND_URL in backend .env

---

## Next Steps

After successful installation:

1. **Read the README:** Full documentation in [README.md](./README.md)
2. **Follow Quick Start:** Try [QUICKSTART.md](./QUICKSTART.md)
3. **Explore Features:** Create projects, tasks, and teams
4. **Customize:** Modify colors, labels, and settings
5. **Deploy:** Check deployment guides for production

---

## Getting Help

- **Documentation:** [README.md](./README.md)
- **Quick Start:** [QUICKSTART.md](./QUICKSTART.md)
- **API Reference:** [README.md#-api-endpoints](./README.md#-api-endpoints)
- **GitHub Issues:** Open an issue for bugs or questions

---

**Installation complete! 🎉 Start building amazing projects with PM Hub!**
