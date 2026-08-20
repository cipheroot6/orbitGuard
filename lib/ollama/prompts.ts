export function buildDebrisAnalysisPrompt(debris: {
  name: string
  noradId: number
  objectType: string
  apogeeKm: number | null
  perigeeKm: number | null
  inclinationDeg: number | null
  riskScore: number
  riskLevel: string
  collisionProbability: number | null
  nearbyObjects: number
}): string {
  return `You are an orbital debris analyst. Analyze this space object and provide a concise risk assessment.

Object: ${debris.name} (NORAD ID: ${debris.noradId})
Type: ${debris.objectType}
Orbit: ${debris.perigeeKm ?? "?"}km × ${debris.apogeeKm ?? "?"}km, ${debris.inclinationDeg ?? "?"}° inclination
Risk Score: ${debris.riskScore}/100 (${debris.riskLevel})
Collision Probability: ${debris.collisionProbability?.toExponential(2) ?? "unknown"}
Nearby Objects within 25km: ${debris.nearbyObjects}

Provide:
1. A 2-sentence summary of why this object is or isn't a concern
2. The primary risk factors
3. Recommended monitoring cadence
4. Whether active debris removal should be considered

Keep your response under 200 words. Use technical but accessible language.`
}

export function buildMissionSimulationPrompt(mission: {
  targetObjects: Array<{
    name: string
    noradId: number
    apogeeKm: number | null
    perigeeKm: number | null
    objectType: string
    riskScore: number
  }>
  missionType: string
}): string {
  const targets = mission.targetObjects
    .map(
      (o) =>
        `- ${o.name} (NORAD ${o.noradId}): ${o.objectType}, orbit ${o.perigeeKm ?? "?"}×${o.apogeeKm ?? "?"}km, risk ${o.riskScore}/100`
    )
    .join("\n")

  return `You are a mission planning specialist for orbital debris removal. Plan a ${mission.missionType} mission for the following targets:

${targets}

Provide:
1. Mission feasibility assessment
2. Recommended launch window considerations
3. Estimated delta-v budget (in m/s)
4. Target sequencing recommendation (most cost-effective order)
5. Expected risk reduction after mission completion
6. Key technical challenges

Keep your response under 300 words. Be specific and quantitative where possible.`
}
