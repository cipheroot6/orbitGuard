import { RISK_THRESHOLDS, EARTH_RADIUS_KM } from "@/lib/constants"
import type { RiskLevel } from "@/types"

interface DebrisForScoring {
  noradId: number
  apogeeKm: number | null
  perigeeKm: number | null
  inclinationDeg: number | null
  rcsSize: string | null
  objectType: string | null
}

// Classify orbit regime
export function getOrbitRegime(apogee: number, perigee: number): string {
  const altitude = (apogee + perigee) / 2
  if (altitude < 2000) return "LEO"
  if (altitude < 35786) return "MEO"
  if (altitude < 35900) return "GEO"
  return "HEO"
}

// Convert collision probability to risk level
export function probabilityToRiskLevel(probability: number): RiskLevel {
  if (probability >= RISK_THRESHOLDS.CRITICAL) return "CRITICAL"
  if (probability >= RISK_THRESHOLDS.HIGH) return "HIGH"
  if (probability >= RISK_THRESHOLDS.MEDIUM) return "MEDIUM"
  return "LOW"
}

// Composite risk score 0–100 based on multiple factors
// Higher = more dangerous
export function computeRiskScore(debris: DebrisForScoring): number {
  let score = 0

  // Factor 1: Orbit altitude — LEO is most congested
  const altitude = ((debris.apogeeKm ?? 0) + (debris.perigeeKm ?? 0)) / 2
  if (altitude < 600) score += 30
  else if (altitude < 1200) score += 25
  else if (altitude < 2000) score += 20
  else if (altitude < 36000) score += 10
  else score += 5

  // Factor 2: Physical size (radar cross-section as proxy)
  if (debris.rcsSize === "LARGE") score += 30
  else if (debris.rcsSize === "MEDIUM") score += 20
  else if (debris.rcsSize === "SMALL") score += 10
  else score += 15 // unknown size = moderate risk (assume non-trivial)

  // Factor 3: Object type — debris fragments are most dangerous
  if (debris.objectType === "DEBRIS") score += 25
  else if (debris.objectType === "ROCKET BODY") score += 20
  else if (debris.objectType === "PAYLOAD") score += 10
  else score += 15

  // Factor 4: Inclination — high inclination = crosses more orbital planes
  const inc = debris.inclinationDeg ?? 0
  if (inc > 80) score += 15
  else if (inc > 45) score += 10
  else score += 5

  return Math.min(score, 100)
}
