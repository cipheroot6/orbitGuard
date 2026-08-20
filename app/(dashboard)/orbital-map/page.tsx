"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import RiskLegend from "@/components/visualization/RiskLegend"

// Dynamically import Three.js scene so it only runs on the client
const OrbitalScene = dynamic(
  () => import("@/components/visualization/OrbitalScene"),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-black/90 text-white">Loading Orbital Scene...</div> }
)

export default function OrbitalMapPage() {
  const [debris, setDebris] = useState([])
  const [selectedNoradId, setSelectedNoradId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/debris?limit=5000")
        const data = await res.json()
        
        // Transform for the 3D scene
        const sceneData = data.map((d: any) => ({
          noradId: d.debris.noradId,
          tleLine1: d.debris.tleLine1,
          tleLine2: d.debris.tleLine2,
          periodMinutes: d.debris.periodMinutes,
          riskLevel: d.risk?.riskLevel || "LOW",
        }))
        
        setDebris(sceneData)
      } catch (err) {
        console.error("Failed to load debris", err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        {!loading && (
          <OrbitalScene
            debris={debris}
            selectedNoradId={selectedNoradId}
            onSelect={setSelectedNoradId}
          />
        )}
      </div>

      {/* Overlays */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-white text-xl font-bold drop-shadow-md">Live Orbital Map</h2>
        <p className="text-white/70 text-sm drop-shadow-md">
          {loading ? "Loading telemetry..." : `Tracking ${debris.length} objects in real-time`}
        </p>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <RiskLegend />
      </div>
      
      {/* Interaction Panel */}
      <div className="absolute top-4 right-4 z-10 w-80 bg-background/90 backdrop-blur-md border rounded-xl shadow-2xl p-4 flex flex-col gap-4">
        <h3 className="font-semibold border-b pb-2">Analysis Panel</h3>
        <p className="text-sm text-muted-foreground">
          Drag to rotate Earth. Scroll to zoom.
        </p>
        
        {/* Placeholder for selected object data */}
        {selectedNoradId ? (
          <div className="p-3 bg-accent rounded-lg border text-sm">
            Selected NORAD ID: {selectedNoradId}
            <div className="mt-2 text-xs text-muted-foreground">
              (Interactive selection coming soon in UI update)
            </div>
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg border border-dashed text-sm text-muted-foreground text-center">
            No object selected
          </div>
        )}
      </div>
    </div>
  )
}
