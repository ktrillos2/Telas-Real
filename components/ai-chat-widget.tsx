"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, X, Send, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AiSearchResult } from "@/lib/ai-search"

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; result?: AiSearchResult; error?: boolean }

const SUGGESTIONS = [
  "Tela fresca para uniforme de enfermera",
  "Licra para vestido de baño",
  "Tela suave para pijamas",
  "Tela elegante para vestido de fiesta",
]

const WELCOME =
  "¡Hola! Soy el asesor de telas de Telas Real 🧵. Cuéntame qué vas a confeccionar y te recomiendo la tela ideal."

/** Ícono del asesor: burbuja de chat con destellos de IA. */
function AdvisorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 4C8.82 4 3 8.93 3 15c0 2.9 1.33 5.54 3.5 7.5L5.6 27.2a.8.8 0 0 0 1.12.88l5.1-2.5c1.32.37 2.73.57 4.18.57 7.18 0 13-4.92 13-11.15S23.18 4 16 4Z"
        fill="#fff"
      />
      <path d="M15 9.2l1.35 3.65L20 14.2l-3.65 1.35L15 19.2l-1.35-3.65L10 14.2l3.65-1.35L15 9.2Z" className="fill-sky-600" />
      <path d="M21.5 8l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" className="fill-amber-400" />
      <path d="M20.6 17.4l.45 1.2 1.2.45-1.2.45-.45 1.2-.45-1.2-1.2-.45 1.2-.45.45-1.2Z" className="fill-sky-400" />
    </svg>
  )
}

/** Asistente de búsqueda con IA (Groq) como chat flotante, abajo a la izquierda. */
export function AiChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: WELCOME }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Se cierra al cambiar de página (ej. al abrir una tela recomendada en celular)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) setOpen(false)
  }, [pathname])

  if (pathname?.startsWith("/videos") || pathname?.startsWith("/checkout") || pathname?.startsWith("/admin")) return null

  const send = async (raw: string) => {
    const text = raw.trim()
    if (text.length < 3 || loading) return
    const history = messages.filter((m) => m.role === "user").map((m) => m.text).slice(-3)
    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No pude responder en este momento.")
      const result = data as AiSearchResult
      const answer =
        result.answer ||
        (result.products.length ? "Estas telas pueden servirte:" : "No encontré una tela que encaje. ¿Me cuentas un poco más de lo que vas a hacer?")
      setMessages((prev) => [...prev, { role: "assistant", text: answer, result }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", text: e?.message || "No pude responder en este momento.", error: true }])
    } finally {
      setLoading(false)
    }
  }

  const isCheckout = pathname?.startsWith("/checkout")

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asesor de telas" : "Abrir asesor de telas con IA"}
        aria-expanded={open}
        className={cn(
          "group fixed left-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-sky-700 pl-2 pr-2 text-white shadow-[0_10px_25px_-8px_rgba(14,116,144,0.7)] ring-4 ring-primary/15 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-8px_rgba(14,116,144,0.8)] active:scale-95 sm:left-6 sm:pr-5",
          isCheckout ? "bottom-24 sm:bottom-6" : "bottom-20 sm:bottom-6"
        )}
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          {open ? <X className="h-5 w-5" aria-hidden /> : <AdvisorIcon className="h-7 w-7 transition-transform group-hover:rotate-[-6deg] group-hover:scale-110" />}
          {!open && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 [animation-duration:2.5s]" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </span>
          )}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-semibold">{open ? "Cerrar" : "Asesor IA"}</span>
          {!open && <span className="text-[10px] font-medium opacity-80">¿Qué tela necesitas?</span>}
        </span>
      </button>

      {/* Ventana del chat */}
      {open && (
        <div
          role="dialog"
          aria-label="Asesor de telas con IA"
          className="fixed inset-x-3 bottom-[9.5rem] z-50 flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:inset-x-auto sm:bottom-24 sm:left-6 sm:w-[380px]"
        >
          {/* Encabezado */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Asesor de telas</p>
              <p className="text-xs opacity-80">Con IA · responde al instante</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-full p-1.5 hover:bg-white/15">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-muted/30 p-4" aria-live="polite">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-start gap-2">
                  {m.result?.didYouMean && (
                    <p className="pl-1 text-xs text-muted-foreground">
                      Creo que quisiste decir: <span className="font-semibold text-primary">{m.result.didYouMean}</span>
                    </p>
                  )}
                  <p
                    className={cn(
                      "max-w-[90%] rounded-2xl rounded-bl-sm border border-border/70 bg-background px-3.5 py-2 text-sm leading-relaxed",
                      m.error && "text-muted-foreground"
                    )}
                  >
                    {m.text}
                  </p>
                  {m.result && m.result.products.length > 0 && (
                    <div className="w-full space-y-2">
                      {m.result.products.slice(0, 6).map((p) => (
                        <Link
                          key={p.href}
                          href={p.href}
                          className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background p-2 transition-all hover:border-primary/50 hover:shadow-sm"
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {p.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-xs font-semibold leading-snug group-hover:text-primary">{p.name}</p>
                            {(p.salePrice || p.price) && (
                              <p className="text-xs font-bold text-primary">${(p.salePrice || p.price)!.toLocaleString("es-CO")}/m</p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                        </Link>
                      ))}
                      {m.result.searchTerm && (
                        <Link
                          href={`/tienda/telas/${encodeURIComponent(m.result.searchTerm.toLowerCase())}`}
                          className="inline-flex items-center gap-1 pl-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Ver más “{m.result.searchTerm}” en la tienda <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Sugerencias al empezar */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                Buscando la tela ideal…
              </div>
            )}
          </div>

          {/* Escribir */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 border-t border-border bg-background p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder="Ej: tela para pijama de niño"
              className="h-10 flex-1 rounded-full border border-border bg-muted/40 px-4 text-sm outline-none focus:border-primary focus:bg-background"
              aria-label="Escribe tu pregunta"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 3}
              aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
