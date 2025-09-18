const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/video_proctoring";
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // Continue without database if MongoDB is not available
    console.log("⚠️  Continuing without database connection");
  }
};

// Proctoring Session Schema
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  candidateName: { type: String, required: true },
  position: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: String },
  finalScore: { type: Number, default: 100 },
  violations: [
    {
      type: { type: String, required: true },
      timestamp: { type: Date, required: true },
      details: { type: mongoose.Schema.Types.Mixed },
      pointsDeducted: { type: Number, default: 0 },
    },
  ],
  events: [
    {
      timestamp: { type: Date, required: true },
      type: { type: String, required: true },
      message: { type: String, required: true },
    },
  ],
  videoPath: { type: String },
  reportGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}.webm`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Create uploads directory if it doesn't exist
const fs = require("fs");
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Start a new proctoring session
app.post("/api/sessions/start", async (req, res) => {
  try {
    const { candidateName, position } = req.body;

    if (!candidateName || !position) {
      return res.status(400).json({
        error: "Candidate name and position are required",
      });
    }

    const sessionId = uuidv4();
    const sessionData = {
      sessionId,
      candidateName,
      position,
      startTime: new Date(),
      violations: [],
      events: [
        {
          timestamp: new Date(),
          type: "info",
          message: `Session started for ${candidateName} - ${position}`,
        },
      ],
    };

    if (mongoose.connection.readyState === 1) {
      const session = new Session(sessionData);
      await session.save();
    }

    res.json({
      sessionId,
      message: "Session started successfully",
      timestamp: sessionData.startTime,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// End a proctoring session
app.post("/api/sessions/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { finalScore, violations, events, duration } = req.body;
    const endTime = new Date();

    // Debug: log incoming request body
    console.log("Session end received for", sessionId);
    console.log("Request body:", req.body);

    // Remove 'id' field from events and violations
    const cleanEvents = (events || []).map(({ id, ...rest }) => rest);
    const cleanViolations = (violations || []).map(({ id, ...rest }) => rest);

    if (mongoose.connection.readyState === 1) {
      // First, set all fields except events
      await Session.findOneAndUpdate(
        { sessionId },
        {
          $set: {
            endTime,
            duration,
            finalScore,
            violations: cleanViolations,
            events: cleanEvents,
            reportGenerated: true,
          },
        }
      );
      // Then, push the final event
      await Session.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            events: {
              timestamp: endTime,
              type: "info",
              message: "Session ended",
            },
          },
        }
      );
    }

    res.json({
      message: "Session ended successfully",
      endTime,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

// Log violation during session
app.post("/api/sessions/:sessionId/violations", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const violation = {
      ...req.body,
      timestamp: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await Session.findOneAndUpdate(
        { sessionId },
        { $push: { violations: violation } }
      );
    }

    res.json({ message: "Violation logged successfully" });
  } catch (error) {
    console.error("Error logging violation:", error);
    res.status(500).json({ error: "Failed to log violation" });
  }
});

// Log event during session
app.post("/api/sessions/:sessionId/events", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const event = {
      ...req.body,
      timestamp: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      await Session.findOneAndUpdate(
        { sessionId },
        { $push: { events: event } }
      );
    }

    res.json({ message: "Event logged successfully" });
  } catch (error) {
    console.error("Error logging event:", error);
    res.status(500).json({ error: "Failed to log event" });
  }
});

// Upload recorded video
app.post(
  "/api/sessions/:sessionId/upload",
  upload.single("video"),
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded" });
      }

      const videoPath = req.file.filename;

      if (mongoose.connection.readyState === 1) {
        await Session.findOneAndUpdate({ sessionId }, { videoPath });
      }

      res.json({
        message: "Video uploaded successfully",
        filename: videoPath,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: "Failed to upload video" });
    }
  }
);

// Get session details
app.get("/api/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (mongoose.connection.readyState === 1) {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Get all sessions (for admin/reporting)
app.get("/api/sessions", async (req, res) => {
  try {
    const { page = 1, limit = 10, candidateName } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = candidateName
        ? { candidateName: { $regex: candidateName, $options: "i" } }
        : {};

      const sessions = await Session.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select("-events -violations"); // Exclude large arrays for list view

      const total = await Session.countDocuments(query);

      res.json({
        sessions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// Generate and download session report
app.get("/api/sessions/:sessionId/report", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format = "json" } = req.query;

    if (mongoose.connection.readyState === 1) {
      const session = await Session.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (format === "csv") {
        const csv = generateCSVReport(session);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="report_${sessionId}.csv"`
        );
        res.send(csv);
      } else {
        res.json(session);
      }

      // Mark report as generated
      await Session.findOneAndUpdate({ sessionId }, { reportGenerated: true });
    } else {
      res.status(503).json({ error: "Database not available" });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Helper function to generate CSV report
function generateCSVReport(session) {
  let csv = "Proctoring Session Report\n\n";
  csv += `Session ID,${session.sessionId}\n`;
  csv += `Candidate Name,${session.candidateName}\n`;
  csv += `Position,${session.position}\n`;
  csv += `Start Time,${session.startTime}\n`;
  csv += `End Time,${session.endTime || "In Progress"}\n`;
  csv += `Duration,${session.duration || "N/A"}\n`;
  csv += `Final Score,${session.finalScore}/100\n\n`;

  csv += "Violations\n";
  csv += "Type,Timestamp,Points Deducted,Details\n";
  session.violations.forEach((violation) => {
    csv += `${violation.type},${violation.timestamp},${
      violation.pointsDeducted
    },"${violation.details || ""}"\n`;
  });

  csv += "\nEvents\n";
  csv += "Type,Timestamp,Message\n";
  session.events.forEach((event) => {
    csv += `${event.type},${event.timestamp},"${event.message}"\n`;
  });

  return csv;
}

// Serve main application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Video Proctoring Server running on port ${PORT}`);
    console.log(`📱 Access the application at: http://localhost:${PORT}`);
    console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

module.exports = app;
