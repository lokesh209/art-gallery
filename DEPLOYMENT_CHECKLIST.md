# 🚀 Deployment Checklist

## ✅ Completed Steps
- [x] **GitHub Repository**: https://github.com/lokesh209/art-gallery
- [x] **Cloudinary**: Configured and ready
- [x] **MongoDB Atlas**: Cluster created and configured
- [x] **Code**: All features implemented and tested

## 🔧 Final Configuration Needed
- [ ] **Update MongoDB Password**: Replace `YOUR_ACTUAL_PASSWORD` in `config.prod.env`
- [ ] **Generate JWT Secret**: Create a secure JWT secret for production

## 🎯 Ready for Deployment

### Your Environment Variables for Render:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://artgallery-user:YOUR_PASSWORD@artgallary.ky4kvkm.mongodb.net/artgallery?retryWrites=true&w=majority&appName=artgallary
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-2024
CLOUDINARY_CLOUD_NAME=dfhnah8jp
CLOUDINARY_API_KEY=163473831637852
CLOUDINARY_API_SECRET=5tH5pb2wI6JBJt4slGdN9v-UEX4
AI_MODEL_URL=https://your-ai-model-url.com/verify
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## 🚀 Deploy on Render

### Step 1: Go to Render
1. Visit: https://render.com/
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"

### Step 2: Connect Repository
1. Connect your GitHub account
2. Select: `lokesh209/art-gallery`
3. Click "Connect"

### Step 3: Configure Service
- **Name**: `art-gallery-app`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### Step 4: Set Environment Variables
Add all the variables from the list above in the Environment section.

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Your app will be live!

## 🎉 After Deployment
- [ ] Test user registration
- [ ] Test artwork upload
- [ ] Test bidding system
- [ ] Test chat functionality
- [ ] Share your app URL

## 🔗 Your App Will Be Live At:
`https://your-app-name.onrender.com`

## 📞 Need Help?
- Check Render logs for errors
- Verify environment variables
- Test locally first
