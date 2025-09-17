const mongoose = require("mongoose");

const EventLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  eventType: { type: String, required: true },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("EventLog", EventLogSchema);
