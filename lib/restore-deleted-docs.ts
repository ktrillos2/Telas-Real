import { client } from "@/sanity/lib/client"
import { dataset, projectId, token } from "@/sanity/env"

/**
 * Recupera documentos únicos del admin que quedaron borrados (ej. "Gestión de Popups"): busca en el
 * historial de Sanity la última versión que existía y la vuelve a publicar. Corre en el servidor (usa
 * SANITY_API_TOKEN), una vez por proceso, y no toca nada si el documento ya existe.
 */
const HISTORY_API = "v2025-02-19"
const checked = new Set<string>()

async function history(path: string): Promise<Response> {
  return fetch(`https://${projectId}.api.sanity.io/${HISTORY_API}/data/history/${dataset}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
}

/** Últimas transacciones (más nuevas primero) de los ids dados. La respuesta viene en NDJSON. */
async function transactions(ids: string[]): Promise<Array<{ id: string; timestamp: string }>> {
  const res = await history(`transactions/${ids.join(",")}?excludeContent=true&reverse=true&limit=40`)
  if (!res.ok) throw new Error(`historial ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.text())
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .filter((t) => t?.id && t?.timestamp)
}

/** El documento tal como quedó justo después de una transacción (vacío si en ese momento no existía). */
async function versionAt(id: string, revision: string): Promise<any | null> {
  const res = await history(`documents/${id}?revision=${encodeURIComponent(revision)}`)
  if (!res.ok) return null
  const body = await res.json().catch(() => null)
  const doc = body?.documents?.[0]
  return doc && doc._type && !doc._deleted ? doc : null
}

export async function restoreDeletedSingleton(id: string, type: string): Promise<void> {
  if (!token || checked.has(id)) return
  checked.add(id)
  try {
    const writer = client.withConfig({ useCdn: false, perspective: "raw" })
    const exists = await writer.fetch<number>(`count(*[_id in [$id, "drafts." + $id]])`, { id })
    if (exists > 0) return

    const draftId = `drafts.${id}`
    for (const tx of await transactions([id, draftId])) {
      // Preferimos la versión publicada; si solo existía el borrador, se publica ese
      const doc = (await versionAt(id, tx.id)) || (await versionAt(draftId, tx.id))
      if (!doc || doc._type !== type) continue
      const { _rev, _updatedAt, _createdAt, _id, ...fields } = doc
      await writer.createOrReplace({ ...fields, _id: id, _type: type })
      console.log(`[admin] Documento "${id}" recuperado del historial (versión del ${tx.timestamp}).`)
      return
    }
    console.warn(`[admin] "${id}" no existe y el historial no tiene una versión para recuperar.`)
  } catch (error) {
    // No se reintenta en cada visita: vuelve a intentarlo con el siguiente despliegue
    console.error(`[admin] No se pudo recuperar "${id}":`, error)
  }
}
