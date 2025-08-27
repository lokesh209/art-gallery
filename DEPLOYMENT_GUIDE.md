# 🚀 Art Gallery Deployment Guide

This guide will help you deploy your Art Gallery application online so people can use it!

## 📋 Prerequisites

Before deploying, you'll need to set up these services:

### 1. **MongoDB Atlas (Database)**
- Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a free account
- Create a new cluster
- Get your connection string

### 2. **Cloudinary (Image Storage)**
- Go to [Cloudinary](https://cloudinary.com/)
- Create a free account
- Get your cloud name, API key, and secret

### 3. **GitHub Repository**
- Push your code to GitHub
- Make sure all files are committed

## 🎯 Deployment Options

### Option 1: Render (Recommended - Free)

#### Step 1: Prepare Your Code
1. Make sure your `package.json` has a `start` script
2. Ensure all environment variables are properly configured

#### Step 2: Deploy on Render
1. Go to [Render](https://render.com/)
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: `art-gallery-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Step 3: Set Environment Variables
In Render dashboard, go to your service → Environment:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/artgallery
JWT_SECRET=your-super-secure-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
AI_MODEL_URL=https://your-ai-model-url.com/verify
```

#### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Your app will be available at: `https://your-app-name.onrender.com`

### Option 2: Railway (Alternative)

#### Step 1: Deploy on Railway
1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect it's a Node.js app

#### Step 2: Set Environment Variables
In Railway dashboard:
- Go to your project → Variables
- Add all the environment variables from above

#### Step 3: Deploy
- Railway will automatically deploy
- Get your URL from the dashboard

### Option 3: Vercel + Railway (Best Performance)

#### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Vercel will auto-deploy your static files

#### Backend (Railway)
1. Deploy backend on Railway (see Option 2)
2. Update frontend API URLs to point to Railway backend

## 🔧 Environment Variables Setup

### Required Variables:
```bash
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artgallery

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-2024
JWT_EXPIRE=7d

# Image Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Model
AI_MODEL_URL=https://your-ai-model-url.com/verify
AI_MODEL_API_KEY=your-ai-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🌐 Custom Domain (Optional)

### Render:
1. Go to your service → Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

### Railway:
1. Go to your project → Settings → Domains
2. Add custom domain
3. Update DNS records

## 🔍 Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Test image upload
- [ ] Test bidding system
- [ ] Test chat functionality
- [ ] Check mobile responsiveness
- [ ] Test AI verification (if applicable)

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check `package.json` has correct scripts
   - Ensure all dependencies are listed

2. **Database Connection Error**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in Atlas

3. **Image Upload Fails**
   - Verify Cloudinary credentials
   - Check file size limits

4. **CORS Errors**
   - Update CORS settings in `server.js`
   - Add your frontend domain to allowed origins

## 📊 Monitoring

### Render:
- Built-in logs and metrics
- Automatic restarts on crashes

### Railway:
- Real-time logs
- Performance monitoring

## 💰 Cost Estimation

### Free Tier (Recommended for starting):
- **Render**: Free (with limitations)
- **Railway**: $5/month after free tier
- **MongoDB Atlas**: Free (512MB)
- **Cloudinary**: Free (25GB storage)

### Paid Tier (For production):
- **Render**: $7/month
- **Railway**: $20/month
- **MongoDB Atlas**: $9/month
- **Cloudinary**: $89/month

## 🎉 Success!

Once deployed, your Art Gallery will be accessible to users worldwide!

**Next Steps:**
1. Share your app URL
2. Monitor usage and performance
3. Gather user feedback
4. Iterate and improve

---

**Need Help?** Check the platform's documentation or community forums for specific issues.
