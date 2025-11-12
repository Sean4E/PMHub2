# PM Hub v2 - Vercel Deployment Guide

Complete guide to deploy PM Hub v2 with 100% free hosting (GitHub Pages + Vercel).

## Why Vercel?

✅ **100% Free Forever** (Hobby tier)
✅ **No Credit Card Required**
✅ **Serverless Backend** (auto-scaling)
✅ **PostgreSQL Database** (via Vercel Postgres - free tier)
✅ **Fast Global CDN**
✅ **Automatic HTTPS**

---

## Part 1: Deploy Backend to Vercel (5 minutes)

### Step 1: Sign Up for Vercel

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your repositories

### Step 2: Import Your Project

1. Click "Add New..." → "Project"
2. Find and select `PMHub2` repository
3. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Other
**Root Directory:** `./` (leave as default)
**Build Command:** Leave empty (not needed for API-only)
**Output Directory:** Leave empty
**Install Command:** `cd backend && npm install`

### Step 4: Add Environment Variables

Click "Environment Variables" and add these:

```
NODE_ENV=production
FRONTEND_URL=https://sean4e.github.io/PMHub2
JWT_SECRET=<your-random-32-char-string>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://your-project.vercel.app/api/auth/google/callback
POSTGRES_URL=<will-be-added-from-database>
```

**Generate JWT_SECRET:**
Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Add Vercel Postgres Database

1. In your Vercel project dashboard, go to "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Click "Create"
5. Vercel automatically adds `POSTGRES_URL` to your environment variables

### Step 6: Update GOOGLE_REDIRECT_URI

1. After deployment, copy your Vercel URL (e.g., `https://pmhub2.vercel.app`)
2. Go back to Environment Variables
3. Update `GOOGLE_REDIRECT_URI` to: `https://your-project.vercel.app/api/auth/google/callback`
4. Redeploy (Vercel will prompt you)

### Step 7: Deploy!

1. Click "Deploy"
2. Wait 1-2 minutes for build to complete
3. Copy your Vercel backend URL (e.g., `https://pmhub2.vercel.app`)

---

## Part 2: Configure GitHub Pages (2 minutes)

### Step 1: Add GitHub Secret

1. Go to: https://github.com/Sean4E/PMHub2/settings/secrets/actions
2. Click "New repository secret"
3. Name: `VITE_API_URL`
4. Value: `https://your-project.vercel.app/api` (use your actual Vercel URL)
5. Click "Add secret"

### Step 2: Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Select **"GitHub Actions"**
3. Click "Save"

### Step 3: Trigger Deployment

1. Go to "Actions" tab
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow" → "Run workflow"
4. Wait ~2 minutes

Your frontend will be at: **https://sean4e.github.io/PMHub2/**

---

## Part 3: Configure Google OAuth (3 minutes)

### Step 1: Update Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID

### Step 2: Add Authorized URLs

**Authorized JavaScript origins:**
```
https://sean4e.github.io
https://your-project.vercel.app
```

**Authorized redirect URIs:**
```
https://sean4e.github.io/PMHub2/auth/callback
https://your-project.vercel.app/api/auth/google/callback
```

### Step 3: Save Changes

Click "Save"

---

## Part 4: Verification

1. Visit: **https://sean4e.github.io/PMHub2/**
2. Click "Sign in with Google"
3. Complete OAuth
4. You're in! 🎉

---

## Key Differences from Railway

### Database Connection

Vercel Postgres uses a different connection string format. Your `database.js` already handles this automatically by checking for `DATABASE_URL` or `POSTGRES_URL`.

### Environment Variables in Vercel

- `POSTGRES_URL` - Auto-set by Vercel Postgres
- `POSTGRES_PRISMA_URL` - Auto-set (for Prisma, not used here)
- `POSTGRES_URL_NON_POOLING` - Auto-set

Just use `POSTGRES_URL` in your code (or keep `DATABASE_URL` which works the same).

---

## Updating Your App

```bash
git add .
git commit -m "Update message"
git push origin main
```

**What happens:**
1. GitHub Actions rebuilds frontend (~2 min)
2. Vercel auto-deploys backend (~1 min)
3. Changes live in ~2-3 minutes

---

## Costs & Limits (Hobby Tier)

✅ **$0/month forever**
✅ **100 GB bandwidth/month** (plenty for small projects)
✅ **100 GB-hours serverless functions**
✅ **60 GB-hours PostgreSQL** (256MB storage)
✅ **Unlimited projects**

---

## Troubleshooting

### "Database connection failed"

1. Check Vercel dashboard → Storage → Postgres
2. Make sure database is active
3. Verify `POSTGRES_URL` is in environment variables
4. Redeploy if needed

### "redirect_uri_mismatch"

- Verify Google Cloud Console URLs match exactly
- Must include `/PMHub2/auth/callback` (case-sensitive)

### "Function timeout"

- Free tier has 10s execution limit
- This should be plenty for your API calls
- If you hit limits, upgrade to Pro ($20/month per member)

---

## Why This Is Better Than Railway

1. ✅ **Truly free forever** (no $5/month limit)
2. ✅ **No credit card required**
3. ✅ **Faster deployments** (Vercel is optimized for this)
4. ✅ **Better monitoring** (built-in analytics)
5. ✅ **Global edge network** (faster for users worldwide)

---

## Support

Questions? Check:
- Vercel Docs: https://vercel.com/docs
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres

