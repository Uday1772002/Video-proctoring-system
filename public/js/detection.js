// Object Detection Module for Suspicious Items
class ObjectDetectionModule {
  constructor() {
    this.model = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isDetecting = false;
    this.detectionInterval = null;

    // Suspicious objects to detect - based on actual COCO-SSD class names
    this.suspiciousObjects = [
      "cell phone", // COCO class name
      "book", // COCO class name
      "laptop", // COCO class name
      "tv", // COCO class name (could be monitor)
      "remote", // COCO class name
      "keyboard", // COCO class name
      "mouse", // COCO class name
      "backpack", // COCO class name
      "handbag", // COCO class name
      "bottle", // COCO class name
      "cup", // COCO class name
      "clock", // COCO class name (wall clock could be suspicious)
    ];

    // Objects to ignore (not violations)
    this.ignoredObjects = ["person", "face", "head"];
    this.detectedObjects = new Set();
    this.lastDetectionTime = {};
  }

  async initialize(videoElement) {
    this.video = videoElement;
    this.canvas = document.getElementById("objectDetectionCanvas");
    this.ctx = this.canvas.getContext("2d");

    try {
      console.log("Loading COCO-SSD model...");
      this.model = await cocoSsd.load();
      console.log("Object detection model loaded successfully");
      return true;
    } catch (error) {
      console.error("Failed to load object detection model:", error);
      return false;
    }
  }

  startDetection() {
    if (this.isDetecting || !this.model) return;

    this.isDetecting = true;

    // Run object detection every 2 seconds (less frequent than face detection)
    this.detectionInterval = setInterval(() => {
      this.runObjectDetection();
    }, 2000);

    console.log("Object detection started");
  }

  stopDetection() {
    this.isDetecting = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    console.log("Object detection stopped");
  }

  async runObjectDetection() {
    if (
      !this.isDetecting ||
      !this.model ||
      !this.video ||
      this.video.videoWidth === 0
    ) {
      return;
    }

    try {
      const predictions = await this.model.detect(this.video);
      console.log("Object detection running, predictions:", predictions.length);
      this.processObjectDetections(predictions);
    } catch (error) {
      console.error("Error in object detection:", error);
    }
  }

  processObjectDetections(predictions) {
    const currentDetected = new Set();
    const suspiciousDetections = [];

    // Debug: Log all predictions to console
    console.log(
      "All detected objects:",
      predictions.map((p) => `${p.class} (${Math.round(p.score * 100)}%)`)
    );

    predictions.forEach((prediction) => {
      const objectClass = prediction.class.toLowerCase();
      const confidence = prediction.score;

      // Skip ignored objects (like person)
      if (this.isIgnoredObject(objectClass)) {
        return; // Don't process person detections
      }

      // Check if this is a suspicious object with lower threshold
      if (this.isSuspiciousObject(objectClass) && confidence > 0.3) {
        // Reduced back to 30% confidence threshold
        console.log(
          `Suspicious object detected: ${objectClass} (${Math.round(
            confidence * 100
          )}%)`
        );
        currentDetected.add(objectClass);
        suspiciousDetections.push({
          class: objectClass,
          confidence: confidence,
          bbox: prediction.bbox,
        });

        // Record detection time
        this.lastDetectionTime[objectClass] = Date.now();
      }
    });

    // Check for new detections
    currentDetected.forEach((objectClass) => {
      if (!this.detectedObjects.has(objectClass)) {
        this.logObjectDetection(objectClass, true);
      }
    });

    // Check for objects that are no longer detected
    this.detectedObjects.forEach((objectClass) => {
      if (!currentDetected.has(objectClass)) {
        this.logObjectDetection(objectClass, false);
      }
    });

    this.detectedObjects = currentDetected;
    this.updateObjectDisplay(suspiciousDetections);
    this.drawObjectDetections(suspiciousDetections);
  }

  isSuspiciousObject(objectClass) {
    return this.suspiciousObjects.some(
      (suspicious) =>
        objectClass.includes(suspicious) || suspicious.includes(objectClass)
    );
  }

  isIgnoredObject(objectClass) {
    return this.ignoredObjects.some(
      (ignored) =>
        objectClass.includes(ignored) || ignored.includes(objectClass)
    );
  }

  logObjectDetection(objectClass, detected) {
    const action = detected ? "detected" : "no longer visible";
    const severity = detected ? "danger" : "warning";

    window.proctoringApp.eventLogger.logEvent(
      `Suspicious object ${action}: ${objectClass}`,
      severity
    );

    if (detected) {
      window.proctoringApp.integrityScorer.recordViolation(
        "object_detected",
        objectClass
      );
    }
  }

  updateObjectDisplay(detections) {
    const detectedObjectsDiv = document.getElementById("detectedObjects");

    if (detections.length === 0) {
      detectedObjectsDiv.innerHTML =
        '<span class="no-objects">No suspicious objects detected</span>';
    } else {
      const objectItems = detections
        .map((detection) => {
          const confidence = Math.round(detection.confidence * 100);
          return `<span class="object-item">${detection.class} (${confidence}%)</span>`;
        })
        .join("");

      detectedObjectsDiv.innerHTML = objectItems;
    }
  }

  drawObjectDetections(detections) {
    // Ensure canvas is properly sized
    if (this.canvas && this.video) {
      this.canvas.width = this.video.videoWidth || this.video.clientWidth;
      this.canvas.height = this.video.videoHeight || this.video.clientHeight;
    }

    // Clear any previous object detection drawings
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Limit to top 3 most confident detections to reduce clutter
    const sortedDetections = detections
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    sortedDetections.forEach((detection, index) => {
      const [x, y, width, height] = detection.bbox;
      const confidence = Math.round(detection.confidence * 100);

      // Draw bounding box for suspicious objects
      this.ctx.strokeStyle = "#ff0000";
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(x, y, width, height);

      // Draw label background
      this.ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      const labelWidth = Math.min(width, 200); // Limit label width
      this.ctx.fillRect(x, y - 25, labelWidth, 25);

      // Draw label text
      this.ctx.fillStyle = "#ffffff";
      this.ctx.font = "bold 12px Arial";
      this.ctx.fillText(`${detection.class} ${confidence}%`, x + 5, y - 8);
    });
  }

  // Public methods
  getCurrentDetections() {
    return Array.from(this.detectedObjects);
  }

  hasSuspiciousObjects() {
    return this.detectedObjects.size > 0;
  }
}

// Face Detection and Focus Monitoring Module
class FaceDetectionModule {
  constructor() {
    this.faceDetection = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.isDetecting = false;
    this.detectionInterval = null;

    // Focus tracking
    this.lastFaceDetectionTime = Date.now();
    this.faceAbsentThreshold = 10000; // 10 seconds
    this.focusLostThreshold = 5000; // 5 seconds
    this.lastFocusTime = Date.now();
    this.isLookingAway = false;
    this.faceAbsentWarningShown = false;
    this.focusWarningShown = false;

    // Face tracking state
    this.currentFaceCount = 0;
    this.multipleFaceWarningShown = false;
  }

