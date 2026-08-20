// Earth radius in km — used for all orbital calculations
export const EARTH_RADIUS_KM = 6371

// Three.js Earth sphere radius in scene units — TLE positions are scaled to this
export const EARTH_RADIUS_SCENE = 1

// Scale factor: 1 scene unit = EARTH_RADIUS_KM km
export const KM_TO_SCENE = EARTH_RADIUS_SCENE / EARTH_RADIUS_KM

// Risk thresholds — collision probability cutoffs
export const RISK_THRESHOLDS = {
  LOW: 1e-6,       // < 1 in 1,000,000
  MEDIUM: 1e-5,    // < 1 in 100,000
  HIGH: 1e-4,      // < 1 in 10,000
  CRITICAL: 1e-3,  // >= 1 in 1,000
} as const

// Miss distance alert thresholds in km
export const MISS_DISTANCE_THRESHOLDS = {
  WARNING: 5,   // > 5 km — no action needed
  WATCH: 1,     // 1–5 km — monitor closely
  ALERT: 0.2,   // < 200m — immediate attention
} as const

// Space-Track base URL
export const SPACE_TRACK_BASE = "https://www.space-track.org"

// Ollama Cloud model to use
export const OLLAMA_MODEL = "gemma3:27b"

// How many debris objects to propagate per render frame (perf limit)
export const MAX_PROPAGATE_PER_FRAME = 500

// TLE sync schedule — how often to pull fresh data from Space-Track
export const TLE_SYNC_INTERVAL_HOURS = 6
