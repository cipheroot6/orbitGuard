import { NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

export async function GET() {
  try {
    const topRisky = await db
      .select({
        id: debrisObjects.id,
        noradId: debrisObjects.noradId,
        name: debrisObjects.name,
        objectType: debrisObjects.objectType,
        apogeeKm: debrisObjects.apogeeKm,
        perigeeKm: debrisObjects.perigeeKm,
        inclinationDeg: debrisObjects.inclinationDeg,
        riskScore: riskAssessments.riskScore,
        riskLevel: riskAssessments.riskLevel,
        collisionProbability: riskAssessments.collisionProbability,
        nearbyObjects: riskAssessments.nearbyObjectCount,
      })
      .from(debrisObjects)
      .innerJoin(riskAssessments, eq(debrisObjects.id, riskAssessments.debrisId))
      .orderBy(desc(riskAssessments.riskScore))
      .limit(10)

    return NextResponse.json(topRisky)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch top risks" }, { status: 500 })
  }
}
