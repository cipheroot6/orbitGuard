import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { computeRiskScore } from "@/lib/orbital/risk-engine"
import { eq, sql, inArray } from "drizzle-orm"

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

  if (toInsert.length > 0) {
    // Clear old assessments for the processed debris to avoid duplicate bloating and constraint issues
    const debrisIds = toInsert.map((t) => t.debrisId)
    
    // Delete in chunks to avoid parameter limits
    const deleteChunkSize = 1000
    for (let i = 0; i < debrisIds.length; i += deleteChunkSize) {
      const chunkIds = debrisIds.slice(i, i + deleteChunkSize)
      await db.delete(riskAssessments).where(inArray(riskAssessments.debrisId, chunkIds))
    }

    // Insert new assessments in chunks to avoid parameter limits (PostgreSQL max is 65535 parameters)
    const chunkSize = 1000
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      await db.insert(riskAssessments).values(chunk)
    }
  }

  return NextResponse.json({ updated: toInsert.length })
}
