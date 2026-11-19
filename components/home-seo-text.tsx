import Link from "next/link"
import type { StoreSettings } from "@/lib/store-settings"

/**
 * Texto visible al final del inicio sobre "telas por metro y rollo" (SEO), editable en
 * Sanity: Elementos Globales → Ajustes de la tienda → Texto SEO del inicio.
 */
export function HomeSeoText({ settings }: { settings: StoreSettings }) {
  if (!settings.homeSeoEnabled) return null
  const paragraphs = settings.homeSeoText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!paragraphs.length) return null

  return (
    <section aria-labelledby="home-seo-title" className="border-t border-border/50 bg-muted/20">
      <div className="container mx-auto max-w-4xl px-5 py-12 sm:px-6 md:py-16">
        <h2 id="home-seo-title" className="text-center text-2xl font-light tracking-tight text-foreground md:text-3xl">
          {settings.homeSeoTitle}
        </h2>
        <div className="mx-auto mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {settings.homeSeoLinks.length > 0 && (
          <nav aria-label="Telas más buscadas" className="mt-8 flex flex-wrap justify-center gap-2">
            {settings.homeSeoLinks.map((l) => (
              <Link
                key={l.url + l.label}
                href={l.url}
                prefetch={false}
                className="rounded-full border border-primary/25 bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
