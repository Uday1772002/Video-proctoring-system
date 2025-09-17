// Simplified standalone video proctoring application
// This version works without external dependencies for demonstration

class SimpleVideoProctoringApp {
  constructor() {
    this.isRecording = false;
    this.startTime = null;
    this.violations = [];
    this.events = [];
    this.currentScore = 100;
    this.lastFaceTime = Date.now();
    this.detectionInterval = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initCamera();
    this.logEvent("System initialized - Standalone mode", "info");
  }

  setupEventListeners() {
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.startSession());
    document
      .getElementById("stopBtn")
      .addEventListener("click", () => this.stopSession());
    document
      .getElementById("generateReportBtn")
      .addEventListener("click", () => this.generateReport());
    document
      .getElementById("testObjectBtn")
      .addEventListener("click", () => this.testObjectDetection());
  }

  async initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      const video = document.getElementById("candidateVideo");
      video.srcObject = stream;

      // Wait for video to start playing
      video.addEventListener("loadedmetadata", () => {
        this.logEvent(
          "Camera initialized successfully - Ready for detection",
          "info"
        );
        // Update initial status to good when camera is working
        document.getElementById("faceStatus").textContent = "✓ Ready";
        document.getElementById("faceStatus").className = "status-value good";
        document.getElementById("focusStatus").textContent = "✓ Ready";
        document.getElementById("focusStatus").className = "status-value good";
      });
    } catch (error) {
      this.logEvent(`Camera initialization failed: ${error.message}`, "danger");
      this.logEvent(
        "Please allow camera access for full functionality",
        "warning"
      );
    }
  }

  startSession() {
    const candidateName = document.getElementById("candidateName").value.trim();
    const position = document.getElementById("interviewPosition").value.trim();

    if (!candidateName || !position) {
      alert("Please enter candidate name and position");
      return;
    }

    this.isRecording = true;
    this.startTime = new Date();
    this.violations = [];
    this.events = [];
    this.currentScore = 100;

    // Update UI
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;
    document.getElementById("testObjectBtn").disabled = false;
    document.getElementById("recordingStatus").textContent = "🔴 Recording";
    document.getElementById("recordingStatus").className =
      "status-indicator recording";

    // Start basic detection simulation
    this.startDetection();
    this.startTimer();

    this.logEvent(`Session started for ${candidateName} - ${position}`, "info");
  }

  startDetection() {
    // Simulate basic detection logic
    this.detectionInterval = setInterval(() => {
      this.runSimpleDetection();
    }, 2000);
  }

  runSimpleDetection() {
    // Check if video is actually playing to determine if user is present
    const video = document.getElementById("candidateVideo");
    const hasVideo = video && video.srcObject && video.videoWidth > 0;

    // More realistic simulation - mostly positive if video is working
    const faceDetected = hasVideo ? Math.random() > 0.05 : false; // 95% chance if video present
    const focused = hasVideo ? Math.random() > 0.1 : false; // 90% chance if video present
    const objectDetected = Math.random() > 0.85; // 15% chance object detected (for demo visibility)

    if (faceDetected) {
      this.lastFaceTime = Date.now();
      document.getElementById("faceStatus").textContent = "✓ Detected";
      document.getElementById("faceStatus").className = "status-value good";
    } else {
      document.getElementById("faceStatus").textContent = hasVideo
        ? "⚠ Checking..."
        : "✗ Not Detected";
      document.getElementById("faceStatus").className = hasVideo
        ? "status-value warning"
        : "status-value danger";
      if (!hasVideo) {
        this.recordViolation("face_absent", "No video feed detected");
      }
    }

    if (focused) {
      document.getElementById("focusStatus").textContent = "✓ Focused";
      document.getElementById("focusStatus").className = "status-value good";
    } else {
      document.getElementById("focusStatus").textContent = hasVideo
        ? "⚠ Checking..."
        : "✗ Looking Away";
      document.getElementById("focusStatus").className = hasVideo
        ? "status-value warning"
        : "status-value danger";
      if (!hasVideo) {
        this.recordViolation(
          "focus_lost",
          "Unable to detect focus without video"
        );
      }
    }

    if (objectDetected) {
      const objects = ["phone", "book", "laptop", "tablet"];
      const detectedObject =
        objects[Math.floor(Math.random() * objects.length)];
      document.getElementById(
        "detectedObjects"
      ).innerHTML = `<span class="object-item">${detectedObject} detected</span>`;
      this.recordViolation(
        "object_detected",
        `Suspicious object: ${detectedObject}`
      );
    } else {
      document.getElementById("detectedObjects").innerHTML =
        '<span class="no-objects">No suspicious objects detected</span>';
    }

    document.getElementById("multipleFaceStatus").textContent = "✓ Single";
    document.getElementById("multipleFaceStatus").className =
      "status-value good";

    // Add visual feedback for demo
    if (hasVideo) {
      this.logEvent("Video feed active - detection running normally", "info");
    }
  }

  recordViolation(type, details) {
    const violation = {
      type,
      timestamp: new Date(),
      details,
      pointsDeducted: this.getViolationWeight(type),
    };

    this.violations.push(violation);
    this.currentScore = Math.max(
      0,
      this.currentScore - violation.pointsDeducted
    );

    this.updateScore();
    this.logEvent(`Violation: ${details}`, "danger");
  }

  getViolationWeight(type) {
    const weights = {
      face_absent: 15,
      focus_lost: 8,
      object_detected: 12,
      multiple_faces: 20,
    };
    return weights[type] || 5;
  }

  updateScore() {
    document.getElementById("integrityScore").textContent = this.currentScore;

    const scoreCircle = document.getElementById("integrityScore").parentElement;
    if (this.currentScore >= 80) {
      scoreCircle.style.background =
        "linear-gradient(135deg, #28a745, #20c997)";
    } else if (this.currentScore >= 60) {
      scoreCircle.style.background =
        "linear-gradient(135deg, #ffc107, #fd7e14)";
    } else {
      scoreCircle.style.background =
        "linear-gradient(135deg, #dc3545, #c82333)";
    }

    // Update violation counters
    const focusViolations = this.violations.filter(
      (v) => v.type === "focus_lost"
    ).length;
    const objectViolations = this.violations.filter(
      (v) => v.type === "object_detected"
    ).length;

    document.getElementById("focusViolations").textContent = focusViolations;
    document.getElementById("objectViolations").textContent = objectViolations;
  }

  startTimer() {
    this.timer = setInterval(() => {
      const elapsed = new Date() - this.startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      const timeString = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      document.getElementById("timerDisplay").textContent = timeString;
    }, 1000);
  }

  stopSession() {
    this.isRecording = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }

    if (this.timer) {
      clearInterval(this.timer);
    }

    // Update UI
    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("testObjectBtn").disabled = true;
    document.getElementById("generateReportBtn").disabled = false;
    document.getElementById("recordingStatus").textContent = "⚫ Stopped";
    document.getElementById("recordingStatus").className =
      "status-indicator ready";

    this.logEvent("Session completed", "info");
  }

  testObjectDetection() {
    // Manually trigger object detection for demo purposes
    const objects = [
      "phone",
      "book",
      "laptop",
      "tablet",
      "notes",
      "smartwatch",
    ];
    const detectedObject = objects[Math.floor(Math.random() * objects.length)];

    document.getElementById(
      "detectedObjects"
    ).innerHTML = `<span class="object-item">${detectedObject} detected</span>`;

    this.recordViolation(
      "object_detected",
      `Test detection: ${detectedObject}`
    );
    this.logEvent(`Manual test: ${detectedObject} detected`, "warning");

    // Clear after 3 seconds
    setTimeout(() => {
      document.getElementById("detectedObjects").innerHTML =
        '<span class="no-objects">No suspicious objects detected</span>';
    }, 3000);
  }

  logEvent(message, type) {
    const event = {
      timestamp: new Date(),
      type,
      message,
    };

    this.events.unshift(event);

    // Update events display
    const eventsLog = document.getElementById("eventsLog");
    const eventElement = document.createElement("div");
    eventElement.className = `event-item ${type}`;
    eventElement.innerHTML = `
            <span class="timestamp">${event.timestamp.toLocaleTimeString()}</span>
            <span class="message">${message}</span>
        `;

    eventsLog.insertBefore(eventElement, eventsLog.firstChild);

    // Keep only last 10 events in display
    while (eventsLog.children.length > 10) {
      eventsLog.removeChild(eventsLog.lastChild);
    }
  }

  generateReport() {
    const candidateName = document.getElementById("candidateName").value.trim();
    const position = document.getElementById("interviewPosition").value.trim();
    const duration = this.formatDuration(new Date() - this.startTime);

    let csvContent = "Video Proctoring Report\\n\\n";
    csvContent += `Candidate Name:,${candidateName}\\n`;
    csvContent += `Position:,${position}\\n`;
    csvContent += `Start Time:,${this.startTime.toLocaleString()}\\n`;
    csvContent += `Duration:,${duration}\\n`;
    csvContent += `Final Score:,${this.currentScore}/100\\n\\n`;

    csvContent += "Violations:\\n";
    csvContent += "Type,Timestamp,Points Deducted,Details\\n";
    this.violations.forEach((v) => {
      csvContent += `${v.type},${v.timestamp.toLocaleString()},${
        v.pointsDeducted
      },"${v.details}"\\n`;
    });

    csvContent += "\\nEvents:\\n";
    csvContent += "Type,Timestamp,Message\\n";
    this.events.forEach((e) => {
      csvContent += `${e.type},${e.timestamp.toLocaleString()},"${
        e.message
      }"\\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring_report_${candidateName.replace(/\\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.logEvent("Report generated and downloaded", "info");
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.proctoringApp = new SimpleVideoProctoringApp();
});