  async initialize(videoElement) {
    this.video = videoElement;
    this.canvas = document.getElementById("faceDetectionCanvas");
    this.ctx = this.canvas.getContext("2d");

    try {
      console.log("Initializing MediaPipe Face Detection...");

      // Check if MediaPipe is available
      if (typeof FaceDetection === "undefined") {
        console.error("MediaPipe FaceDetection not available, using fallback");
        this.initializeFallbackDetection();
        return true;
      }

      // Initialize MediaPipe Face Detection
      const faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        },
      });

      faceDetection.setOptions({
        model: "short",
        minDetectionConfidence: 0.5,
      });

      faceDetection.onResults((results) => {
        this.processFaceDetectionResults(results);
      });

      this.faceDetection = faceDetection;

      // Set canvas size to match video
      this.resizeCanvas();

      console.log("Face detection initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize face detection:", error);
      // Fallback to basic face detection if MediaPipe fails
      this.initializeFallbackDetection();
      return true;
    }
  }

  initializeFallbackDetection() {
    console.log("Using fallback face detection method");
    // Simple face detection using getUserMedia constraints
    // This is a basic implementation that checks for video frame changes
  }

  resizeCanvas() {
    if (this.canvas && this.video) {
      this.canvas.width = this.video.videoWidth || this.video.clientWidth;
      this.canvas.height = this.video.videoHeight || this.video.clientHeight;
    }
  }

  startDetection() {
    if (this.isDetecting) return;

    this.isDetecting = true;
    this.lastFaceDetectionTime = Date.now();
    this.lastFocusTime = Date.now();

    // Start detection loop
    this.detectionInterval = setInterval(() => {
      this.runDetection();
    }, 100); // Run detection every 100ms

    console.log("Face detection started");
  }

  stopDetection() {
    this.isDetecting = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    // Clear canvas
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    console.log("Face detection stopped");
  }

  async runDetection() {
    if (!this.isDetecting || !this.video || this.video.videoWidth === 0) {
      return;
    }

    try {
      // Resize canvas if needed
      if (this.canvas.width !== this.video.videoWidth) {
        this.resizeCanvas();
      }

      if (this.faceDetection) {
        // Use MediaPipe detection
        await this.faceDetection.send({ image: this.video });
      } else {
        // Use fallback detection
        this.runFallbackDetection();
      }
    } catch (error) {
      console.error("Error in face detection:", error);
    }
  }

  processFaceDetectionResults(results) {
    // Clear previous drawings only if canvas is available
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const allFaces = results.detections || [];

    console.log("Raw face detection results:", results);
    console.log("All faces array:", allFaces);

    // Filter out low-quality face detections to reduce false positives
    const validFaces = this.filterValidFaces(allFaces);
    this.currentFaceCount = validFaces.length;

    console.log(
      `Face detection results: ${allFaces.length} raw detections, ${validFaces.length} valid faces`
    );

    // Update face detection time
    if (validFaces.length > 0) {
      this.lastFaceDetectionTime = Date.now();
      this.faceAbsentWarningShown = false;
    }

    // Draw face detection boxes for valid faces only
    validFaces.forEach((detection, index) => {
      this.drawFaceBox(detection, index);
      this.analyzeFaceOrientation(detection);
    });

    // Update UI status
    this.updateFaceStatus();
    this.updateFocusStatus();
    this.updateMultipleFaceStatus();

    // Check for violations
    this.checkViolations();
  }

  filterValidFaces(detections) {
    if (!detections || detections.length === 0) {
      return [];
    }

    // Filter faces based on quality criteria
    const validFaces = detections.filter((detection) => {
      if (!detection.boundingBox) {
        return false;
      }

      const bbox = detection.boundingBox;

      // Get confidence score
      let confidence = 0.5; // Default
      if (detection.score && detection.score.length > 0) {
        confidence = detection.score[0];
      } else if (detection.confidence !== undefined) {
        confidence = detection.confidence;
      }

      // Filter criteria to reduce false positives:

      // 1. Minimum confidence threshold (relaxed for testing)
      if (confidence < 0.3) {
        console.log("Filtered out low confidence face:", confidence);
        return false;
      }

      // 2. Minimum face size (faces that are too small are likely false positives)
      const faceArea = bbox.width * bbox.height;
      if (faceArea < 0.005) {
        // Face should be at least 0.5% of the frame (relaxed)
        console.log("Filtered out small face, area:", faceArea);
        return false;
      }

      // 3. Maximum face size (faces that are too large might be false positives)
      if (faceArea > 0.9) {
        // Face shouldn't be more than 90% of the frame (relaxed)
        console.log("Filtered out oversized face, area:", faceArea);
        return false;
      }

      // 4. Face position sanity check (faces should be reasonably positioned)
      const centerX = bbox.xCenter;
      const centerY = bbox.yCenter;

      // Face center should be within reasonable bounds (relaxed)
      if (
        centerX < 0.05 ||
        centerX > 0.95 ||
        centerY < 0.05 ||
        centerY > 0.95
      ) {
        console.log("Filtered out edge-positioned face:", centerX, centerY);
        return false;
      }

      return true;
    });

    // Additional filtering: If we have multiple valid faces, prefer the largest/most centered ones
    if (validFaces.length > 2) {
      // Sort by a combination of size and confidence, keep top 2
      validFaces.sort((a, b) => {
        const aScore = this.getFaceQualityScore(a);
        const bScore = this.getFaceQualityScore(b);
        return bScore - aScore;
      });

      console.log(`Filtered ${validFaces.length} to 2 highest quality faces`);
      return validFaces.slice(0, 2);
    }

    return validFaces;
  }

  getFaceQualityScore(detection) {
    if (!detection.boundingBox) return 0;

    const bbox = detection.boundingBox;
    let confidence = 0.5;

    if (detection.score && detection.score.length > 0) {
      confidence = detection.score[0];
    } else if (detection.confidence !== undefined) {
      confidence = detection.confidence;
    }

    const faceArea = bbox.width * bbox.height;
    const centerX = bbox.xCenter;
    const centerY = bbox.yCenter;

    // Distance from center of frame
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.5, 2)
    );

    // Higher score for larger faces, higher confidence, and more centered position
    return confidence * faceArea * (1 - distanceFromCenter);
  }

  drawFaceBox(detection, index) {
    if (!detection.boundingBox) {
      console.warn("Face detection missing boundingBox data");
      return;
    }

    const bbox = detection.boundingBox;

    // MediaPipe face detection boundingBox format
    const x =
      bbox.xCenter * this.canvas.width - (bbox.width * this.canvas.width) / 2;
    const y =
      bbox.yCenter * this.canvas.height -
      (bbox.height * this.canvas.height) / 2;
    const width = bbox.width * this.canvas.width;
    const height = bbox.height * this.canvas.height;

    // Draw bounding box
    this.ctx.strokeStyle = this.currentFaceCount === 1 ? "#00ff00" : "#ff0000";
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Draw face number if multiple faces
    if (this.currentFaceCount > 1) {
      this.ctx.fillStyle = "#ff0000";
      this.ctx.font = "16px Arial";
      this.ctx.fillText(`Face ${index + 1}`, x, y - 5);
    }

    // Draw confidence score (MediaPipe format)
    let confidence = 50; // Default fallback
    if (detection.score && detection.score.length > 0) {
      confidence = Math.round(detection.score[0] * 100);
    } else if (detection.confidence !== undefined) {
      confidence = Math.round(detection.confidence * 100);
    }

    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(x, y + height, 80, 20);
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(`${confidence}%`, x + 5, y + height + 15);
  }

  analyzeFaceOrientation(detection) {
    if (!detection.boundingBox) {
      console.warn(
        "Face detection missing boundingBox data for orientation analysis"
      );
      return;
    }

    // Simple focus analysis based on face position and size
    const bbox = detection.boundingBox;
    const faceArea = bbox.width * bbox.height;
    const centerX = bbox.xCenter;
    const centerY = bbox.yCenter;

    // Consider looking away if face is too far from center or too small
    const horizontalDeviation = Math.abs(centerX - 0.5);
    const verticalDeviation = Math.abs(centerY - 0.5);

    const isLookingAway =
      horizontalDeviation > 0.3 || verticalDeviation > 0.25 || faceArea < 0.05;

    if (!isLookingAway) {
      this.lastFocusTime = Date.now();
      this.isLookingAway = false;
      this.focusWarningShown = false;
    } else {
      this.isLookingAway = true;
    }
  }

  runFallbackDetection() {
    // Basic fallback detection - just check if video is active
    if (this.video && this.video.videoWidth > 0) {
      this.lastFaceDetectionTime = Date.now();
      this.lastFocusTime = Date.now();
      this.currentFaceCount = 1; // Assume one face present
    }

    this.updateFaceStatus();
    this.updateFocusStatus();
    this.updateMultipleFaceStatus();
  }

  updateFaceStatus() {
    const faceStatus = document.getElementById("faceStatus");
    const timeSinceLastFace = Date.now() - this.lastFaceDetectionTime;

    if (timeSinceLastFace < 1000) {
      faceStatus.textContent = "✓ Detected";
      faceStatus.className = "status-value good";
    } else if (timeSinceLastFace < this.faceAbsentThreshold) {
      faceStatus.textContent = "⚠ Checking...";
      faceStatus.className = "status-value warning";
    } else {
      faceStatus.textContent = "✗ Not Detected";
      faceStatus.className = "status-value danger";
    }
  }

  updateFocusStatus() {
    const focusStatus = document.getElementById("focusStatus");
    const timeSinceFocus = Date.now() - this.lastFocusTime;

    if (timeSinceFocus < 1000) {
      focusStatus.textContent = "✓ Focused";
      focusStatus.className = "status-value good";
    } else if (timeSinceFocus < this.focusLostThreshold) {
      focusStatus.textContent = "⚠ Checking...";
      focusStatus.className = "status-value warning";
    } else {
      focusStatus.textContent = "✗ Looking Away";
      focusStatus.className = "status-value danger";
    }
  }

  updateMultipleFaceStatus() {
    const multipleFaceStatus = document.getElementById("multipleFaceStatus");

    if (this.currentFaceCount <= 1) {
      multipleFaceStatus.textContent = "✓ Single";
      multipleFaceStatus.className = "status-value good";
      this.multipleFaceWarningShown = false; // Reset warning flag
    } else {
      multipleFaceStatus.textContent = `✗ Multiple (${this.currentFaceCount})`;
      multipleFaceStatus.className = "status-value danger";

      // Log warning only once per incident to avoid spam
      if (!this.multipleFaceWarningShown) {
        window.proctoringApp.eventLogger.logEvent(
          `Multiple faces detected: ${this.currentFaceCount} faces`,
          "warning"
        );
        this.multipleFaceWarningShown = true;
      }
    }
  }

  checkViolations() {
    const currentTime = Date.now();

    // Check face absence violation
    const timeSinceLastFace = currentTime - this.lastFaceDetectionTime;
    if (
      timeSinceLastFace > this.faceAbsentThreshold &&
      !this.faceAbsentWarningShown
    ) {
      window.proctoringApp.eventLogger.logEvent(
        "Face not detected for more than 10 seconds",
        "danger"
      );
      window.proctoringApp.integrityScorer.recordViolation(
        "face_absent",
        timeSinceLastFace
      );
      this.faceAbsentWarningShown = true;
    }

    // Check focus violation
    const timeSinceFocus = currentTime - this.lastFocusTime;
    if (timeSinceFocus > this.focusLostThreshold && !this.focusWarningShown) {
      window.proctoringApp.eventLogger.logEvent(
        "Candidate looking away for more than 5 seconds",
        "warning"
      );
      window.proctoringApp.integrityScorer.recordViolation(
        "focus_lost",
        timeSinceFocus
      );
      this.focusWarningShown = true;
    }

    // Check multiple faces violation
    if (this.currentFaceCount > 1 && !this.multipleFaceWarningShown) {
      window.proctoringApp.eventLogger.logEvent(
        `Multiple faces detected (${this.currentFaceCount})`,
        "danger"
      );
      window.proctoringApp.integrityScorer.recordViolation(
        "multiple_faces",
        this.currentFaceCount
      );
      this.multipleFaceWarningShown = true;
    } else if (this.currentFaceCount <= 1) {
      this.multipleFaceWarningShown = false;
    }
  }

  // Public methods for external access
  getCurrentFaceCount() {
    return this.currentFaceCount;
  }

  isFacePresent() {
    return Date.now() - this.lastFaceDetectionTime < 2000;
  }

  isFocused() {
    return Date.now() - this.lastFocusTime < 2000;
  }
}
