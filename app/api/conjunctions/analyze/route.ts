import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments, conjunctionEvents } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { screenConjunctions } from "@/lib/orbital/conjunction"

export async function POST(req: NextRequest) {
  try {
    // 1. Fetch Top 100 riskiest objects
    const topRisky = await db
      .select({
        id: debrisObjects.id,
        noradId: debrisObjects.noradId,
        tleLine1: debrisObjects.tleLine1,
        tleLine2: debrisObjects.tleLine2,
        periodMinutes: debrisObjects.periodMinutes,
      })
      .from(debrisObjects)
      .innerJoin(riskAssessments, eq(debrisObjects.id, riskAssessments.debrisId))
      .orderBy(desc(riskAssessments.riskScore))
      .limit(100)

    // 2. Format for physics engine
    const trackableObjects = topRisky.map(obj => ({
      noradId: obj.noradId,
      tleLine1: obj.tleLine1,
      tleLine2: obj.tleLine2,
      periodMinutes: obj.periodMinutes,
    }))

    // 3. Screen for conjunctions over next 24 hours
    // Threshold is 5km by default in the constants
    const detectedEvents = await screenConjunctions(trackableObjects, 24, 5.0)

    // 4. Wipe old unresolved conjunctions to prevent duplicates/stale data
    await db.delete(conjunctionEvents).where(eq(conjunctionEvents.isResolved, false))

    // 5. Insert new ones
    if (detectedEvents.length > 0) {
      // Map noradId back to DB UUIDs
      const noradToId = new Map(topRisky.map(r => [r.noradId, r.id]))

      const toInsert = detectedEvents.map(event => ({
        object1Id: noradToId.get(event.object1NoradId)!,
        object2Id: noradToId.get(event.object2NoradId)!,
        timeOfClosestApproach: event.timeOfClosestApproach,
        missDistanceKm: event.missDistanceKm,
        relativeSpeedKms: event.relativeSpeedKms,
        collisionProbability: event.collisionProbability,
        severity: event.severity as any,
        isResolved: false,
      }))

      await db.insert(conjunctionEvents).values(toInsert)
    }

    return NextResponse.json({ 
      screenedPairs: (trackableObjects.length * (trackableObjects.length - 1)) / 2,
      conjunctionsFound: detectedEvents.length 
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze conjunctions"
    console.error("Conjunction Analysis Error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
