// Configuration for different environments
const CONFIG = {
  // Automatically detect the API base URL
  API_BASE_URL:
    window.location.hostname === "localhost"
      ? "http://localhost:5001" // Local development
      : window.location.origin, // Production (same domain)

  // API endpoints
  ENDPOINTS: {
    START_SESSION: "/api/sessions/start",
    END_SESSION: "/api/sessions/{sessionId}/end",
    LOG_EVENT: "/api/sessions/{sessionId}/events",
  },
};

// Helper function to get full API URL
function getApiUrl(endpoint, params = {}) {
  let url = CONFIG.API_BASE_URL + endpoint;

  // Replace URL parameters
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`{${key}}`, value);
  }

  return url;
}

console.log("🔧 API Configuration:", CONFIG);
