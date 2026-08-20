import * as satellite from "satellite.js"
import { KM_TO_SCENE } from "@/lib/constants"
import type { OrbitalPosition } from "@/types"

export interface TLEPair {
  line1: string
  line2: string
}

// Parse a TLE pair into a satellite record (done once per object)
export function parseTLE(tle: TLEPair) {
  return satellite.twoline2satrec(tle.line1, tle.line2)
}

// Get the ECI position of an object at a specific time
export function propagate(
  satrec: satellite.SatRec,
  date: Date
): OrbitalPosition | null {
  const result = satellite.propagate(satrec, date)

  // satellite.js returns false if propagation fails (decayed orbit etc.)
  if (!result || !result.position || typeof result.position === "boolean") return null

  const pos = result.position as satellite.EciVec3<number>

  return {
    x: pos.x * KM_TO_SCENE,
    y: pos.z * KM_TO_SCENE, // Three.js Y = ECI Z (up axis swap)
    z: -pos.y * KM_TO_SCENE,
    timestamp: date,
  }
}

// Generate an orbit trace — N positions equally spaced over one orbital period
export function generateOrbitTrace(
  tle: TLEPair,
  periodMinutes: number,
  steps = 120
): OrbitalPosition[] {
  const satrec = parseTLE(tle)
  const now = new Date()
  const positions: OrbitalPosition[] = []
  const stepMs = (periodMinutes * 60 * 1000) / steps

  for (let i = 0; i < steps; i++) {
    const date = new Date(now.getTime() + i * stepMs)
    const pos = propagate(satrec, date)
    if (pos) positions.push(pos)
  }

  return positions
}

// Batch propagate many objects to current time
export function propagateMany(
  objects: Array<{ noradId: number; tleLine1: string; tleLine2: string }>
): Map<number, OrbitalPosition> {
  const now = new Date()
  const result = new Map<number, OrbitalPosition>()

  for (const obj of objects) {
    const satrec = parseTLE({ line1: obj.tleLine1, line2: obj.tleLine2 })
    const pos = propagate(satrec, now)
    if (pos) result.set(obj.noradId, pos)
  }

  return result
}
