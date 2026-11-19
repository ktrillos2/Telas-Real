"use client"

import { useEffect, useState } from "react"
import { DEFAULT_VOLUME_SETTINGS, type PriceListRow, type VolumeSettings } from "@/lib/volume-pricing"

type Data = { rows: PriceListRow[]; settings: VolumeSettings }
let cache: Data | null = null
let pending: Promise<Data> | null = null

function load(): Promise<Data> {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = fetch("/api/volume-pricing")
      .then((r) => r.json())
      .then((d) => (cache = { rows: d?.rows || [], settings: d?.settings || DEFAULT_VOLUME_SETTINGS }))
      .catch(() => ({ rows: [], settings: { ...DEFAULT_VOLUME_SETTINGS, enabled: false } }))
  }
  return pending
}

/** Lista de precios por volumen (una sola descarga por visita). */
export function useVolumePricing(): Data {
  const [data, setData] = useState<Data>(cache || { rows: [], settings: { ...DEFAULT_VOLUME_SETTINGS, enabled: false } })
  useEffect(() => {
    let alive = true
    load().then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [])
  return data
}
