"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, AlertTriangle, Satellite, Rocket, Settings, Hexagon, Menu, X, RadioTower } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Globe },
  { href: "/orbital-map", label: "Orbital Map", icon: Satellite },
  { href: "/debris", label: "Debris Catalog", icon: Globe },
  { href: "/risk-analysis", label: "Risk Analysis", icon: AlertTriangle },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/infrastructure", label: "Infrastructure", icon: RadioTower },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change in mobile
  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl shrink-0 z-30 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Hexagon className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-extrabold text-base tracking-wide text-white">OrbitGuard</h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-64 border-r border-white/10 bg-black/95 md:bg-black/40 backdrop-blur-xl flex flex-col shrink-0 shadow-2xl z-40 transform transition-transform duration-300 md:translate-x-0 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 hidden md:flex items-center gap-3">
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
                  "transition-colors shrink-0",
                  isActive ? "text-blue-400" : "text-white/40 group-hover:text-blue-400/70"
                )} 
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      
    </aside>

    {/* Mobile overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        onClick={() => setIsOpen(false)}
      />
    )}
    </>
  )
}
