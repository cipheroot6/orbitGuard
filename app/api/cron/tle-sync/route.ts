export const dynamic = "force-dynamic"
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
