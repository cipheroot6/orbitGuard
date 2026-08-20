# OrbitGuard — End to End Build Plan

Everything you need to build OrbitGuard from zero to deployed. Follow steps in order — each phase depends on the previous one.

---

## Phase 0 — Prerequisites

Before touching code make sure you have accounts on all these services. All free unless noted.

- GitHub account (you already have one)
- Vercel account — vercel.com, sign up with GitHub
- Supabase account — supabase.com, sign up with GitHub
- Space-Track account — space-track.org, register with email (free, requires brief justification)
- Ollama account — ollama.com, sign up to get a Cloud API key

Local machine requirements:
- Node.js 20+ installed
- Git configured
- Arch Linux (your primary OS) — all commands are bash

---

## Phase 1 — Project Setup

### 1.1 Bootstrap Next.js

```bash
npx create-next-app@latest orbitguard
```

When prompted:
- TypeScript → Yes
- ESLint → Yes
- Tailwind CSS → Yes
- src/ directory → No
- App Router → Yes
- Import alias → Yes, keep default `@/*`

```bash
cd orbitguard
```

### 1.2 Install all dependencies upfront

```bash
npm install three @types/three
npm install satellite.js
npm install @supabase/supabase-js
npm install drizzle-orm postgres
npm install drizzle-zod zod
npm install date-fns
npm install lucide-react
npm install clsx tailwind-merge
npm install --save-dev drizzle-kit
npm install --save-dev @types/node
```

`three` is the raw Three.js library. `satellite.js` handles SGP4/SDP4 orbit propagation from TLE data — this is the math that converts raw TLE strings into real-world positions.

### 1.3 Set up folder structure

```bash
mkdir -p app/\(dashboard\)/dashboard
mkdir -p app/\(dashboard\)/orbital-map
mkdir -p app/\(dashboard\)/debris
mkdir -p app/\(dashboard\)/risk-analysis
mkdir -p app/\(dashboard\)/missions
mkdir -p app/\(dashboard\)/settings
mkdir -p app/api/tle/sync
mkdir -p app/api/tle/objects
mkdir -p app/api/debris
mkdir -p app/api/risk
mkdir -p app/api/conjunctions
mkdir -p app/api/ai/analyze
mkdir -p app/api/ai/simulate
mkdir -p app/api/cron/tle-sync
mkdir -p components/visualization
mkdir -p components/debris
mkdir -p components/risk
mkdir -p components/missions
mkdir -p components/shared
mkdir -p lib/db/migrations
mkdir -p lib/db/queries
mkdir -p lib/space-track
mkdir -p lib/orbital
mkdir -p lib/ollama
mkdir -p lib/validations
mkdir -p hooks
mkdir -p types
mkdir -p public/textures
```

### 1.4 Create .env.local

```bash
touch .env.local .env.example
```

Paste this into `.env.local` and fill values as you complete each phase:

```env
# Supabase
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Space-Track
SPACE_TRACK_USERNAME=
SPACE_TRACK_PASSWORD=

# Ollama Cloud
OLLAMA_API_KEY=
OLLAMA_BASE_URL=https://ollama.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Copy the same into `.env.example` but leave all values empty. Commit `.env.example`, never commit `.env.local`.

Add to `.gitignore`:
```
.env.local
.env*.local
```

### 1.5 Create lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKm(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km.toFixed(1)} km`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatProbability(p: number): string {
  if (p < 0.0001) return `< 0.01%`
  return `${(p * 100).toFixed(4)}%`
}
```

### 1.6 Create types/index.ts

```typescript
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
```

### 1.7 Create lib/constants.ts

```typescript
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
```

---

## Phase 2 — Database

### 2.1 Create Supabase project

- Go to supabase.com → New Project → name it `orbitguard`
- Choose a strong database password — save it, you will not see it again
- Wait for the project to provision (about 1 minute)
- Go to Settings → Database → Connection String → URI mode
- Copy the connection string and paste into `DATABASE_URL` in `.env.local`
- Go to Settings → API
  - Copy the Project URL → paste into `NEXT_PUBLIC_SUPABASE_URL`
  - Copy the `anon` public key → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Copy the `service_role` secret key → paste into `SUPABASE_SERVICE_ROLE_KEY`

The connection string looks like:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2.2 Create Drizzle config

Create `drizzle.config.ts` in root:

```typescript
import type { Config } from "drizzle-kit"
import { config } from "dotenv"

