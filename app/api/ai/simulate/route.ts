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
