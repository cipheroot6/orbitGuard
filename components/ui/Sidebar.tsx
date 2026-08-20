"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, AlertTriangle, Satellite, Rocket, Settings, Hexagon } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Globe },
  { href: "/orbital-map", label: "Orbital Map", icon: Satellite },
  { href: "/debris", label: "Debris Catalog", icon: Globe },
  { href: "/risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 shadow-2xl z-20">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-wide text-white">OrbitGuard</h1>
          <p className="text-xs text-blue-400 font-medium mt-0.5 tracking-wider uppercase">Debris Intel</p>
        </div>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-3">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                isActive 
                  ? "text-white bg-white/10 shadow-inner" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              )}
              <item.icon 
                size={18} 
                className={cn(
                  "transition-colors",
                  isActive ? "text-blue-400" : "text-white/40 group-hover:text-blue-400/70"
                )} 
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
      
    </aside>
  )
}
