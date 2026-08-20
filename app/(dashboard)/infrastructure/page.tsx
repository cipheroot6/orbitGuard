"use client"

import { PageHeader } from "@/components/ui/PageHeader"
import { HardwareUpgradePanel } from "@/components/ui/HardwareUpgradePanel"
import dynamic from "next/dynamic"

// Dynamically import map so Leaflet window is not required during SSR
const GroundStationMap = dynamic(
  () => import("@/components/ui/GroundStationMap"),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-black/40 rounded-xl border border-white/10 text-white/50">Initializing Satellite Uplink...</div> 
  }
)

export default function InfrastructurePage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <PageHeader 
        title="Global Infrastructure" 
        description="Monitor ISRO Ground Station uplinks and manage global telescope arrays." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="w-full h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
            <GroundStationMap />
          </div>
          <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
            <h3 className="font-semibold text-lg text-blue-400 mb-1">ISTRAC Headquarters</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              ISRO Telemetry, Tracking and Command Network (ISTRAC) in Bengaluru. 
              Primary node for deep space network and orbital debris tracking telemetry. 
              Coordinates: 13.0334° N, 77.5117° E
            </p>
          </div>
        </div>

        {/* Upgrades Section */}
        <div className="lg:col-span-1">
          <HardwareUpgradePanel />
        </div>
      </div>
    </div>
  )
}
