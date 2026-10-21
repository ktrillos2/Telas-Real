import { cleanSlug } from "@/lib/seo"
import { findUnifiedFabricConfig } from "@/lib/unified-fabrics"

/**
 * URL pública canónica de un producto. Las variantes de color de telas unificadas
 * se publican como /producto/<maestra>?color=<slug>. Usable en servidor y cliente.
 */
export function productPublicPath(rawSlug: string | null | undefined): string {
  const slug = cleanSlug(rawSlug)
  const unified = findUnifiedFabricConfig(slug)
  return unified && unified.unifiedSlug !== slug
    ? `/producto/${unified.unifiedSlug}?color=${encodeURIComponent(slug)}`
    : `/producto/${encodeURIComponent(slug)}`
}
