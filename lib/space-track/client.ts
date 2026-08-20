const BASE_URL = "https://www.space-track.org"

async function getSessionCookie(): Promise<string> {
  const res = await fetch(`${BASE_URL}/ajaxauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      identity: process.env.SPACE_TRACK_USERNAME!,
      password: process.env.SPACE_TRACK_PASSWORD!,
    }),
  })

  if (!res.ok) throw new Error(`Space-Track login failed: ${res.status}`)

  const cookies = res.headers.get("set-cookie")
  if (!cookies) throw new Error("No session cookie returned from Space-Track")

  // Extract the chocolatechip session cookie
  const match = cookies.match(/chocolatechip=[^;]+/)
  if (!match) throw new Error("Session cookie not found in response")

  return match[0]
}

// Fetch all active debris, payloads, and rocket bodies (LEO + MEO + GEO)
// Filtered to: decayed = false, limit 5000 by default
export async function fetchTLEData(limit = 5000) {
  const cookie = await getSessionCookie()

  const query =
    `/basicspacedata/query/class/gp/DECAY_DATE/null-val` +
    `/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/limit/${limit}` +
    `/format/json`

  const res = await fetch(`${BASE_URL}${query}`, {
    headers: { Cookie: cookie },
  })

  if (!res.ok) throw new Error(`Space-Track query failed: ${res.status}`)

  return res.json() as Promise<import("@/types").TLERecord[]>
}

// Fetch a single object by NORAD ID
export async function fetchObjectByNoradId(noradId: number) {
  const cookie = await getSessionCookie()

  const res = await fetch(
    `${BASE_URL}/basicspacedata/query/class/gp/NORAD_CAT_ID/${noradId}/format/json`,
    { headers: { Cookie: cookie } }
  )

  if (!res.ok) throw new Error(`Failed to fetch NORAD ${noradId}`)
  const data = await res.json()
  return data[0] ?? null
}
