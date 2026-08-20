"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  loading?: boolean
  success?: boolean
  successText?: string
  loadingText?: string
  icon?: React.ReactNode
}

export function Button({
  className,
  variant = "primary",
  loading = false,
  success = false,
  successText = "Success",
  loadingText = "Loading...",
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 px-6 shrink-0"
  
  const variants = {
    primary: "focus:ring-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500",
    secondary: "focus:ring-white/50 bg-white/10 text-white hover:bg-white/20",
    outline: "focus:ring-white/50 border border-white/10 bg-transparent text-white hover:bg-white/5",
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || loading || success}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : success ? (
        <CheckCircle2 className="mr-2 h-5 w-5 text-green-300" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {loading ? loadingText : success ? successText : children}
    </button>
  )
}
