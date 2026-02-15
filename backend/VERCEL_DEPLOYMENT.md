# Vercel Deployment Guide

## Quick Deploy

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Deploy from backend directory
```bash
cd backend
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your Vercel account
- **Link to existing project?** No (first time)
- **Project name?** youtube-feels-meter-backend
- **Directory?** ./ (current directory)
- **Override settings?** No

### 3. Set Environment Variables

After first deployment, add your YouTube API key:

```bash
vercel env add YOUTUBE_API_KEY
```

When prompted:
- **Value**: Paste your YouTube API key
- **Environment**: Production, Preview, Development (select all)

### 4. Redeploy
```bash
vercel --prod
```

## Environment Variables Needed

Only ONE environment variable required:

- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key

Optional (Vercel sets these automatically):
- `NODE_ENV` - Set to "production" by Vercel
- `PORT` - Managed by Vercel

## Project Structure for Vercel

```
backend/
├── api/
│   └── index.js          # Vercel entry point
├── src/
│   ├── app.js            # Express app (exported)
│   ├── server.js         # Local server (not used on Vercel)
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── utils/            # Utilities
├── vercel.json           # Vercel configuration
└── package.json
```

## Testing Your Deployment

Once deployed, Vercel will give you a URL like:
```
https://youtube-feels-meter-backend.vercel.app
```

Test endpoints:
```bash
# Health check
curl https://your-deployment.vercel.app/health

# Test playlist analysis (replace with real playlist ID)
curl -X POST https://your-deployment.vercel.app/api/playlist/info \
  -H "Content-Type: application/json" \
  -d '{"playlistUrl": "https://www.youtube.com/playlist?list=PLxxxxx"}'
```

## Vercel Dashboard

Access your deployment at: https://vercel.com/dashboard

From the dashboard you can:
- View deployment logs
- Set environment variables
- See analytics
- Configure custom domains
- Roll back deployments

## Free Tier Limits

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Custom domains

This is MORE than enough for a music analysis API!

## Production Checklist

- [x] `vercel.json` configured
- [x] `api/index.js` entry point created
- [x] Express app exported from `src/app.js`
- [ ] Deploy: `vercel`
- [ ] Add `YOUTUBE_API_KEY` environment variable
- [ ] Production deploy: `vercel --prod`
- [ ] Test health endpoint
- [ ] Test with real YouTube playlist

## Troubleshooting

### Function Timeout
If analysis takes too long:
- Vercel free tier: 10 second timeout
- Solution: Use caching (already implemented)
- Or: Upgrade to Pro for 60 second timeout

### Cold Starts
First request after inactivity may be slow (~2-3 seconds)
- This is normal for serverless
- Subsequent requests are fast

### Logs
View real-time logs:
```bash
vercel logs
```

Or check the Vercel dashboard

## Continuous Deployment

Link to GitHub for auto-deploy on push:

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Connect repository
4. Auto-deploys on every push to main!

## Cost

**100% FREE** on Vercel's Hobby plan for this project!

No credit card required.
