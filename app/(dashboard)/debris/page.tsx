export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"
import { RiskBadge } from "@/components/ui/RiskBadge"

export default async function DebrisCatalogPage() {
  const debrisList = await db
    .select({
      debris: debrisObjects,
      risk: riskAssessments,
    })
    .from(debrisObjects)
    .leftJoin(riskAssessments, eq(riskAssessments.debrisId, debrisObjects.id))
    .orderBy(desc(riskAssessments.riskScore))
    .limit(100)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <PageHeader 
        title="Debris Catalog" 
        description="Listing of all tracked objects (Top 100 shown for performance)." 
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/40 text-white/70 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">NORAD ID</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Risk Score</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {debrisList.map((row) => (
                <tr key={row.debris.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 font-medium text-white/90">{row.debris.noradId}</td>
                  <td className="px-6 py-4 text-white/80">{row.debris.name}</td>
                  <td className="px-6 py-4 text-white/60">{row.debris.objectType}</td>
                  <td className="px-6 py-4 text-white/80">{row.risk?.riskScore?.toFixed(1) || "N/A"}</td>
                  <td className="px-6 py-4">
                    <RiskBadge level={row.risk?.riskLevel || "LOW"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
