import { createClient } from "next-sanity"
import { apiVersion, dataset, projectId } from "@/sanity/env"
import { cachedClient } from "@/sanity/lib/client"
import { DEFAULT_STORE_SETTINGS, STORE_SETTINGS_QUERY, mergeStoreSettings, type StoreSettings } from "@/lib/store-settings"

const writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token: process.env.SANITY_API_TOKEN })
let seedAttempted = false

/** Crea "Ajustes de la tienda" con los valores actuales la primera vez, para que el admin los vea y edite. */
async function ensureStoreSettings() {
  if (seedAttempted || !process.env.SANITY_API_TOKEN) return
  seedAttempted = true
  const d = DEFAULT_STORE_SETTINGS
  const links = (arr: typeof d.interestLinks, prefix: string) => arr.map((l, i) => ({ _key: `${prefix}${i}`, _type: "menuLink", ...l }))
  await writeClient
    .createIfNotExists({
      _id: "storeSettings",
      _type: "storeSettings",
      codMin: d.codMin,
      codMax: d.codMax,
      interestLinks: links(d.interestLinks, "i"),
      aboutLinks: links(d.aboutLinks, "a"),
      aiEnabled: d.aiEnabled,
      aiWelcome: d.aiWelcome,
      aiSuggestions: d.aiSuggestions,
      showCommercialCollections: d.showCommercialCollections,
      showWhatsappCheckout: d.showWhatsappCheckout,
      showAddedBubble: d.showAddedBubble,
    })
    .catch((e) => console.error("[ajustes de la tienda] No se pudo crear el documento:", e))
}

export async function getStoreSettings(opts: { fresh?: boolean } = {}): Promise<StoreSettings> {
  await ensureStoreSettings()
  try {
    const doc = opts.fresh ? await writeClient.fetch(STORE_SETTINGS_QUERY) : await cachedClient.fetch(STORE_SETTINGS_QUERY)
    return mergeStoreSettings(doc)
  } catch {
    return DEFAULT_STORE_SETTINGS
  }
}
