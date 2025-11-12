# PM Hub v2 - Deployment Guide

Complete guide to deploy PM Hub v2 with free hosting (GitHub Pages + Railway).

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app using GitHub)
- Google Cloud Console project with OAuth credentials

## Part 1: Deploy Backend to Railway (5 minutes)

### Step 1: Create Railway Project

1. Go to https://railway.app and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Select your `PMHub2` repository
5. Railway will automatically detect the configuration

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a database and set `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables

In Railway project settings, add these environment variables:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://sean4e.github.io/PMHub2
JWT_SECRET=your-random-secret-key-here-make-it-long-and-random
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-url.railway.app/api/auth/google/callback
```

**Important:** 
- `JWT_SECRET`: Generate a random string (at least 32 characters)
- Copy your backend URL from Railway (looks like: `https://pmhub2-production.up.railway.app`)

### Step 4: Deploy

1. Railway automatically deploys when you push to GitHub
2. Wait for deployment to complete (~2-3 minutes)
3. Copy your backend URL (e.g., `https://pmhub2-production.up.railway.app`)

---

## Part 2: Configure GitHub Pages (2 minutes)

### Step 1: Add GitHub Secret

1. Go to your GitHub repository: https://github.com/Sean4E/PMHub2
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `VITE_API_URL`
5. Value: `https://your-backend-url.railway.app/api` (use your actual Railway URL)
6. Click "Add secret"

### Step 2: Enable GitHub Pages

1. In repository settings, go to "Pages"
2. Under "Build and deployment":
   - Source: Select **"GitHub Actions"**
3. Click "Save"

### Step 3: Trigger Deployment

1. Go to "Actions" tab
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait for deployment (~1-2 minutes)

Your frontend will be available at: **https://sean4e.github.io/PMHub2/**

---

## Part 3: Configure Google OAuth (3 minutes)

### Step 1: Update Google Cloud Console

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID

### Step 2: Add Authorized URLs

**Authorized JavaScript origins:**
```
https://sean4e.github.io
https://your-backend-url.railway.app
```

**Authorized redirect URIs:**
```
https://sean4e.github.io/PMHub2/auth/callback
https://your-backend-url.railway.app/api/auth/google/callback
```

### Step 3: Save Changes

Click "Save" in Google Cloud Console

---

## Part 4: Verification (1 minute)

### Test Your Deployment

1. Visit: https://sean4e.github.io/PMHub2/
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You should see your PM Hub dashboard!

---

## Troubleshooting

### Backend Issues

**Check Railway Logs:**
1. Go to Railway project
2. Click on your service
3. Click "Deployments" → "View Logs"

**Common Issues:**
- `DATABASE_URL not found`: Make sure PostgreSQL is added to project
- `GOOGLE_CLIENT_ID not found`: Check environment variables are set correctly

### Frontend Issues

**Check GitHub Actions:**
1. Go to "Actions" tab in repository
2. Click on latest workflow run
3. Check for errors in build logs

**Common Issues:**
- `VITE_API_URL not defined`: Make sure you added the GitHub secret
- `401 Unauthorized`: Check Google OAuth redirect URIs are correct

### Google OAuth Issues

**Error: `redirect_uri_mismatch`**
- Verify redirect URIs in Google Cloud Console match exactly
- Make sure to include `/PMHub2/auth/callback` (with capital letters)

**Error: `Invalid client`**
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Railway
- Make sure credentials are from the correct Google Cloud project

---

## Costs

- **GitHub Pages**: Free (public repository)
- **Railway**: $5/month credit (free tier) - enough for this project
- **Total Cost**: $0 (stays within free limits)

---

## Updating Your App

### Update Code:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

**What happens:**
1. GitHub Actions automatically rebuilds and deploys frontend
2. Railway automatically rebuilds and deploys backend
3. Changes live in ~2-3 minutes

---

## Security Notes

✅ **Safe:**
- All secrets stored securely in Railway and GitHub
- HTTPS encryption on all connections
- Google OAuth for authentication
- PostgreSQL database with SSL

⚠️ **Remember:**
- Never commit `.env` files
- Keep your `JWT_SECRET` secure
- Regularly rotate Google OAuth credentials

---

## Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Check GitHub Actions logs for frontend errors
3. Verify all environment variables are set correctly
4. Ensure Google OAuth URLs are configured properly

