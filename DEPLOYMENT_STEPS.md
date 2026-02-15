# 🚀 GitHub + Vercel Deployment Steps

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `youtube-feels-meter`
3. Description: `Music mood analysis with MusicBrainz + Genre-based AI`
4. **Keep it Public** (or Private if you prefer)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Push to GitHub

GitHub will show you commands. Use these instead:

```bash
cd /home/agent/projects/youtube-meter

# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/youtube-feels-meter.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select `youtube-feels-meter` from your repositories
4. **IMPORTANT**: Click "Edit" next to Root Directory
   - Set Root Directory to: `backend`
5. Click "Deploy"

## Step 4: Add Environment Variable

Once deployment completes:

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Add variable:
   - **Name**: `YOUTUBE_API_KEY`
   - **Value**: `AIzaSyCoV6Z_oA6c4Kj_6w6DiFinubRtJ-JXZ5c`
   - **Environments**: Check all (Production, Preview, Development)
4. Click "Save"

## Step 5: Redeploy

1. Go to "Deployments" tab
2. Click the "..." menu on the latest deployment
3. Click "Redeploy"
4. Wait ~30 seconds

## Step 6: Test Your API

Your API will be at: `https://youtube-feels-meter-backend.vercel.app` (or similar)

```bash
# Test health
curl https://your-deployment-url.vercel.app/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-02-15T...",
  "uptime": 12.34
}
```

## ✅ Done!

From now on:
- **Every push to main** = automatic deployment
- **Pull requests** = preview deployments
- **100% free** on Vercel's hobby plan

## What's Deployed

✅ MusicBrainz + Genre Analysis (100% free)
✅ 60+ genre profiles for accurate mood detection
✅ 189 passing tests
✅ YouTube playlist analysis
✅ Feels score calculation (0-100)

---

**Ready?** Follow Step 1 above to create your GitHub repo!
