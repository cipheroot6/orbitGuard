import * as React from "react"
import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/types"

export function RiskBadge({ level, className }: { level: RiskLevel | string; className?: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    LOW: "bg-green-500/10 text-green-400 border-green-500/30",
  }

  return (
    <span
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border",
        styles[level] || styles.LOW,
        className
      )}
    >
      {level}
    </span>
  )
}
