import { parseTLE, propagateSat } from "./propagator"
import { MISS_DISTANCE_THRESHOLDS, EARTH_RADIUS_KM } from "@/lib/constants"
import type { ConjunctionData, ConjunctionSeverity } from "@/types"

interface TrackableObject {
  noradId: number
  tleLine1: string
  tleLine2: string
  periodMinutes: number | null
}

// Euclidean distance between two ECI positions in scene units → convert back to km
function distanceKm(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  const sceneUnits = Math.sqrt(
    (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
  )
  return sceneUnits * EARTH_RADIUS_KM
}

function severityFromDistance(km: number): ConjunctionSeverity {
  if (km <= MISS_DISTANCE_THRESHOLDS.ALERT) return "ALERT"
  if (km <= MISS_DISTANCE_THRESHOLDS.WATCH) return "WATCH"
  return "WARNING"
}

// Screen a set of objects for close approaches over the next N hours
// Returns conjunction events where miss distance < thresholdKm
export async function screenConjunctions(
  objects: TrackableObject[],
  lookaheadHours = 24,
  thresholdKm = MISS_DISTANCE_THRESHOLDS.WARNING
): Promise<ConjunctionData[]> {
  const now = Date.now()
  const stepMs = 60 * 1000 // 1 minute steps
  const steps = (lookaheadHours * 60)
  const events: ConjunctionData[] = []

  // Pre-parse all TLEs
  const satrecs = objects.map((obj) => ({
    noradId: obj.noradId,
    satrec: parseTLE({ line1: obj.tleLine1, line2: obj.tleLine2 }),
  }))

  // For each time step, propagate all objects and check pairs
  // This is O(n²) — for large catalogs, spatial indexing is needed later
  for (let t = 0; t < steps; t++) {
    const date = new Date(now + t * stepMs)
    const positions = new Map<number, { x: number; y: number; z: number }>()

    for (const { noradId, satrec } of satrecs) {
      const pos = propagateSat(satrec, date)
      if (pos) positions.set(noradId, pos)
    }

    const ids = Array.from(positions.keys())
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const posA = positions.get(ids[i])!
        const posB = positions.get(ids[j])!
        const dist = distanceKm(posA, posB)

        if (dist < thresholdKm) {
          events.push({
            object1NoradId: ids[i],
            object2NoradId: ids[j],
            timeOfClosestApproach: date,
            missDistanceKm: dist,
            relativeSpeedKms: 0, // extend later with velocity subtraction
            collisionProbability: estimateCollisionProbability(dist),
            severity: severityFromDistance(dist),
          })
        }
      }
    }
  }

  return events
}

// Simplified Pc estimation — for production replace with Foster method
function estimateCollisionProbability(missDistanceKm: number): number {
  // Exponential decay model: Pc ≈ exp(-d/d0) where d0 ~ 0.1 km at 1e-4 level
  return Math.exp(-missDistanceKm / 0.1) * 1e-3
}