config({ path: ".env.local" })

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
```

### 2.3 Create the full schema

Create `lib/db/schema.ts`:

```typescript
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
```

### 2.4 Create Drizzle client

Create `lib/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// Disable prefetch for Supabase's transaction mode pooler
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
```

### 2.5 Run migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Verify tables were created in Supabase → Table Editor. You should see: `debris_objects`, `risk_assessments`, `conjunction_events`, `mission_simulations`, `sync_logs`.

### 2.6 Create database queries

Create `lib/db/queries/debris.ts`:

```typescript
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { desc, eq, and, gte, lte, inArray } from "drizzle-orm"
import type { RiskLevel } from "@/types"

export async function getAllDebris(limit = 1000) {
  return db
    .select()
    .from(debrisObjects)
    .limit(limit)
    .orderBy(debrisObjects.noradId)
}

export async function getDebrisByNoradId(noradId: number) {
  const result = await db
    .select()
    .from(debrisObjects)
    .where(eq(debrisObjects.noradId, noradId))
    .limit(1)
  return result[0] ?? null
}

export async function getHighRiskDebris() {
  return db
    .select({
      debris: debrisObjects,
      risk: riskAssessments,
    })
    .from(debrisObjects)
    .innerJoin(riskAssessments, eq(riskAssessments.debrisId, debrisObjects.id))
    .where(inArray(riskAssessments.riskLevel, ["HIGH", "CRITICAL"]))
    .orderBy(desc(riskAssessments.riskScore))
}

export async function upsertDebrisObjects(records: typeof debrisObjects.$inferInsert[]) {
  return db
    .insert(debrisObjects)
    .values(records)
    .onConflictDoUpdate({
      target: debrisObjects.noradId,
      set: {
        name: sql`excluded.name`,
        tleLine1: sql`excluded.tle_line1`,
        tleLine2: sql`excluded.tle_line2`,
        lastUpdated: new Date(),
      },
    })
}
```

Create `lib/db/queries/conjunctions.ts`:

```typescript
import { db } from "@/lib/db"
import { conjunctionEvents, debrisObjects } from "@/lib/db/schema"
import { desc, eq, and, gte } from "drizzle-orm"

export async function getActiveConjunctions() {
  return db
    .select()
    .from(conjunctionEvents)
    .where(
      and(
        eq(conjunctionEvents.isResolved, false),
        gte(conjunctionEvents.timeOfClosestApproach, new Date())
      )
    )
    .orderBy(desc(conjunctionEvents.collisionProbability))
}

export async function insertConjunctionEvent(
  data: typeof conjunctionEvents.$inferInsert
) {
  return db.insert(conjunctionEvents).values(data)
}
```

---

## Phase 3 — Space-Track TLE Integration

### 3.1 Create Space-Track client

Space-Track uses session cookie authentication. You POST your credentials to get a cookie, then use that cookie on subsequent requests.

Create `lib/space-track/client.ts`:

```typescript
const BASE_URL = "https://www.space-track.org"

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE_URL}/ajaxauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      identity: process.env.SPACE_TRACK_USERNAME!,
      password: process.env.SPACE_TRACK_PASSWORD!,
    }),
  })

  if (!res.ok) throw new Error(`Space-Track login failed: ${res.status}`)

  const cookies = res.headers.get("set-cookie")
  if (!cookies) throw new Error("No session cookie returned from Space-Track")

  // Extract the chocolatechip session cookie
  const match = cookies.match(/chocolatechip=[^;]+/)
  if (!match) throw new Error("Session cookie not found in response")

  return match[0]
}

