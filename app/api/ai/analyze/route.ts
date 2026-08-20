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
