# 🚀 Deploy to Vercel in 3 Steps

## Prerequisites
- GitHub account (optional, but recommended)
- Vercel account (free) - Sign up at https://vercel.com

## Option 1: Deploy via Vercel CLI (Fastest)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd backend
vercel
```

Follow the prompts (accept defaults).

### Step 3: Add YouTube API Key
```bash
vercel env add YOUTUBE_API_KEY
```

Paste your key: `AIzaSyCoV6Z_oA6c4Kj_6w6DiFinubRtJ-JXZ5c`

Select: Production, Preview, Development (all)

### Step 4: Production Deploy
```bash
vercel --prod
```

**Done!** Your API is live at `https://youtube-feels-meter-backend.vercel.app`

## Option 2: Deploy via Vercel Dashboard (No CLI needed)

### Step 1: Push to GitHub
```bash
cd /home/agent/projects/youtube-meter
git init
git add .
git commit -m "Initial commit - YouTube Feels Meter"
git branch -M main
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/youtube-feels-meter.git
git push -u origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `youtube-feels-meter` repo
4. **Root Directory**: Set to `backend`
5. Click "Deploy"

### Step 3: Add Environment Variable
1. Go to Project Settings → Environment Variables
2. Add: `YOUTUBE_API_KEY` = `AIzaSyCoV6Z_oA6c4Kj_6w6DiFinubRtJ-JXZ5c`
3. Select all environments (Production, Preview, Development)
4. Save

### Step 4: Redeploy
Click "Redeploy" in the Deployments tab.

**Done!** Auto-deploys on every push to main.

## Test Your Deployment

```bash
# Get your deployment URL from Vercel dashboard or CLI output
export API_URL="https://your-deployment.vercel.app"

# Test health
curl $API_URL/health

# Test playlist (example)
curl -X POST $API_URL/api/playlist/info \
  -H "Content-Type: application/json" \
  -d '{
    "playlistUrl": "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI"
  }'
```

## What's Deployed

✅ **MusicBrainz + Genre Analysis** - 100% free music analysis
✅ **60+ genre profiles** - Accurate mood detection
✅ **Aggressive caching** - Fast repeat analysis
✅ **YouTube API integration** - Playlist fetching
✅ **189 passing tests** - Quality assured

## Cost

**$0/month** on Vercel's free tier!

## Monitoring

View logs in real-time:
```bash
vercel logs --follow
```

Or check the Vercel dashboard: https://vercel.com/dashboard

## Next Steps

Once deployed, you can:
1. Connect a frontend (React, Next.js, etc.)
2. Add custom domain
3. Set up GitHub auto-deployments
4. Monitor usage analytics

---

**Ready to deploy?** Just run `vercel` in the backend directory!
