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
      launchDate: r.LAUNCH_DATE ? new Date(r.LAUNCH_DATE).toISOString().split('T')[0] : null,
      decayDate: r.DECAY_DATE ? new Date(r.DECAY_DATE).toISOString().split('T')[0] : null,
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
