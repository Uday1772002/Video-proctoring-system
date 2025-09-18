// Main application controller
class VideoProctoringApp {
  constructor() {
    this.isRecording = false;
    this.startTime = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.timer = null;

    // Detection modules
    this.faceDetection = new FaceDetectionModule();
    this.objectDetection = new ObjectDetectionModule();
    this.eventLogger = new EventLogger();
    this.integrityScorer = new IntegrityScorer();

    this.sessionId = null; // Store backend sessionId
    this.drowsinessDetectionActive = false;

    loadFaceMeshModel(); // Load Face Mesh model at startup

    this.initializeEventListeners();
    this.initializeVideoStream();
  }

  initializeEventListeners() {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const generateReportBtn = document.getElementById("generateReportBtn");
    const downloadVideoBtn = document.getElementById("downloadVideoBtn");

    startBtn.addEventListener("click", () => this.startInterview());
    stopBtn.addEventListener("click", () => this.stopInterview());
    generateReportBtn.addEventListener("click", () => this.generateReport());
    downloadVideoBtn.addEventListener("click", () => this.downloadRecording());

    // Validate candidate info
    const candidateName = document.getElementById("candidateName");
    const interviewPosition = document.getElementById("interviewPosition");

    [candidateName, interviewPosition].forEach((input) => {
      input.addEventListener("input", () => this.validateCandidateInfo());
    });
  }

