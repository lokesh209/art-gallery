# ⚡ Quick Deploy Guide

Want to get your Art Gallery online fast? Follow these steps:

## 🚀 Deploy in 10 Minutes (Render)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create cluster (free tier)
4. Get connection string

### Step 3: Set up Cloudinary
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create free account
3. Get credentials from dashboard

### Step 4: Deploy on Render
1. Go to [Render](https://render.com/)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repo
5. Set these environment variables:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/artgallery
JWT_SECRET=your-super-secure-jwt-secret-key-2024
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
AI_MODEL_URL=https://your-ai-model-url.com/verify
```

6. Click "Create Web Service"
7. Wait 5-10 minutes
8. Your app is live! 🎉

## 🔗 Your App URL
Your app will be available at: `https://your-app-name.onrender.com`

## 📱 Test Your App
- Register a new user
- Upload artwork
- Test bidding
- Test chat

## 💡 Pro Tips
- Update CORS origins in `server.js` with your actual domain
- Monitor logs in Render dashboard
- Set up custom domain later

## 🆘 Need Help?
- Check Render logs for errors
- Verify environment variables
- Test locally first

**That's it! Your Art Gallery is now live on the internet! 🌐**
