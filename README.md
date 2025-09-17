# 🎯 Video Proctoring System - Focus & Object Detection

A comprehensive AI-powered video proctoring system designed for online interviews and examinations. The system uses computer vision and machine learning to monitor candidate behavior, detect unauthorized objects, and generate detailed integrity reports.

## ✨ Features

### 🔍 **Focus Detection**

- Real-time face detection and tracking
- Monitors if candidate is looking at the screen
- Detects when face is absent for more than 10 seconds
- Alerts when candidate looks away for more than 5 seconds
- Multiple face detection to prevent unauthorized assistance

### 📱 **Object Detection**

- Real-time detection of suspicious objects using YOLO/TensorFlow.js
- Identifies phones, books, notes, laptops, and other devices
- Visual highlighting of detected objects
- Automatic logging of object appearance/disappearance

### 📊 **Integrity Scoring**

- Dynamic scoring system starting at 100 points
- Point deductions based on violation severity
- Real-time score updates during the session
- Detailed breakdown of violations

### 📋 **Event Logging**

- Comprehensive logging of all detection events
- Timestamped entries with severity levels
- Real-time event display during sessions
- Export capabilities for detailed analysis

### 📄 **Report Generation**

- Detailed proctoring reports in CSV/PDF format
- Integrity score with recommendations
- Violation summaries and timestamps
- Video recording download capability

## 🚀 Technology Stack

### Frontend

- **HTML5/CSS3/JavaScript** - Core web technologies
- **TensorFlow.js** - Machine learning in the browser
- **COCO-SSD Model** - Object detection
- **MediaPipe** - Face detection and tracking
- **Canvas API** - Real-time video overlay

### Backend

- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database and ODM
- **Multer** - File upload handling
- **Socket.io** - Real-time communication (planned)

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Modern web browser with camera access
- Stable internet connection

### 1. Clone the Repository

```bash
git clone <repository-url>
cd video-proctoring-system
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Or install with specific package manager
yarn install
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
# Set MONGODB_URI for your database connection
```

### 4. Database Setup

```bash
# Make sure MongoDB is running locally, or
# Use MongoDB Atlas for cloud database
# The application will create necessary collections automatically
```

### 5. Create Required Directories

```bash
mkdir uploads
mkdir reports
```

### 6. Start the Application

```bash
# Development mode with auto-reload
npm run dev-all

# Or start components separately:
# Backend server
npm run dev

# Frontend server
npm run client

# Production mode
npm start
```

### 7. Access the Application

- **Main Application**: `http://localhost:3000`
- **API Health Check**: `http://localhost:5000/api/health`
- **Admin Panel**: `http://localhost:5000/admin` (future feature)

## 🎮 Usage Guide

### Starting an Interview Session

1. **Setup**

   - Open the application in a modern web browser
   - Allow camera and microphone permissions
   - Ensure good lighting and clear background

2. **Candidate Information**

   - Enter candidate name
   - Specify position/role
   - Click "Start Interview"

3. **During the Session**

   - Monitor real-time detection status
   - Watch integrity score updates
   - Review live event log
   - Observe detected objects panel

4. **Ending the Session**
   - Click "Stop Interview"
   - Generate and download report
   - Download video recording if needed

### Understanding the Interface

#### 🎥 Video Section

- **Live video feed** with detection overlays
- **Recording controls** for start/stop
- **Timer display** for session duration
- **Status indicators** for recording state

#### 🔍 Detection Panel

- **Focus Status**: Face detection and attention monitoring
- **Object Detection**: Real-time suspicious object alerts
- **Live Events**: Scrolling log of all detected events

#### 📊 Integrity Score

- **Score Circle**: Current integrity score out of 100
- **Violation Counters**: Breakdown by category
- **Absence Duration**: Total time face was not detected

## 🔧 Configuration

### Detection Sensitivity

```javascript
// Modify thresholds in detection.js
const faceAbsentThreshold = 10000; // 10 seconds
const focusLostThreshold = 5000; // 5 seconds
const objectConfidenceThreshold = 0.3; // 30% confidence
```

### Scoring System

