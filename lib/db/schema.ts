import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  timestamp,
  date,
  boolean,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const riskLevelEnum = pgEnum("risk_level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const objectTypeEnum = pgEnum("object_type", ["DEBRIS", "PAYLOAD", "ROCKET BODY", "UNKNOWN"])
export const rcsSizeEnum = pgEnum("rcs_size", ["SMALL", "MEDIUM", "LARGE"])
export const missionTypeEnum = pgEnum("mission_type", ["CAPTURE", "DEORBIT", "NUDGE"])
export const missionStatusEnum = pgEnum("mission_status", ["draft", "simulated", "planned"])
export const severityEnum = pgEnum("severity", ["WARNING", "WATCH", "ALERT"])

// All tracked objects — debris, payloads, rocket bodies
export const debrisObjects = pgTable("debris_objects", {
  id: uuid("id").primaryKey().defaultRandom(),
  noradId: integer("norad_id").notNull().unique(),
  name: text("name").notNull(),
  internationalDesignator: text("international_designator"),
  tleLine1: text("tle_line1").notNull(),
  tleLine2: text("tle_line2").notNull(),
  objectType: objectTypeEnum("object_type").default("UNKNOWN"),
  country: text("country"),
  launchDate: date("launch_date"),
  decayDate: date("decay_date"),
  periodMinutes: real("period_minutes"),
  inclinationDeg: real("inclination_deg"),
  apogeeKm: integer("apogee_km"),
  perigeeKm: integer("perigee_km"),
  rcsSize: rcsSizeEnum("rcs_size"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  noradIdx: index("debris_norad_idx").on(table.noradId),
  typeIdx: index("debris_type_idx").on(table.objectType),
}))

// Risk assessment computed for each object periodically
export const riskAssessments = pgTable("risk_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  debrisId: uuid("debris_id")
    .notNull()
    .references(() => debrisObjects.id, { onDelete: "cascade" }),
  riskScore: real("risk_score").notNull(),         // 0–100 composite score
  riskLevel: riskLevelEnum("risk_level").notNull(),
  collisionProbability: real("collision_probability"), // 0–1
  closestApproachKm: real("closest_approach_km"),
  closestApproachTime: timestamp("closest_approach_time"),
  relativeVelocityKms: real("relative_velocity_kms"),
  nearbyObjectCount: integer("nearby_object_count").default(0),
  assessedAt: timestamp("assessed_at").defaultNow(),
}, (table) => ({
  debrisIdx: index("risk_debris_idx").on(table.debrisId),
  levelIdx: index("risk_level_idx").on(table.riskLevel),
}))

// Conjunction events — pairs of objects that will pass dangerously close
export const conjunctionEvents = pgTable("conjunction_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  object1Id: uuid("object1_id")
    .notNull()
    .references(() => debrisObjects.id, { onDelete: "cascade" }),
  object2Id: uuid("object2_id")
    .notNull()
    .references(() => debrisObjects.id, { onDelete: "cascade" }),
  timeOfClosestApproach: timestamp("time_of_closest_approach").notNull(),
  missDistanceKm: real("miss_distance_km").notNull(),
  relativeSpeedKms: real("relative_speed_kms"),
  collisionProbability: real("collision_probability"),
  severity: severityEnum("severity").notNull(),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tcaIdx: index("conjunction_tca_idx").on(table.timeOfClosestApproach),
  severityIdx: index("conjunction_severity_idx").on(table.severity),
}))

// Mission simulations — AI-assisted removal planning
export const missionSimulations = pgTable("mission_simulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  targetNoradIds: integer("target_norad_ids").array().notNull(),
  missionType: missionTypeEnum("mission_type").notNull(),
  estimatedDeltaVMs: real("estimated_delta_v_ms"),    // m/s — fuel cost proxy
  estimatedDurationDays: integer("estimated_duration_days"),
  estimatedRiskReductionPct: real("estimated_risk_reduction_pct"),
  aiInsights: text("ai_insights"),                    // Gemma3 analysis output
  launchWindowStart: timestamp("launch_window_start"),
  launchWindowEnd: timestamp("launch_window_end"),
  status: missionStatusEnum("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Sync log — tracks each TLE pull from Space-Track
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  objectsFetched: integer("objects_fetched"),
  objectsUpserted: integer("objects_upserted"),
  durationMs: integer("duration_ms"),
  error: text("error"),
  syncedAt: timestamp("synced_at").defaultNow(),
})

// Relations
export const debrisObjectsRelations = relations(debrisObjects, ({ many }) => ({
  riskAssessments: many(riskAssessments),
  conjunctionsAsObject1: many(conjunctionEvents, { relationName: "object1" }),
  conjunctionsAsObject2: many(conjunctionEvents, { relationName: "object2" }),
}))

export const riskAssessmentsRelations = relations(riskAssessments, ({ one }) => ({
  debris: one(debrisObjects, {
    fields: [riskAssessments.debrisId],
    references: [debrisObjects.id],
  }),
}))

export const conjunctionEventsRelations = relations(conjunctionEvents, ({ one }) => ({
  object1: one(debrisObjects, {
    fields: [conjunctionEvents.object1Id],
    references: [debrisObjects.id],
    relationName: "object1",
  }),
  object2: one(debrisObjects, {
    fields: [conjunctionEvents.object2Id],
    references: [debrisObjects.id],
    relationName: "object2",
  }),
}))
