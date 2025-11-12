# Railway Setup Checklist

## ✅ What You Need to Do in Railway:

### 1. Add PostgreSQL Database (if not already done)
- [ ] In your Railway project, click "+ New"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for it to provision (~30 seconds)
- [ ] `DATABASE_URL` will be automatically added to your environment variables

### 2. Set Environment Variables

Go to your Railway service → Variables tab, and add these:

**Required Variables:**
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://sean4e.github.io/PMHub2
JWT_SECRET=<generate-a-random-32-char-string>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://<your-railway-url>.railway.app/api/auth/google/callback
```

**Generate JWT_SECRET:**
- Go to: https://randomkeygen.com/
- Copy a "CodeIgniter Encryption Key" (256-bit)
- Or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Get Google Credentials:**
- Go to: https://console.cloud.google.com/apis/credentials
- Copy your Client ID and Client Secret

### 3. Deploy
- [ ] Click "Deploy" in Railway (or it deploys automatically)
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check logs for any errors
- [ ] Copy your Railway URL (e.g., `https://pmhub2-production-xxxx.up.railway.app`)

### 4. After Deployment - Tell Me Your Railway URL!

Once deployed, give me your Railway backend URL so I can:
- Update the frontend to connect to it
- Update GitHub secrets
- Configure Google OAuth redirect URIs

---

## 🔍 How to Find Your Railway URL:

1. Go to your Railway project
2. Click on your backend service
3. Go to "Settings" tab
4. Look for "Domains" section
5. You'll see a URL like: `pmhub2-production-xxxx.up.railway.app`
6. Copy the full URL with `https://`

