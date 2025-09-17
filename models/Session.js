const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
  candidateName: { type: String, required: true },
  interviewPosition: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  integrityScore: { type: Number, default: 100 },
  focusViolations: { type: Number, default: 0 },
  suspiciousEvents: [{ type: String }],
});

module.exports = mongoose.model("Session", SessionSchema);
