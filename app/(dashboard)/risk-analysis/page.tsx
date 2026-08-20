"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, Search, BrainCircuit, Activity } from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
import { RiskBadge } from "@/components/ui/RiskBadge"
import Markdown from "react-markdown"

export default function RiskAnalysisPage() {
  const [running, setRunning] = useState(false)
  const [success, setSuccess] = useState(false)
  const [updatedStats, setUpdatedStats] = useState<{risk: number, conjunctions: number} | null>(null)

  const [conjunctions, setConjunctions] = useState<any[]>([])
  const [topRisks, setTopRisks] = useState<any[]>([])
  const [selectedDebris, setSelectedDebris] = useState<any | null>(null)
  
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [conjRes, riskRes] = await Promise.all([
        fetch("/api/conjunctions"),
        fetch("/api/risk/top")
      ])
      if (conjRes.ok) setConjunctions(await conjRes.json())
      if (riskRes.ok) {
        const risks = await riskRes.json()
        setTopRisks(risks)
        // Auto-select the first target to make it obvious
        if (risks.length > 0) {
          setSelectedDebris(risks[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const runRiskAssessment = async () => {
    setRunning(true)
    setSuccess(false)
    setUpdatedStats(null)
    try {
      // 1. Recompute all risks
      const riskRes = await fetch("/api/risk", { method: "POST" })
      const riskData = await riskRes.json()
      
      // 2. Screen for conjunctions (Top 100 objects)
      const conjRes = await fetch("/api/conjunctions/analyze", { method: "POST" })
      const conjData = await conjRes.json()

      setUpdatedStats({ risk: riskData.updated, conjunctions: conjData.conjunctionsFound })
      setSuccess(true)
      
      // Refresh UI data
      await fetchData()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setRunning(false)
    }
  }

  const runAiAnalysis = async () => {
    if (!selectedDebris) return
    setAiAnalyzing(true)
    setAiResult(null)
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedDebris.name,
          noradId: selectedDebris.noradId,
          objectType: selectedDebris.objectType,
          apogeeKm: selectedDebris.apogeeKm,
          perigeeKm: selectedDebris.perigeeKm,
          inclinationDeg: selectedDebris.inclinationDeg,
          riskScore: selectedDebris.riskScore,
          riskLevel: selectedDebris.riskLevel,
          collisionProbability: selectedDebris.collisionProbability,
          nearbyObjects: selectedDebris.nearbyObjects,
        })
      })
      const data = await res.json()
      if (data.analysis?.message?.content) {
        setAiResult(data.analysis.message.content)
      } else {
        setAiResult("Analysis failed. Please check backend connection.")
      }
    } catch (err) {
      console.error(err)
      setAiResult("Analysis encountered an error.")
    } finally {
      setAiAnalyzing(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Risk Analysis" 
          description="Detailed risk scores and active conjunction events." 
        />
        <Button
          onClick={runRiskAssessment}
          loading={running}
          success={success}
          loadingText="Analyzing Physics..."
          successText="Analysis Complete"
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          Run Risk Assessment
        </Button>
      </div>

      {updatedStats !== null && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Successfully evaluated {updatedStats.risk} objects and detected {updatedStats.conjunctions} active conjunctions.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CONJUNCTIONS CARD */}
        <Card className="p-6 flex flex-col h-[600px]">
          <h2 className="text-2xl font-bold mb-2">Conjunction Events</h2>
          <p className="text-sm text-white/60 mb-6">
            Close approaches expected within the next 24 hours.
          </p>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {conjunctions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center border-dashed border border-white/10 rounded-xl bg-black/20 p-10">
                <Activity className="w-10 h-10 text-green-400 mb-3" />
                <p className="text-white/80 font-medium">Clear Skies</p>
                <p className="text-sm text-white/40 mt-1">No active conjunctions detected.</p>
              </div>
            ) : (
              conjunctions.map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <RiskBadge level={c.severity} />
                    <span className="text-xs text-white/50 bg-black/40 px-2 py-1 rounded">
                      {c.missDistanceKm.toFixed(2)} km miss
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex-1">
                      <div className="font-bold text-blue-300">{c.object1Name}</div>
                      <div className="text-white/40 text-xs mt-0.5">NORAD {c.object1NoradId}</div>
                    </div>
                    <div className="text-red-400 font-bold shrink-0 text-lg">⚡</div>
                    <div className="flex-1 text-right">
                      <div className="font-bold text-orange-300">{c.object2Name}</div>
                      <div className="text-white/40 text-xs mt-0.5">NORAD {c.object2NoradId}</div>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-xs text-white/40 border-t border-white/5 pt-2">
                    TCA: {new Date(c.timeOfClosestApproach).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* AI INSIGHT CARD */}
        <Card className="p-6 flex flex-col h-[600px]">
          <h2 className="text-2xl font-bold mb-2">AI Risk Insight</h2>
          <p className="text-sm text-white/60 mb-6">
            Generate Gemma3 tactical breakdown for high-risk targets.
          </p>

          <div className="mb-6 space-y-3">
            <select 
              className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
              onChange={(e) => {
                const target = topRisks.find(r => r.noradId.toString() === e.target.value)
                setSelectedDebris(target)
                setAiResult(null)
              }}
              value={selectedDebris?.noradId || ""}
            >
              <option value="" disabled>Select target (Top 10 Riskiest)</option>
              {topRisks.map((r: any) => (
                <option key={r.noradId} value={r.noradId}>
                  [{Math.round(r.riskScore)}] {r.name} (NORAD: {r.noradId})
                </option>
              ))}
            </select>
            <Button 
              className="w-full" 
              onClick={runAiAnalysis} 
              disabled={!selectedDebris}
              loading={aiAnalyzing}
              loadingText="Gemma3 is analyzing..."
              icon={<BrainCircuit className="w-4 h-4" />}
            >
              Generate Insight
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl border border-white/5 p-4 text-sm text-white/80 leading-relaxed">
            {aiResult ? (
              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-blue-300">
                <Markdown>{aiResult}</Markdown>
              </div>
            ) : aiAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <BrainCircuit className="w-10 h-10 mb-3 animate-pulse text-blue-400" />
                <p>Processing trajectory data...</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <Search className="w-10 h-10 mb-3" />
                <p>Click "Generate Insight" to run Gemma3 analysis on the selected target.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
