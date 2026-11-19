"use client"

import { createContext, useContext, type ReactNode } from "react"
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/lib/store-settings"

const StoreSettingsContext = createContext<StoreSettings>(DEFAULT_STORE_SETTINGS)

export function StoreSettingsProvider({ value, children }: { value?: StoreSettings | null; children: ReactNode }) {
  return <StoreSettingsContext.Provider value={value || DEFAULT_STORE_SETTINGS}>{children}</StoreSettingsContext.Provider>
}

/** Ajustes de la tienda editables en Sanity (Elementos Globales → Ajustes de la tienda). */
export const useStoreSettings = () => useContext(StoreSettingsContext)
