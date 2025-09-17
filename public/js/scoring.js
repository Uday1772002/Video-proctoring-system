// Integrity Scoring System
class IntegrityScorer {
  constructor() {
    this.candidateName = "";
    this.position = "";
    this.startTime = null;
    this.endTime = null;
    this.violations = [];
    this.initialScore = 100;
    this.currentScore = 100;

    // Violation weights (points deducted)
    this.violationWeights = {
      face_absent: 15, // Face not detected for >10 seconds
      focus_lost: 8, // Looking away for >5 seconds
      multiple_faces: 20, // Multiple people in frame
      object_detected: 12, // Suspicious object detected
      excessive_movement: 5, // Too much movement (future feature)
    };

    this.scoreBreakdown = {
      focusViolations: 0,
      objectViolations: 0,
      presenceViolations: 0,
      otherViolations: 0,
    };
  }

  initialize(candidateName, position) {
    this.candidateName = candidateName;
    this.position = position;
    this.startTime = new Date();
    this.currentScore = this.initialScore;
    this.violations = [];

    this.updateScoreDisplay();
    console.log(`Integrity scoring initialized for ${candidateName}`);
  }

  recordViolation(violationType, details = null) {
    const violation = {
      id: Date.now() + Math.random(),
      type: violationType,
      timestamp: new Date(),
      details: details,
      pointsDeducted: this.violationWeights[violationType] || 5,
    };

    this.violations.push(violation);
    this.currentScore = Math.max(
      0,
      this.currentScore - violation.pointsDeducted
    );

    // Update breakdown counters
    this.updateViolationBreakdown(violationType);

    // Update display
    this.updateScoreDisplay();

    console.log(
      `Violation recorded: ${violationType}, Score: ${this.currentScore}`
    );
  }

  updateViolationBreakdown(violationType) {
    switch (violationType) {
      case "focus_lost":
        this.scoreBreakdown.focusViolations++;
        break;
      case "object_detected":
        this.scoreBreakdown.objectViolations++;
        break;
      case "face_absent":
      case "multiple_faces":
        this.scoreBreakdown.presenceViolations++;
        break;
      default:
        this.scoreBreakdown.otherViolations++;
    }
  }

  updateScoreDisplay() {
    // Update main score circle
    const scoreElement = document.getElementById("integrityScore");
    const scoreCircle = scoreElement.parentElement;

    scoreElement.textContent = this.currentScore;

    // Update circle color based on score
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

    // Update breakdown counters
    document.getElementById("focusViolations").textContent =
      this.scoreBreakdown.focusViolations;
    document.getElementById("objectViolations").textContent =
      this.scoreBreakdown.objectViolations;

    // Calculate and display absence duration
    const absenceDuration = this.calculateAbsenceDuration();
    document.getElementById(
      "absenceDuration"
    ).textContent = `${absenceDuration}s`;
  }

  calculateAbsenceDuration() {
    return (
      this.violations
        .filter((v) => v.type === "face_absent")
        .reduce((total, violation) => {
          return total + (violation.details || 10); // Default 10 seconds if no details
        }, 0) / 1000
    ); // Convert to seconds
  }

  finalizeSession() {
    this.endTime = new Date();
    this.updateScoreDisplay();

    console.log(`Session finalized. Final score: ${this.currentScore}`);
  }

  generateReport() {
    const duration = this.endTime
      ? this.formatDuration(this.endTime - this.startTime)
      : "Session in progress";

    const report = {
      candidateName: this.candidateName,
      position: this.position,
      startTime: this.startTime
        ? this.startTime.toLocaleString()
        : "Not started",
      endTime: this.endTime ? this.endTime.toLocaleString() : "Not finished",
      duration: duration,
      initialScore: this.initialScore,
      finalScore: this.currentScore,
      totalViolations: this.violations.length,
      focusViolations: this.scoreBreakdown.focusViolations,
      objectViolations: this.scoreBreakdown.objectViolations,
      presenceViolations: this.scoreBreakdown.presenceViolations,
      absenceDuration: this.calculateAbsenceDuration(),
      violations: this.violations.map((v) => ({
        type: v.type,
        timestamp: v.timestamp.toLocaleString(),
        pointsDeducted: v.pointsDeducted,
        details: v.details,
      })),
      recommendation: this.getRecommendation(),
    };

    return report;
  }

  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
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

  getRecommendation() {
    if (this.currentScore >= 90) {
      return "Excellent - No significant integrity concerns detected.";
    } else if (this.currentScore >= 80) {
      return "Good - Minor issues detected, generally acceptable behavior.";
    } else if (this.currentScore >= 70) {
      return "Fair - Some concerning behaviors detected, may require review.";
    } else if (this.currentScore >= 60) {
      return "Poor - Multiple violations detected, interview integrity questionable.";
    } else {
      return "Critical - Severe violations detected, interview results unreliable.";
    }
  }

  // Get violation summary by type
  getViolationSummary() {
    const summary = {};

    this.violations.forEach((violation) => {
      if (!summary[violation.type]) {
        summary[violation.type] = {
          count: 0,
          totalPoints: 0,
          details: [],
        };
      }

      summary[violation.type].count++;
      summary[violation.type].totalPoints += violation.pointsDeducted;
      summary[violation.type].details.push(violation.details);
    });

    return summary;
  }

  // Reset scoring for new session
  reset() {
    this.candidateName = "";
    this.position = "";
    this.startTime = null;
    this.endTime = null;
    this.violations = [];
    this.currentScore = this.initialScore;
    this.scoreBreakdown = {
      focusViolations: 0,
      objectViolations: 0,
      presenceViolations: 0,
      otherViolations: 0,
    };

    this.updateScoreDisplay();
  }
}
