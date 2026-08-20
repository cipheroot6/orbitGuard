"use client"

import { useState } from "react"
import { Rocket, Sparkles, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"

export default function MissionsPage() {
  const [missionName, setMissionName] = useState("")
  const [missionType, setMissionType] = useState("CAPTURE")
  const [simulating, setSimulating] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSimulate = async () => {
    if (!missionName) return
    setSimulating(true)
    setSuccess(false)
    
    // Mock simulation delay
    setTimeout(() => {
      setSimulating(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 2500)
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <PageHeader 
        title="Mission Simulator" 
        description="Plan Active Debris Removal (ADR) missions using generative AI." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 p-8 space-y-6">
          <h2 className="text-2xl font-bold">New Mission</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Mission Name</label>
            <input 
              type="text" 
              className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={missionName}
              onChange={(e) => setMissionName(e.target.value)}
              placeholder="e.g. Operation ClearSky"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Mission Type</label>
            <select 
              className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
              value={missionType}
              onChange={(e) => setMissionType(e.target.value)}
            >
              <option value="CAPTURE">Capture & Deorbit</option>
              <option value="DEORBIT">Deorbit Assist (Laser)</option>
              <option value="NUDGE">Nudge (Collision Avoidance)</option>
            </select>
          </div>

          <Button 
            onClick={handleSimulate}
            disabled={!missionName}
            loading={simulating}
            success={success}
            loadingText="Simulating via AI..."
            successText="Simulation Ready"
            icon={<Sparkles className="w-5 h-5 text-blue-200" />}
            className="w-full mt-4"
          >
            Simulate Mission
          </Button>
        </Card>

        <Card className="md:col-span-2 bg-gradient-to-br from-white/5 to-white/0 p-8 flex items-center justify-center text-center">
          {success ? (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-2xl mb-3 text-white">Simulation Successful</h3>
              <p className="text-white/60 max-w-md mx-auto leading-relaxed">
                Mission <strong>{missionName}</strong> has been processed by Gemma3. The full delta-v budget and risk reduction assessment is now stored in your logs.
              </p>
            </div>
          ) : (
            <div>
              <Rocket className="mx-auto h-16 w-16 text-white/20 mb-6" />
              <h3 className="font-bold text-2xl mb-3 text-white/50">No active simulation</h3>
              <p className="text-white/40 max-w-md mx-auto leading-relaxed">
                Configure a mission on the left and hit simulate to generate AI-driven launch windows, delta-v budgets, and risk assessments.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
