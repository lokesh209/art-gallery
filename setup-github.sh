#!/bin/bash

echo "🚀 Setting up GitHub Repository for Art Gallery"
echo "================================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo "✅ Git repository found"

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  No remote origin found"
    echo "Please create a repository on GitHub first:"
    echo "1. Go to https://github.com/lokesh209"
    echo "2. Click 'New' to create repository"
    echo "3. Name it 'art-gallery'"
    echo "4. Don't initialize with README"
    echo ""
    echo "Then run: git remote add origin https://github.com/lokesh209/art-gallery.git"
    exit 1
fi

echo "✅ Remote origin configured"

# Check if all changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes"
    echo "Committing changes..."
    git add .
    git commit -m "Update art gallery platform"
fi

echo "✅ All changes committed"

# Try to push
echo "📤 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Your repository is now live at:"
    echo "https://github.com/lokesh209/art-gallery"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up MongoDB Atlas"
    echo "2. Set up Cloudinary"
    echo "3. Deploy on Render"
    echo ""
    echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
else
    echo "❌ Failed to push to GitHub"
    echo "Please check:"
    echo "1. Repository exists on GitHub"
    echo "2. You have write access"
    echo "3. Your GitHub credentials are correct"
fi
