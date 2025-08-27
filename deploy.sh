#!/bin/bash

# 🚀 Art Gallery Deployment Script
# This script helps prepare your app for deployment

echo "🎨 Art Gallery Deployment Preparation"
echo "====================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check if all files are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes!"
    echo "Please commit all changes before deploying:"
    echo "git add . && git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Git repository is ready"

# Check if package.json has start script
if ! grep -q '"start"' package.json; then
    echo "❌ package.json missing start script!"
    echo "Please add: \"start\": \"node server.js\" to your scripts"
    exit 1
fi

echo "✅ package.json is configured"

# Check if environment variables are set up
if [ ! -f "config.prod.env" ]; then
    echo "⚠️  Production config not found!"
    echo "Please create config.prod.env with your production settings"
fi

echo "✅ Basic checks completed"

echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create a free cluster"
echo "   - Get your connection string"
echo ""
echo "3. Set up Cloudinary:"
echo "   - Go to https://cloudinary.com/"
echo "   - Create a free account"
echo "   - Get your credentials"
echo ""
echo "4. Deploy on Render:"
echo "   - Go to https://render.com/"
echo "   - Connect your GitHub repo"
echo "   - Set environment variables"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Good luck with your deployment!"
