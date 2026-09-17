"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, X } from "lucide-react"

export function NotFoundSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/tienda?categoria=todos&search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/tienda")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Buscar telas en el catálogo"
      className="relative w-full max-w-lg group"
    >
      <div className="relative flex items-center w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs transition-all duration-200 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/15 group-hover:border-slate-300">
        <div className="pl-4 pr-2 text-slate-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
          <Search className="w-5 h-5 transition-colors group-focus-within:text-emerald-600" />
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué tela buscas? (ej. Lino, Seda, Dril...)"
          aria-label="Término de búsqueda textil"
          className="w-full py-3.5 pr-2 bg-transparent text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 placeholder:font-light outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="p-1.5 mr-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          aria-label="Buscar en la tienda"
          className="m-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white font-medium text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span>Buscar</span>
          <ArrowRight className="w-3.5 h-3.5 hidden sm:inline-block" />
        </button>
      </div>
    </form>
  )
}