  async initializeVideoStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: "user",
        },
        audio: true,
      });

      const video = document.getElementById("candidateVideo");
      video.srcObject = stream;

      // Initialize detection modules with video element
      await this.faceDetection.initialize(video);
      await this.objectDetection.initialize(video);

      this.eventLogger.logEvent("System initialized successfully", "info");
    } catch (error) {
      console.error("Error accessing camera:", error);
      this.eventLogger.logEvent(
        "Failed to access camera: " + error.message,
        "danger"
      );
    }
  }

  validateCandidateInfo() {
    const candidateName = document.getElementById("candidateName").value.trim();
    const interviewPosition = document
      .getElementById("interviewPosition")
      .value.trim();
    const startBtn = document.getElementById("startBtn");

    startBtn.disabled = !(candidateName && interviewPosition);
  }

  async startInterview() {
    const candidateName = document.getElementById("candidateName").value.trim();
    const interviewPosition = document
      .getElementById("interviewPosition")
      .value.trim();

    if (!candidateName || !interviewPosition) {
      alert("Please enter candidate name and position before starting.");
      return;
    }

    try {
      this.isRecording = true;
      this.startTime = new Date();

      // Update UI
      document.getElementById("startBtn").disabled = true;
      document.getElementById("stopBtn").disabled = false;
      document.getElementById("candidateName").disabled = true;
      document.getElementById("interviewPosition").disabled = true;

      const recordingStatus = document.getElementById("recordingStatus");
      recordingStatus.textContent = "🔴 Recording";
      recordingStatus.className = "status-indicator recording";

      // Start video recording
      await this.startVideoRecording();

      // Start detection systems
      this.faceDetection.startDetection();
      this.objectDetection.startDetection();

      // Start timer
      this.startTimer();

      // Initialize integrity scoring
      this.integrityScorer.initialize(candidateName, interviewPosition);

      // Start backend session
      const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.START_SESSION), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateName, position: interviewPosition }),
      });
      const data = await response.json();
      this.sessionId = data.sessionId;
      this.drowsinessDetectionActive = true;
      this.runDrowsinessLoop(); // Start drowsiness detection loop

      this.eventLogger.logEvent(
        `Interview started for ${candidateName} - ${interviewPosition}`,
        "info"
      );
    } catch (error) {
      console.error("Error starting interview:", error);
      this.eventLogger.logEvent(
        "Failed to start interview: " + error.message,
        "danger"
      );
      this.resetToReadyState();
    }
  }

  async startVideoRecording() {
    const video = document.getElementById("candidateVideo");
    const stream = video.srcObject;

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Record in 1-second chunks
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

  async stopInterview() {
    this.isRecording = false;

    // Stop detection systems
    this.faceDetection.stopDetection();
    this.objectDetection.stopDetection();

    // Stop timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Stop video recording
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Update UI
    const recordingStatus = document.getElementById("recordingStatus");
    recordingStatus.textContent = "⚫ Stopped";
    recordingStatus.className = "status-indicator ready";

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("candidateName").disabled = false;
    document.getElementById("interviewPosition").disabled = false;
    document.getElementById("generateReportBtn").disabled = false;
    document.getElementById("downloadVideoBtn").disabled = false;

    // Finalize integrity score
    this.integrityScorer.finalizeSession();

    // End backend session
    if (this.sessionId) {
      await fetch(getApiUrl(CONFIG.ENDPOINTS.END_SESSION, { sessionId: this.sessionId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalScore: this.integrityScorer.finalScore,
          violations: this.integrityScorer.violations || [],
          events: this.eventLogger.getAllEvents(),
          duration: this.getInterviewDuration(),
        }),
      });
    }

    this.eventLogger.logEvent("Interview session completed", "info");
  }

  getInterviewDuration() {
    if (!this.startTime) return "0";
    const end = new Date();
    const ms = end - this.startTime;
    const sec = Math.floor(ms / 1000);
    return `${sec} seconds`;
  }

  resetToReadyState() {
    this.isRecording = false;

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("candidateName").disabled = false;
    document.getElementById("interviewPosition").disabled = false;

    const recordingStatus = document.getElementById("recordingStatus");
    recordingStatus.textContent = "⚫ Ready";
    recordingStatus.className = "status-indicator ready";

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  generateReport() {
    const report = this.integrityScorer.generateReport();
    const events = this.eventLogger.getAllEvents();

    // Create and download report
    this.downloadReport(report, events);
  }

  downloadReport(report, events) {
    // Create CSV content
    let csvContent = "Proctoring Report\\n\\n";
    csvContent += `Candidate Name:,${report.candidateName}\\n`;
    csvContent += `Position:,${report.position}\\n`;
    csvContent += `Interview Duration:,${report.duration}\\n`;
    csvContent += `Start Time:,${report.startTime}\\n`;
    csvContent += `End Time:,${report.endTime}\\n`;
    csvContent += `Integrity Score:,${report.finalScore}/100\\n\\n`;

    csvContent += "Violations Summary:\\n";
    csvContent += `Focus Violations:,${report.focusViolations}\\n`;
    csvContent += `Object Violations:,${report.objectViolations}\\n`;
    csvContent += `Absence Duration:,${report.absenceDuration} seconds\\n\\n`;

    csvContent += "Detailed Events:\\n";
    csvContent += "Timestamp,Type,Message\\n";

    events.forEach((event) => {
      csvContent += `${event.timestamp},${event.type},${event.message}\\n`;
    });

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring_report_${report.candidateName.replace(
      /\\s+/g,
      "_"
    )}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.eventLogger.logEvent(
      "Proctoring report generated and downloaded",
      "info"
    );
  }

  downloadRecording() {
    if (this.recordedChunks.length === 0) {
      alert("No recording available to download.");
      return;
    }

    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const candidateName = document.getElementById("candidateName").value.trim();
    a.download = `interview_recording_${candidateName.replace(/\\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.webm`;
    a.click();
    URL.revokeObjectURL(url);

    this.eventLogger.logEvent("Interview recording downloaded", "info");
  }

  runDrowsinessLoop() {
    const video = document.getElementById("candidateVideo");
    const loop = async () => {
      if (this.drowsinessDetectionActive) {
        await runDrowsinessDetection(video, this.sessionId);
        requestAnimationFrame(loop);
      }
    };
    loop();
  }
}

// Utility function to log detection events to backend
async function logEventToBackend(sessionId, eventType, message) {
  if (!sessionId) return;
  try {
    await fetch(getApiUrl(CONFIG.ENDPOINTS.LOG_EVENT, { sessionId }), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, message }),
    });
  } catch (err) {
    console.error("Failed to log event to backend:", err);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.proctoringApp = new VideoProctoringApp();
});
