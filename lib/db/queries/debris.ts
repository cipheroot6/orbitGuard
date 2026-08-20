import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { desc, eq, and, gte, lte, inArray, sql } from "drizzle-orm"
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
