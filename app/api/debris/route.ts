import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { eq, desc, inArray } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const riskFilter = searchParams.get("risk") as string | null
  const limit = parseInt(searchParams.get("limit") ?? "5000")

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
