// Event Logging System
class EventLogger {
  constructor() {
    this.events = [];
    this.maxEvents = 100; // Limit stored events to prevent memory issues
  }

  logEvent(message, type = "info") {
    const timestamp = new Date();
    const event = {
      id: Date.now() + Math.random(),
      timestamp: timestamp,
      timestampString: this.formatTimestamp(timestamp),
      message: message,
      type: type,
    };

    this.events.unshift(event); // Add to beginning of array

    // Limit array size
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    // Update UI
    this.updateEventsDisplay();

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  formatTimestamp(date) {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  updateEventsDisplay() {
    const eventsLog = document.getElementById("eventsLog");
    const maxDisplayEvents = 10; // Show only last 10 events in UI

    const recentEvents = this.events.slice(0, maxDisplayEvents);

    eventsLog.innerHTML = recentEvents
      .map(
        (event) => `
            <div class="event-item ${event.type}">
                <span class="timestamp">${event.timestampString}</span>
                <span class="message">${event.message}</span>
            </div>
        `
      )
      .join("");

    // Auto-scroll to top (newest events)
    eventsLog.scrollTop = 0;
  }

  getAllEvents() {
    return [...this.events]; // Return copy of events array
  }

  getEventsByType(type) {
    return this.events.filter((event) => event.type === type);
  }

  getEventsInTimeRange(startTime, endTime) {
    return this.events.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  clearEvents() {
    this.events = [];
    this.updateEventsDisplay();
  }

  exportEvents() {
    return {
      exportTime: new Date().toISOString(),
      totalEvents: this.events.length,
      events: this.events,
    };
  }

  // Get event statistics
  getEventStats() {
    const stats = {
      total: this.events.length,
      info: 0,
      warning: 0,
      danger: 0,
    };

    this.events.forEach((event) => {
      if (stats.hasOwnProperty(event.type)) {
        stats[event.type]++;
      }
    });

    return stats;
  }
}
