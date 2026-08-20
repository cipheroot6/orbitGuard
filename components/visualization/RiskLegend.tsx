export default function RiskLegend() {
  const levels = [
    { label: "Critical", color: "bg-red-500" },
    { label: "High", color: "bg-orange-500" },
    { label: "Medium", color: "bg-yellow-400" },
    { label: "Low", color: "bg-green-400" },
  ]

  return (
    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
      <h3 className="font-semibold text-foreground mb-1 border-b pb-1">Risk Level</h3>
      {levels.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${l.color}`} />
          {l.label}
        </div>
      ))}
    </div>
  )
}
