// Centralized configuration for frontend-only build
// Set REACT_APP_API_BASE (preferred) in your environment to point to backend API root.
// Example (development): REACT_APP_API_BASE=http://localhost:5000
// If unset, relative paths will be used (works when frontend served by same domain as backend).
export const API_BASE = (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "");
