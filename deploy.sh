#!/bin/bash

# 🚀 Quick Deployment Script for Video Proctoring System

echo "🎯 Video Proctoring System - Deployment Helper"
echo "=============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual MongoDB URI"
fi

# Add all files to git
echo "📁 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Prepare for deployment - $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo ""
echo "🌐 Choose your deployment platform:"
echo "1. Railway (Recommended - Easy setup)"
echo "2. Render (Good alternative)"
echo "3. Heroku (Classic option)"
echo "4. Manual setup instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚂 Railway Deployment Steps:"
        echo "1. Go to https://railway.app"
        echo "2. Sign up/login with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select this repository"
        echo "5. Add MongoDB database from Railway dashboard"
        echo "6. Update MONGODB_URI environment variable"
        echo ""
        echo "📋 Your project is ready for Railway deployment!"
        ;;
    2)
        echo ""
        echo "🎨 Render Deployment Steps:"
        echo "1. Go to https://render.com"
        echo "2. Connect your GitHub repository"
        echo "3. Create new Web Service"
        echo "4. Use these settings:"
        echo "   - Build Command: npm install"
        echo "   - Start Command: npm start"
        echo "   - Environment: Node"
        echo ""
        echo "📋 Your project is ready for Render deployment!"
        ;;
    3)
        echo ""
        echo "🟣 Heroku Deployment Steps:"
        echo "1. Install Heroku CLI: brew install heroku/brew/heroku"
        echo "2. Run: heroku login"
        echo "3. Run: heroku create your-app-name"
        echo "4. Run: heroku addons:create mongolab:sandbox"
        echo "5. Run: git push heroku main"
        echo ""
        echo "📋 Your project is ready for Heroku deployment!"
        ;;
    4)
        echo ""
        echo "📖 Manual Setup:"
        echo "Check the DEPLOYMENT_GUIDE.md file for detailed instructions"
        echo "All configuration files have been created for you!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment preparation complete!"
echo "📚 Check DEPLOYMENT_GUIDE.md for detailed instructions"
echo "🔧 Configuration files created:"
echo "   - railway.toml"
echo "   - render.yaml" 
echo "   - Procfile"
echo "   - .env.example"
echo ""
echo "🌟 Good luck with your deployment!"