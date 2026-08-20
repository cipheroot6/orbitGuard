import Link from "next/link"
export const dynamic = "force-dynamic"
import { db } from "@/lib/db"
import { debrisObjects, riskAssessments, conjunctionEvents, syncLogs } from "@/lib/db/schema"
import { desc, eq, count, sql } from "drizzle-orm"
import { Globe, AlertTriangle, Satellite, Clock } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { PageHeader } from "@/components/ui/PageHeader"

export default async function DashboardOverview() {
  const [totalDebris] = await db.select({ value: count() }).from(debrisObjects)
  const [criticalRisk] = await db
    .select({ value: count() })
    .from(riskAssessments)
    .where(eq(riskAssessments.riskLevel, "CRITICAL"))
  const [activeConjunctions] = await db
    .select({ value: count() })
    .from(conjunctionEvents)
    .where(eq(conjunctionEvents.isResolved, false))
  
  const [lastSync] = await db
    .select()
    .from(syncLogs)
    .orderBy(desc(syncLogs.syncedAt))
    .limit(1)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 text-white">
      <PageHeader 
        title="OrbitGuard Dashboard" 
        description="Live overview of the orbital environment and active risks." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 text-white/70 font-medium mb-3">
            <Globe className="w-5 h-5 text-blue-400" />
            Tracked Objects
          </div>
          <div className="text-4xl font-bold">{totalDebris.value.toLocaleString()}</div>
        </Card>
        <Card className="p-6 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 text-white/70 font-medium mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Critical Risks
          </div>
          <div className="text-4xl font-bold text-red-400">{criticalRisk.value}</div>
        </Card>
        <Card className="p-6 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 text-white/70 font-medium mb-3">
            <Satellite className="w-5 h-5 text-orange-400" />
            Active Conjunctions
          </div>
          <div className="text-4xl font-bold text-orange-400">{activeConjunctions.value}</div>
        </Card>
        <Card className="p-6 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 text-white/70 font-medium mb-3">
            <Clock className="w-5 h-5 text-green-400" />
            Last Sync
          </div>
          <div className="text-xl font-semibold mt-1">
            {lastSync?.syncedAt ? new Date(lastSync.syncedAt).toLocaleString() : "Never"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Quick Actions</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Link 
              href="/orbital-map"
              className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:shadow-blue-500/30 h-12 px-6"
            >
              Open 3D Orbital Map
            </Link>
            <Link 
              href="/missions"
              className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 border border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 px-6"
            >
              Plan Debris Removal Mission
            </Link>
            <Link 
              href="/risk-analysis"
              className="w-full inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 border border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 px-6"
            >
              Run Risk Assessment
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
