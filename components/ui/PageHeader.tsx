import * as React from "react"
import { cn } from "@/lib/utils"

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 pb-1">
        {title}
      </h1>
      <p className="text-white/60 mt-2 text-lg">
        {description}
      </p>
    </div>
  )
}
