"use client"

import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"

export function EventTagBadge() {
  const { data } = useHomeDataContext()
  const eventSettings = data?.eventSettings

  if (!eventSettings?.isActive || !eventSettings?.eventTag) return null

  const now = new Date()
  const start = eventSettings.startDate ? new Date(eventSettings.startDate) : null
  const end = eventSettings.endDate ? new Date(eventSettings.endDate) : null

  if (start && now < start) return null
  if (end && now > end) return null

  return (
    <span className="bg-[#E50914] text-white text-[11px] px-3 py-1 rounded-full font-bold shadow-md uppercase tracking-wide">
      {eventSettings.eventTag}
    </span>
  )
}
