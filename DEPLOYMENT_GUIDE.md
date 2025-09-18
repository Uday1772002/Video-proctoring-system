# 🚀 Deployment Guide - Video Proctoring System

## Option 1: Deploy to Railway (Recommended)

### Prerequisites
- GitHub account
- Railway account (free)

### Step 1: Prepare Your Project

1. **Create a `.env` file in your root directory:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video_proctoring
```

2. **Update your `package.json` scripts (if needed):**
```json
{
  "scripts": {
    "start": "node server/app.js",
    "build": "echo 'No build step required'"
  }
}
```

3. **Create a `railway.toml` file:**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "web"
source = "."

[[services]]
name = "database"
source = "."
```

### Step 2: Deploy to Railway

1. **Push to GitHub:**
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect it's a Node.js app

3. **Add MongoDB Database:**
   - In your Railway project dashboard
   - Click "New" → "Database" → "Add MongoDB"
   - Copy the connection string from the database service
   - Go to your web service → "Variables" tab
   - Add: `MONGODB_URI=<your-mongodb-connection-string>`

4. **Configure Environment Variables:**
```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-railway-mongodb-uri>
```

5. **Custom Domain (Optional):**
   - Go to "Settings" → "Domains"
   - Add your custom domain or use the provided railway.app subdomain

---

## Option 2: Deploy to Render

### Step 1: Prepare Project
1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: video-proctoring-system
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        fromDatabase:
          name: mongodb
          property: connectionString

databases:
  - name: mongodb
    plan: starter
```

### Step 2: Deploy
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create a new Web Service
4. Select your repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

---

## Option 3: Deploy to Heroku

### Step 1: Prepare Project
1. **Create `Procfile`:**
```
web: npm start
```

2. **Install Heroku CLI and deploy:**
```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS

# Login and create app
heroku login
heroku create your-proctoring-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

---

## Option 4: Deploy with Docker (Any Platform)

### Using Docker Compose (Local/VPS)
```bash
# Build and run
docker-compose up -d

# Access at http://localhost:5000
```

### Deploy to Docker-based platforms:
- **DigitalOcean App Platform**
- **Google Cloud Run**
- **AWS App Runner**

---

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection string updated
- [ ] Static files properly served
- [ ] CORS configured for your domain
- [ ] SSL/HTTPS enabled
- [ ] Health check endpoint working
- [ ] File upload limits configured
- [ ] Error handling for production

## 🔧 Production Optimizations

1. **Enable Gzip Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Add Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

3. **Security Headers:**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

## 🌐 Custom Domain Setup

1. **Railway:** Project Settings → Domains → Add Custom Domain
2. **Render:** Service Settings → Custom Domains
3. **Heroku:** `heroku domains:add yourdomain.com`

## 📊 Monitoring & Logs

- **Railway:** Built-in metrics and logs
- **Render:** Service logs and metrics dashboard
- **Heroku:** `heroku logs --tail`

---

Choose the platform that best fits your needs. Railway is recommended for beginners due to its simplicity and generous free tier.