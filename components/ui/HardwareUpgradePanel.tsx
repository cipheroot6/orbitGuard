"use client"

import { useState } from "react"
import { Cpu, CheckCircle2, Radar, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

export function HardwareUpgradePanel() {
  const [upgrading, setUpgrading] = useState(false)
  const [isUpgraded, setIsUpgraded] = useState(false)

  const handleUpgrade = () => {
    if (isUpgraded) return
    setUpgrading(true)
    
    // Simulate upgrade delay
    setTimeout(() => {
      setUpgrading(false)
      setIsUpgraded(true)
    }, 2500)
  }

  return (
    <Card className="p-6 h-full flex flex-col bg-black/60 backdrop-blur-xl border-white/10 relative overflow-hidden">
      {/* Ambient background for the card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-blue-400" />
        Sensor Upgrades
      </h2>
      <p className="text-sm text-white/60 mb-6">
        Enhance telescope networks to detect smaller orbital debris.
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="p-4 border border-white/10 rounded-xl bg-white/5 relative">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">
            Current Capability
          </div>
          <div className="text-lg font-bold flex items-center justify-between">
            {isUpgraded ? (
              <span className="text-green-400">Micro-debris (&gt; 5cm)</span>
            ) : (
              <span className="text-white/90">Standard (&gt; 10cm)</span>
            )}
            <Radar className={`w-5 h-5 ${isUpgraded ? 'text-green-400' : 'text-white/40'}`} />
          </div>
        </div>

        {isUpgraded && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-3 text-green-400">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block mb-1">Upgrade Complete</span>
                Successfully detected and mapped ~1,500 new micro-debris fragments across the orbital plane.
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpgrade}
          disabled={isUpgraded || upgrading}
          className={`w-full h-12 text-sm font-semibold transition-all ${
            isUpgraded 
              ? 'bg-white/5 text-white/50 border border-white/10 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
          }`}
        >
          {upgrading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Re-calibrating Sensors...
            </span>
          ) : isUpgraded ? (
            "Network Fully Upgraded"
          ) : (
            "Upgrade Telescope Network"
          )}
        </Button>
      </div>
    </Card>
  )
}
