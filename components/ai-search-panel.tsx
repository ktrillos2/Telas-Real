"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Sparkles, Loader2, ArrowRight, RefreshCw } from "lucide-react"
import type { AiSearchResult } from "@/lib/ai-search"

interface AiSearchPanelProps {
  query: string
  /** Se ejecuta sola (búsquedas en lenguaje natural o sin resultados normales) */
  autoRun: boolean
  onNavigate: (label: string) => void
  onSearchTerm: (term: string) => void
}

const wordCount = (q: string) => q.trim().split(/\s+/).filter(Boolean).length

/** ¿Parece una pregunta/descripción y no solo el nombre de una tela? */
export function looksLikeNaturalLanguage(q: string): boolean {
  return wordCount(q) >= 3 || /\?|para |que |busco|necesito|quiero|recomienda/i.test(q)
}

export function AiSearchPanel({ query, autoRun, onNavigate, onSearchTerm }: AiSearchPanelProps) {
  const [result, setResult] = useState<AiSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [askedFor, setAskedFor] = useState<string>("")
  const controllerRef = useRef<AbortController | null>(null)

  const run = async (q: string) => {
    const term = q.trim()
    if (term.length < 3) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError(null)
    setAskedFor(term)
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No pudimos completar la búsqueda.")
      setResult(data)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setError(e?.message || "No pudimos completar la búsqueda.")
      setResult(null)
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }

  // Ejecución automática con espera (no gasta tokens mientras el cliente sigue escribiendo)
  useEffect(() => {
    const term = query.trim()
    if (!autoRun || term.length < 3 || term === askedFor) return
    const timer = setTimeout(() => run(term), 1100)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, autoRun])

  useEffect(() => () => controllerRef.current?.abort(), [])

  const stale = askedFor && askedFor !== query.trim()
  const showIdle = !loading && (!result || stale) && !error

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          Asesor de telas con IA
        </div>
        {result && !loading && !stale && (
          <button
            type="button"
            onClick={() => run(query)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
            aria-label="Volver a preguntar"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      <div className="px-4 pb-4 pt-3 sm:px-5" aria-live="polite">
        {showIdle && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-light text-muted-foreground">
              Describe lo que vas a hacer y te recomendamos la tela ideal. Ej: <em>“tela fresca para uniforme de enfermera”</em>.
            </p>
            <button
              type="button"
              onClick={() => run(query)}
              disabled={query.trim().length < 3}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Preguntar a la IA
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            Buscando la tela ideal para “{askedFor}”…
          </div>
        )}

        {error && !loading && (
          <p className="py-1 text-sm text-muted-foreground">
            {error}{" "}
            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => run(query)}>
              Reintentar
            </button>
          </p>
        )}

        {result && !loading && !stale && (
          <>
            {result.answer && <p className="text-sm leading-relaxed text-foreground">{result.answer}</p>}
            {result.products.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {result.products.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => onNavigate(p.name)}
                    className="group flex gap-2.5 rounded-xl border border-border/70 bg-background p-2 transition-all hover:border-primary/50 hover:shadow-sm"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {p.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-primary">{p.name}</p>
                      {(p.salePrice || p.price) && (
                        <p className="mt-0.5 text-xs font-bold text-primary">${(p.salePrice || p.price)!.toLocaleString("es-CO")}/m</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              !result.answer && <p className="text-sm text-muted-foreground">No encontramos una tela que encaje. Prueba describiéndola de otra forma.</p>
            )}
            {result.searchTerm && result.products.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchTerm(result.searchTerm!)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Ver más “{result.searchTerm}” en el catálogo <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
