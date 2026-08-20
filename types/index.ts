export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
export type ObjectType = "DEBRIS" | "PAYLOAD" | "ROCKET BODY" | "UNKNOWN"
export type RcsSize = "SMALL" | "MEDIUM" | "LARGE"
export type MissionType = "CAPTURE" | "DEORBIT" | "NUDGE"
export type MissionStatus = "draft" | "simulated" | "planned"
export type ConjunctionSeverity = "WARNING" | "WATCH" | "ALERT"

export interface TLERecord {
  OBJECT_NAME: string
  OBJECT_ID: string
  NORAD_CAT_ID: number
  OBJECT_TYPE: ObjectType
  CLASSIFICATION_TYPE: string
  TLE_LINE1: string
  TLE_LINE2: string
  COUNTRY_CODE: string
  LAUNCH_DATE: string
  DECAY_DATE: string | null
  PERIOD: number
  INCLINATION: number
  APOGEE: number
  PERIGEE: number
  RCS_SIZE: RcsSize | null
}

export interface OrbitalPosition {
  x: number
  y: number
  z: number
  timestamp: Date
}

export interface ConjunctionData {
  object1NoradId: number
  object2NoradId: number
  timeOfClosestApproach: Date
  missDistanceKm: number
  relativeSpeedKms: number
  collisionProbability: number
  severity: ConjunctionSeverity
}
