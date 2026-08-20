export const dynamic = "force-dynamic"
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
