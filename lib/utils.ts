import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKm(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km.toFixed(1)} km`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatProbability(p: number): string {
  if (p < 0.0001) return `< 0.01%`
  return `${(p * 100).toFixed(4)}%`
}