// Fetch all active debris, payloads, and rocket bodies (LEO + MEO + GEO)
// Filtered to: decayed = false, limit 5000 by default
export async function fetchTLEData(limit = 5000) {
  const cookie = await getSessionCookie()

  const query =
    `/basicspacedata/query/class/gp/DECAY_DATE/null-val` +
    `/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/limit/${limit}` +
    `/format/json`

  const res = await fetch(`${BASE_URL}${query}`, {
    headers: { Cookie: cookie },
  })

  if (!res.ok) throw new Error(`Space-Track query failed: ${res.status}`)

  return res.json() as Promise<import("@/types").TLERecord[]>
}

// Fetch a single object by NORAD ID
export async function fetchObjectByNoradId(noradId: number) {
  const cookie = await getSessionCookie()

  const res = await fetch(
    `${BASE_URL}/basicspacedata/query/class/gp/NORAD_CAT_ID/${noradId}/format/json`,
    { headers: { Cookie: cookie } }
  )

  if (!res.ok) throw new Error(`Failed to fetch NORAD ${noradId}`)
  const data = await res.json()
  return data[0] ?? null
}
```

### 3.2 Create TLE sync route handler

This is the server-side route that fetches from Space-Track and upserts into Supabase. It is called both by the cron job and on-demand from the settings page.

Create `app/api/tle/sync/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { fetchTLEData } from "@/lib/space-track/client"
import { db } from "@/lib/db"
import { debrisObjects, syncLogs } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function POST() {
  const start = Date.now()

  try {
    const records = await fetchTLEData(5000)

    const toUpsert = records.map((r) => ({
      noradId: r.NORAD_CAT_ID,
      name: r.OBJECT_NAME.trim(),
      internationalDesignator: r.OBJECT_ID || null,
      tleLine1: r.TLE_LINE1,
      tleLine2: r.TLE_LINE2,
      objectType: r.OBJECT_TYPE as any,
      country: r.COUNTRY_CODE || null,
      launchDate: r.LAUNCH_DATE || null,
      decayDate: r.DECAY_DATE || null,
      periodMinutes: r.PERIOD ?? null,
      inclinationDeg: r.INCLINATION ?? null,
      apogeeKm: r.APOGEE ?? null,
      perigeeKm: r.PERIGEE ?? null,
      rcsSize: (r.RCS_SIZE as any) ?? null,
      lastUpdated: new Date(),
    }))

    // Batch upsert in chunks of 500 to stay within Supabase limits
    const chunkSize = 500
    for (let i = 0; i < toUpsert.length; i += chunkSize) {
      const chunk = toUpsert.slice(i, i + chunkSize)
      await db
        .insert(debrisObjects)
        .values(chunk)
        .onConflictDoUpdate({
          target: debrisObjects.noradId,
          set: {
            name: sql`excluded.name`,
            tleLine1: sql`excluded.tle_line1`,
            tleLine2: sql`excluded.tle_line2`,
            periodMinutes: sql`excluded.period_minutes`,
            inclinationDeg: sql`excluded.inclination_deg`,
            apogeeKm: sql`excluded.apogee_km`,
            perigeeKm: sql`excluded.perigee_km`,
            lastUpdated: sql`now()`,
          },
        })
    }

    await db.insert(syncLogs).values({
      objectsFetched: records.length,
      objectsUpserted: toUpsert.length,
      durationMs: Date.now() - start,
    })

    return NextResponse.json({
      ok: true,
      fetched: records.length,
      durationMs: Date.now() - start,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await db.insert(syncLogs).values({ error: message })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
```

### 3.3 Create cron route for scheduled sync

Create `app/api/cron/tle-sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"

// Vercel Cron calls this on a schedule defined in vercel.json
// Protected by the CRON_SECRET Vercel sets automatically
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tle/sync`, {
    method: "POST",
  })

  const data = await res.json()
  return NextResponse.json(data)
}
```

Create `vercel.json` in root:

```json
{
  "crons": [
    {
      "path": "/api/cron/tle-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This syncs TLE data every 6 hours automatically on Vercel.

---

## Phase 4 — Orbital Mechanics Engine

### 4.1 Create the orbit propagator

This wraps `satellite.js` to give you clean TypeScript functions. All positions are returned as ECI (Earth-Centered Inertial) coordinates and then converted to scene units for Three.js.

Create `lib/orbital/propagator.ts`:

```typescript
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
  if (!result.position || typeof result.position === "boolean") return null

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
```

### 4.2 Create the risk scoring engine

Create `lib/orbital/risk-engine.ts`:

```typescript
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
```

### 4.3 Create the conjunction analyzer

Conjunction analysis finds pairs of objects whose orbits pass dangerously close within a time window.

Create `lib/orbital/conjunction.ts`:

```typescript
import { parseTLE, propagate } from "./propagator"
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
      const pos = propagate(satrec, date)
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
```

---

## Phase 5 — Three.js 3D Visualization

### 5.1 Download Earth textures

Download a free Earth texture and put it in `public/textures/`:

```bash
# Download a free 4K Earth texture (NASA Blue Marble)
curl -o public/textures/earth.jpg \
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg"
```

If that URL doesn't work, use any 2:1 aspect ratio equirectangular Earth map. Name it `earth.jpg`.

### 5.2 Create the OrbitalScene component

This is the core Three.js component. It renders Earth, all debris objects as colored points, and selected orbit traces as lines. It is a client component — Three.js cannot run on the server.

Create `components/visualization/OrbitalScene.tsx`:

```typescript
"use client"

import { useEffect, useRef, useCallback } from "react"
import * as THREE from "three"
import { propagateMany, generateOrbitTrace, parseTLE } from "@/lib/orbital/propagator"
import { EARTH_RADIUS_SCENE } from "@/lib/constants"
import type { RiskLevel } from "@/types"

interface DebrisPoint {
  noradId: number
  tleLine1: string
  tleLine2: string
  periodMinutes: number | null
  riskLevel: RiskLevel
}

interface OrbitalSceneProps {
  debris: DebrisPoint[]
  selectedNoradId: number | null
  onSelect: (noradId: number | null) => void
}

const RISK_COLORS: Record<RiskLevel, number> = {
  LOW: 0x00ff88,
  MEDIUM: 0xffcc00,
  HIGH: 0xff6600,
  CRITICAL: 0xff0000,
}

export default function OrbitalScene({
  debris,
  selectedNoradId,
  onSelect,
}: OrbitalSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animFrameRef = useRef<number>(0)
  const orbitLineRef = useRef<THREE.Line | null>(null)
  const isDragging = useRef(false)
  const prevMouse = useRef({ x: 0, y: 0 })
  const cameraAngle = useRef({ theta: 0, phi: Math.PI / 4 })
  const cameraRadius = useRef(3.5)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000008)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.01,
      100
    )
    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Starfield
    const starGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(3000)
    for (let i = 0; i < 3000; i++) {
      starPositions[i] = (Math.random() - 0.5) * 80
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })
    )
    scene.add(stars)

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE, 64, 64)
    const earthTexture = new THREE.TextureLoader().load("/textures/earth.jpg")
    const earthMat = new THREE.MeshPhongMaterial({ map: earthTexture })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.015, 64, 64)
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x0044aa,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide,
    })
    scene.add(new THREE.Mesh(atmoGeo, atmoMat))

    // Lighting
    scene.add(new THREE.AmbientLight(0x333355, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(5, 3, 5)
    scene.add(sun)

    // Debris points
    const positions = propagateMany(debris)
    const geo = new THREE.BufferGeometry()
    const posArray = new Float32Array(debris.length * 3)
    const colorArray = new Float32Array(debris.length * 3)

    debris.forEach((obj, i) => {
      const pos = positions.get(obj.noradId)
      if (pos) {
        posArray[i * 3] = pos.x
        posArray[i * 3 + 1] = pos.y
        posArray[i * 3 + 2] = pos.z
      }
      const color = new THREE.Color(RISK_COLORS[obj.riskLevel])
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    })

    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))

    const pointsMat = new THREE.PointsMaterial({
      size: 0.004,
      vertexColors: true,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geo, pointsMat)
    points.name = "debris-cloud"
    scene.add(points)

    // Animation loop — rotates Earth slowly
    const clock = new THREE.Clock()
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate)
      earth.rotation.y += 0.0002
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [debris])

  // Draw orbit trace for selected object
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove previous orbit line
    if (orbitLineRef.current) {
      scene.remove(orbitLineRef.current)
      orbitLineRef.current = null
    }

    if (!selectedNoradId) return

    const obj = debris.find((d) => d.noradId === selectedNoradId)
    if (!obj || !obj.periodMinutes) return

    const trace = generateOrbitTrace(
      { line1: obj.tleLine1, line2: obj.tleLine2 },
      obj.periodMinutes
    )

    const traceGeo = new THREE.BufferGeometry()
    const tracePoints = trace.map((p) => new THREE.Vector3(p.x, p.y, p.z))
    traceGeo.setFromPoints(tracePoints)

    const traceMat = new THREE.LineBasicMaterial({
      color: RISK_COLORS[obj.riskLevel],
      transparent: true,
      opacity: 0.6,
    })

    const line = new THREE.Line(traceGeo, traceMat)
    scene.add(line)
    orbitLineRef.current = line
  }, [selectedNoradId, debris])

  // Mouse drag to orbit camera
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    prevMouse.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return
    const dx = e.clientX - prevMouse.current.x
    const dy = e.clientY - prevMouse.current.y
    prevMouse.current = { x: e.clientX, y: e.clientY }
    cameraAngle.current.theta -= dx * 0.005
    cameraAngle.current.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, cameraAngle.current.phi - dy * 0.005)
    )
    const r = cameraRadius.current
    const { theta, phi } = cameraAngle.current
    cameraRef.current.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    cameraRef.current.lookAt(0, 0, 0)
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return
    cameraRadius.current = Math.max(1.5, Math.min(8, cameraRadius.current + e.deltaY * 0.005))
    const r = cameraRadius.current
    const { theta, phi } = cameraAngle.current
    cameraRef.current.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    cameraRef.current.lookAt(0, 0, 0)
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onWheel={onWheel}
    />
  )
}
```

### 5.3 Create the visualization legend

Create `components/visualization/RiskLegend.tsx`:

```typescript
export default function RiskLegend() {
  const levels = [
    { label: "Critical", color: "bg-red-500" },
    { label: "High", color: "bg-orange-500" },
    { label: "Medium", color: "bg-yellow-400" },
    { label: "Low", color: "bg-green-400" },
  ]

  return (
    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {levels.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${l.color}`} />
          {l.label}
        </div>
      ))}
    </div>
  )
}
```

---

## Phase 6 — AI Layer (Ollama Cloud + Gemma3)

### 6.1 Create the Ollama Cloud client

Ollama Cloud exposes an OpenAI-compatible API at `https://ollama.com/v1/`. You authenticate with a Bearer token from ollama.com/settings.

Create `lib/ollama/client.ts`:

```typescript
const BASE_URL = process.env.OLLAMA_BASE_URL ?? "https://ollama.com"
const MODEL = "gemma3:27b"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function chatCompletion(
  messages: Message[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Ollama Cloud error ${res.status}: ${error}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content ?? ""
}
```

### 6.2 Create prompt templates

Create `lib/ollama/prompts.ts`:

```typescript
export function buildDebrisAnalysisPrompt(debris: {
  name: string
  noradId: number
  objectType: string
  apogeeKm: number | null
  perigeeKm: number | null
  inclinationDeg: number | null
  riskScore: number
  riskLevel: string
  collisionProbability: number | null
  nearbyObjects: number
}): string {
  return `You are an orbital debris analyst. Analyze this space object and provide a concise risk assessment.

Object: ${debris.name} (NORAD ID: ${debris.noradId})
Type: ${debris.objectType}
Orbit: ${debris.perigeeKm ?? "?"}km × ${debris.apogeeKm ?? "?"}km, ${debris.inclinationDeg ?? "?"}° inclination
Risk Score: ${debris.riskScore}/100 (${debris.riskLevel})
Collision Probability: ${debris.collisionProbability?.toExponential(2) ?? "unknown"}
Nearby Objects within 25km: ${debris.nearbyObjects}

Provide:
1. A 2-sentence summary of why this object is or isn't a concern
2. The primary risk factors
3. Recommended monitoring cadence
4. Whether active debris removal should be considered

Keep your response under 200 words. Use technical but accessible language.`
}

export function buildMissionSimulationPrompt(mission: {
  targetObjects: Array<{
    name: string
    noradId: number
    apogeeKm: number | null
    perigeeKm: number | null
    objectType: string
    riskScore: number
  }>
  missionType: string
}): string {
  const targets = mission.targetObjects
    .map(
      (o) =>
        `- ${o.name} (NORAD ${o.noradId}): ${o.objectType}, orbit ${o.perigeeKm ?? "?"}×${o.apogeeKm ?? "?"}km, risk ${o.riskScore}/100`
    )
    .join("\n")

  return `You are a mission planning specialist for orbital debris removal. Plan a ${mission.missionType} mission for the following targets:

${targets}

Provide:
1. Mission feasibility assessment
2. Recommended launch window considerations
3. Estimated delta-v budget (in m/s)
4. Target sequencing recommendation (most cost-effective order)
5. Expected risk reduction after mission completion
6. Key technical challenges

Keep your response under 300 words. Be specific and quantitative where possible.`
}
```

### 6.3 Create AI analysis route

Create `app/api/ai/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { chatCompletion } from "@/lib/ollama/client"
import { buildDebrisAnalysisPrompt } from "@/lib/ollama/prompts"
import { z } from "zod"

const BodySchema = z.object({
  name: z.string(),
  noradId: z.number(),
  objectType: z.string(),
  apogeeKm: z.number().nullable(),
  perigeeKm: z.number().nullable(),
  inclinationDeg: z.number().nullable(),
  riskScore: z.number(),
  riskLevel: z.string(),
  collisionProbability: z.number().nullable(),
  nearbyObjects: z.number(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = BodySchema.parse(body)

    const prompt = buildDebrisAnalysisPrompt(parsed)
    const analysis = await chatCompletion([{ role: "user", content: prompt }])

    return NextResponse.json({ analysis })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

### 6.4 Create mission simulation route

Create `app/api/ai/simulate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { chatCompletion } from "@/lib/ollama/client"
import { buildMissionSimulationPrompt } from "@/lib/ollama/prompts"
import { db } from "@/lib/db"
import { missionSimulations } from "@/lib/db/schema"
import { z } from "zod"

const BodySchema = z.object({
  name: z.string(),
  missionType: z.enum(["CAPTURE", "DEORBIT", "NUDGE"]),
  targetObjects: z.array(
    z.object({
      name: z.string(),
      noradId: z.number(),
      apogeeKm: z.number().nullable(),
      perigeeKm: z.number().nullable(),
      objectType: z.string(),
      riskScore: z.number(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = BodySchema.parse(body)

    const prompt = buildMissionSimulationPrompt(parsed)
    const aiInsights = await chatCompletion([{ role: "user", content: prompt }], {
      maxTokens: 512,
    })

    const [simulation] = await db
      .insert(missionSimulations)
      .values({
        name: parsed.name,
        missionType: parsed.missionType,
        targetNoradIds: parsed.targetObjects.map((t) => t.noradId),
        aiInsights,
        status: "simulated",
      })
      .returning()

    return NextResponse.json({ simulation, aiInsights })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Simulation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

---

## Phase 7 — Risk API Routes

### 7.1 Create debris list route

Create `app/api/debris/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { eq, desc, inArray } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const riskFilter = searchParams.get("risk") as string | null
  const limit = parseInt(searchParams.get("limit") ?? "500")

  try {
    let query = db
      .select({
        debris: debrisObjects,
        risk: riskAssessments,
      })
      .from(debrisObjects)
      .leftJoin(riskAssessments, eq(riskAssessments.debrisId, debrisObjects.id))
      .limit(limit)
      .$dynamic()

    if (riskFilter) {
      const levels = riskFilter.split(",") as any[]
      query = query.where(inArray(riskAssessments.riskLevel, levels))
    }

    const data = await query.orderBy(desc(riskAssessments.riskScore))
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch debris" }, { status: 500 })
  }
}
```

### 7.2 Create risk assessment route

Create `app/api/risk/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { computeRiskScore, probabilityToRiskLevel } from "@/lib/orbital/risk-engine"
import { eq } from "drizzle-orm"

// POST /api/risk — recomputes risk scores for all debris in DB
export async function POST(req: NextRequest) {
  const allDebris = await db.select().from(debrisObjects).limit(5000)

  const toInsert = allDebris.map((d) => {
    const score = computeRiskScore({
      noradId: d.noradId,
      apogeeKm: d.apogeeKm,
      perigeeKm: d.perigeeKm,
      inclinationDeg: d.inclinationDeg,
      rcsSize: d.rcsSize,
      objectType: d.objectType,
    })
    const riskLevel = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW"

    return {
      debrisId: d.id,
      riskScore: score,
      riskLevel: riskLevel as any,
      assessedAt: new Date(),
    }
  })

  // Upsert all risk assessments
  await db
    .insert(riskAssessments)
    .values(toInsert)
    .onConflictDoUpdate({
      target: riskAssessments.debrisId,
      set: {
        riskScore: sql`excluded.risk_score`,
        riskLevel: sql`excluded.risk_level`,
        assessedAt: sql`now()`,
      },
    })

  return NextResponse.json({ updated: toInsert.length })
}
```

### 7.3 Create conjunctions route

Create `app/api/conjunctions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getActiveConjunctions } from "@/lib/db/queries/conjunctions"

export async function GET() {
  try {
    const conjunctions = await getActiveConjunctions()
    return NextResponse.json(conjunctions)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch conjunctions" }, { status: 500 })
  }
}
```

---

## Phase 8 — UI Pages

### 8.1 Root layout

Create `app/layout.tsx`:

```typescript
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OrbitGuard — Orbital Debris Intelligence",
  description: "AI-powered orbital debris detection, risk analysis, and mission planning",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
```

### 8.2 Dashboard sidebar layout

Create `app/(dashboard)/layout.tsx`:

```typescript
import Link from "next/link"
import { Globe, AlertTriangle, Satellite, Rocket, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Globe },
  { href: "/orbital-map", label: "Orbital Map", icon: Satellite },
  { href: "/debris", label: "Debris Catalog", icon: Globe },
  { href: "/risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="font-semibold text-sm tracking-wide">OrbitGuard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Debris Intelligence</p>
        </div>
        <nav className="flex-1 p-2 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors"
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

### 8.3 Dashboard overview page

`app/(dashboard)/dashboard/page.tsx`:
- Server component — fetches summary stats from DB
- Cards: total tracked objects, critical risk count, active conjunctions, last sync time
- Quick list of top 5 critical objects
- "Sync TLE Data" button calling `POST /api/tle/sync`
- Link to full orbital map

### 8.4 Orbital map page

`app/(dashboard)/orbital-map/page.tsx`:
- Fetches all debris with risk levels from `GET /api/debris`
- Full-screen `OrbitalScene` component (client)
- Right sidebar: selected object details + AI analysis panel
- `RiskLegend` overlay in bottom-left
- Filter controls: by risk level, by object type, by orbit regime

### 8.5 Debris catalog page

`app/(dashboard)/debris/page.tsx`:
- Server component — fetches paginated debris list with risk scores
- Sortable table: name, NORAD ID, type, orbit, risk score, risk level badge
- Filter row: risk level, object type, orbit regime, search by name
- Row click → navigates to risk analysis for that object

### 8.6 Risk analysis page

`app/(dashboard)/risk-analysis/page.tsx`:
- Summary: count by risk level with color-coded bars
- Active conjunctions table: object pairs, miss distance, TCA, severity badge
- "Run Risk Assessment" button calling `POST /api/risk`
- Per-object AI analysis: select any CRITICAL object → shows Gemma3 analysis in a panel

### 8.7 Mission simulator page

`app/(dashboard)/missions/page.tsx`:
- Left panel: select target debris objects from a list (multiselect)
- Mission type selector: CAPTURE / DEORBIT / NUDGE
- Mission name input
- "Simulate Mission" button → calls `POST /api/ai/simulate` → streams back AI response
- Results panel: AI insights, estimated delta-v, risk reduction estimate
- Saved simulations list below with status badges

### 8.8 Settings page

`app/(dashboard)/settings/page.tsx`:
- Space-Track connection status (last sync time, object count)
- Manual sync button → `POST /api/tle/sync`
- Ollama Cloud connection status (model name, API key masked)
- Risk threshold configuration — sliders for MEDIUM/HIGH/CRITICAL cutoffs
- Sync log table: last 10 syncs with object counts and errors

---

## Phase 9 — Deployment

### 9.1 Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/orbitguard
git push -u origin main
```

### 9.2 Deploy to Vercel

- Go to vercel.com → New Project → Import your repo
- Vercel auto-detects Next.js — no config needed
- Add all environment variables from `.env.local` in the Vercel dashboard
- Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Deploy

### 9.3 Set environment variables in Vercel

Go to Vercel → Project → Settings → Environment Variables. Add every variable from `.env.local`. The `CRON_SECRET` is auto-generated by Vercel when you have a `vercel.json` cron config — no need to set it manually.

### 9.4 Trigger initial TLE sync

Once deployed, visit:
```
POST https://yourapp.vercel.app/api/tle/sync
```

Or trigger it from the Settings page in the app. This populates your Supabase database with current orbital data.

### 9.5 Final checks before going live

- [ ] All env vars set in Vercel
- [ ] Supabase database reachable from production
- [ ] Space-Track login succeeds from production (test via settings page sync)
- [ ] Ollama Cloud API responding (test AI analysis on one object)
- [ ] TLE sync populates `debris_objects` table
- [ ] Risk assessment runs and populates `risk_assessments`
- [ ] Three.js scene loads without errors in browser console
- [ ] Earth texture loads correctly (`/textures/earth.jpg`)
- [ ] Debris points appear in correct orbital positions
- [ ] Orbit trace renders when an object is selected
- [ ] Camera drag and zoom work on desktop
- [ ] Conjunction detection returns results for at least some object pairs
- [ ] Mission simulator returns AI response from Gemma3
- [ ] Saved missions appear in mission list with `simulated` status
- [ ] Cron job scheduled in Vercel (check Functions → Cron Jobs tab)
- [ ] Sync log table recording each sync run
- [ ] Error boundaries on all route segments
- [ ] Loading states on all data-fetching pages
- [ ] Mobile responsive layout on dashboard and debris pages (map is desktop-only — add a notice)

---

## Build Order Summary

| Phase | What | Why first |
|---|---|---|
| 0 | Prerequisites | Accounts and access credentials |
| 1 | Project setup | Foundation — env, types, folder structure |
| 2 | Database schema | Everything else reads and writes data |
| 3 | Space-Track integration | Need real TLE data before any orbital math |
| 4 | Orbital mechanics engine | Risk scoring and conjunction analysis depend on propagation |
| 5 | Three.js visualization | Depends on propagator for debris positions |
| 6 | AI layer | Depends on debris data and risk scores being available |
| 7 | Risk API routes | Exposes DB and engine to the frontend |
| 8 | UI pages | Built on all the above — consumes every API route |
| 9 | Deployment | Ship once everything is working locally |

---

*Follow phases in order. Do not skip ahead. Each phase assumes the previous one is working.*