```javascript
// Modify weights in scoring.js
const violationWeights = {
  face_absent: 15, // Face not detected
  focus_lost: 8, // Looking away
  multiple_faces: 20, // Multiple people
  object_detected: 12, // Suspicious object
};
```

### Suspicious Objects

```javascript
// Modify detected objects in detection.js
const suspiciousObjects = [
  "cell phone",
  "phone",
  "mobile phone",
  "book",
  "laptop",
  "computer",
  "tablet",
  "person",
  "remote",
];
```

## 📊 API Reference

### Session Management

```javascript
// Start session
POST /api/sessions/start
{
    "candidateName": "John Doe",
    "position": "Software Engineer"
}

// End session
POST /api/sessions/:sessionId/end
{
    "finalScore": 85,
    "violations": [...],
    "events": [...]
}
```

### Event Logging

```javascript
// Log violation
POST /api/sessions/:sessionId/violations
{
    "type": "focus_lost",
    "details": "Looking away for 7 seconds",
    "pointsDeducted": 8
}

// Log event
POST /api/sessions/:sessionId/events
{
    "type": "warning",
    "message": "Multiple faces detected"
}
```

### Reports

```javascript
// Get session report
GET /api/sessions/:sessionId/report?format=csv

// List all sessions
GET /api/sessions?page=1&limit=10
```

## 🛡️ Security & Privacy

### Data Protection

- Video recordings stored locally by default
- Session data encrypted in database
- No biometric data permanently stored
- GDPR compliance considerations included

### Browser Security

- HTTPS required for camera access in production
- CSP headers for XSS protection
- Input validation on all endpoints

## 🎁 Bonus Features

### 👁️ Eye Closure Detection (Planned)

- Drowsiness monitoring
- Attention level assessment
- Fatigue detection

### 🔔 Real-time Alerts (Planned)

- Interviewer notifications
- Sound alerts for violations
- Email notifications

### 🎙️ Audio Analysis (Planned)

- Background voice detection
- Whisper identification
- Audio quality monitoring

## 🧪 Testing

### Manual Testing

1. Test camera permissions in different browsers
2. Verify detection accuracy with various objects
3. Test report generation and download
4. Validate scoring calculations

### Automated Testing (Future)

```bash
# Run test suite
npm test

# Coverage report
npm run test:coverage
```

## 🚀 Deployment

### Local Production

```bash
# Set environment to production
NODE_ENV=production npm start
```

### Cloud Deployment (Heroku)

```bash
# Install Heroku CLI and login
heroku create video-proctoring-app
heroku config:set MONGODB_URI=your_atlas_uri
git push heroku main
```

### Docker Deployment

```dockerfile
# Use provided Dockerfile
docker build -t video-proctoring .
docker run -p 5000:5000 video-proctoring
```

## 📈 Performance Optimization

### Browser Performance

- Use WebWorkers for intensive computations
- Optimize TensorFlow.js model loading
- Implement frame rate throttling
- Memory management for long sessions

### Server Performance

- Database indexing for quick queries
- File compression for video uploads
- CDN integration for static assets
- Load balancing for multiple users

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch
3. Install dependencies
4. Make changes and test
5. Submit pull request

### Code Standards

- ESLint configuration provided
- Consistent naming conventions
- Comprehensive error handling
- Documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Camera Not Working**

- Check browser permissions
- Ensure HTTPS in production
- Try different browsers

**Detection Not Accurate**

- Improve lighting conditions
- Adjust detection thresholds
- Update browser to latest version

**Performance Issues**

- Close unnecessary browser tabs
- Check system resources
- Reduce video quality if needed

### Getting Help

- Create GitHub issues for bugs
- Check documentation wiki
- Join community Discord (link in repo)

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added object detection
- **v1.2.0** - Enhanced reporting system
- **v2.0.0** - Backend integration and database

## 🙏 Acknowledgments

- TensorFlow.js team for machine learning models
- MediaPipe for face detection capabilities
- Open source community for various libraries
- Beta testers and contributors

---

**Built with ❤️ for secure and fair online assessments**
