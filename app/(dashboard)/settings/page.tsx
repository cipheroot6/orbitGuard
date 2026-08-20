"use client"

import { useState } from "react"
import { RefreshCcw, Database, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch("/api/tle/sync", { method: "POST" })
      const data = await res.json()
      setSyncResult(data)
    } catch (err) {
      console.error(err)
      setSyncResult({ ok: false, error: "Failed to connect to sync endpoint" })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-white">
      <PageHeader 
        title="Settings" 
        description="Manage Space-Track orbital telemetry synchronization." 
      />

      <div className="space-y-8">
        {/* Space-Track Integration */}
        <Card className="overflow-hidden transition-all hover:bg-white/[0.07]">
          <div className="p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold">Space-Track Telemetry</h2>
            </div>
            <p className="text-sm text-white/60">
              Sync Two-Line Elements (TLEs) from the US Space Command database.
            </p>
          </div>
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-base font-semibold">Manual Sync</div>
              <p className="text-sm text-white/50 mt-1 max-w-md leading-relaxed">
                Fetches the latest 5,000 active objects. Takes ~60 seconds to process. Please avoid spamming this to prevent rate-limiting.
              </p>
            </div>
            <Button
              onClick={handleSync}
              loading={syncing}
              success={syncResult?.ok}
              loadingText="Syncing Data..."
              successText="Sync Complete"
              icon={<RefreshCcw className="w-5 h-5" />}
            >
              Sync Now
            </Button>
          </div>
          {syncResult && (
            <div className="px-6 pb-6">
              <div className={`p-4 text-sm font-medium rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${syncResult.ok ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                {syncResult.ok ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Successfully fetched and updated {syncResult.fetched} objects in {Math.round(syncResult.durationMs / 1000)}s.
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    Sync failed: {syncResult.error}
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
