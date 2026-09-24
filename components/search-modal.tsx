"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Loader2, Clock, Trash2, Sparkles, TrendingUp, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import {
  getSearchHistory,
  saveSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
  getAutocompleteSuggestions,
} from "@/lib/search-history"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

const popularSearches = [
  "Tela Satín",
  "Tela Brush",
  "Telas unicolor",
  "Tela Wafer",
  "Rib Pitillo",
  "Licra deportiva",
  "Telas sublimadas",
  "Seda de mango",
]

export function SearchModal({ isOpen, onClose, initialQuery }: SearchModalProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialQuery || "")
  const [history, setHistory] = useState<string[]>([])
  const [randomSearches, setRandomSearches] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Pagination State
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const itemsPerPage = 12

  // Autocomplete suggestions based on current typed query
  const autocompleteSuggestions = useMemo(() => {
    return getAutocompleteSuggestions(searchQuery, 6)
  }, [searchQuery])

  // Execute search: save to localStorage, maintain query, navigate to tienda
  const executeSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return

    // Save to localStorage history
    const updatedHistory = saveSearchHistory(trimmed)
    setHistory(updatedHistory)
    setSearchQuery(trimmed)

    router.push(`/tienda/telas/${encodeURIComponent(trimmed.toLowerCase())}`)
    onClose()
  }

  // Fetch featured products for the initial state
  useEffect(() => {
    if (!isOpen || featuredProducts.length > 0) return

    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
          *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"][0...8] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            "image": images[0].asset->url
          }
        `)
        setFeaturedProducts(
          data.map((p: any) => ({
            id: p._id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            images: [{ src: p.image || "/placeholder.svg" }],
          }))
        )
      } catch (e) {
        console.error("Error fetching featured products in search modal:", e)
      } finally {
        setLoadingFeatured(false)
      }
    }
    fetchFeatured()
  }, [isOpen, featuredProducts.length])

  // Fetch search results from Sanity
  const fetchProducts = async (query: string, pageNum: number) => {
    const isFirstPage = pageNum === 1
    if (isFirstPage) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const start = (pageNum - 1) * itemsPerPage
      const end = start + itemsPerPage

      const data = await client.fetch(
        groq`
        *[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
          title match "*" + $query + "*" || 
          categories[]->name match "*" + $query + "*" ||
          tags[]->name match "*" + $query + "*"
        )]
        | order(title asc)
        [${start}...${end}] {
          _id,
          "name": title,
          "slug": slug.current,
          price,
          "image": images[0].asset->url,
          "categories": categories[]->name
        }
      `,
        { query } as any
      )

      const mappedData = data.map((p: any) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        images: [{ src: p.image || "/placeholder.svg" }],
      }))

      if (isFirstPage) {
        setSearchResults(mappedData)
      } else {
        setSearchResults((prev) => [...prev, ...mappedData])
      }

      setHasMore(data.length === itemsPerPage)
    } catch (e) {
      console.error("Error searching products in Sanity:", e)
    } finally {
      if (isFirstPage) {
        setLoading(false)
      } else {
        setIsLoadingMore(false)
      }
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setHasMore(false)
      return
    }

    setPage(1)
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, 1)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProducts(searchQuery, nextPage)
  }

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load search history from localStorage
      setHistory(getSearchHistory())

      const shuffled = [...popularSearches].sort(() => 0.5 - Math.random())
      setRandomSearches(shuffled.slice(0, 6))

      // If there's an active query in the URL or prop, preserve it
      if (typeof window !== "undefined") {
        const path = window.location.pathname
        const urlParams = new URLSearchParams(window.location.search)
        const q = urlParams.get("search") || urlParams.get("q")
        if (q) {
          setSearchQuery(decodeURIComponent(q))
        } else if (path.startsWith("/tienda/telas/")) {
          const rawSlug = path.replace("/tienda/telas/", "")
          if (rawSlug) {
            setSearchQuery(decodeURIComponent(rawSlug))
          }
        } else if (initialQuery) {
          setSearchQuery(initialQuery)
        }
      }

      document.body.style.overflow = "hidden"
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen, initialQuery])

  const handleClearHistory = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    clearSearchHistory()
    setHistory([])
  }

  const handleRemoveItem = (e: React.MouseEvent, item: string) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = removeSearchHistoryItem(item)
    setHistory(updated)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop con desenfoque suave y animación fluida */}
      <div
        className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md animate-search-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor Flotante Spotlight */}
      <div className="fixed inset-0 z-[101] pointer-events-none flex flex-col items-center justify-start p-2.5 sm:p-6 overflow-hidden">
        <div className="w-full max-w-4xl pointer-events-auto animate-search-modal my-auto sm:my-4 max-h-[92vh] sm:max-h-[88vh] flex flex-col">
          <div className="bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Header del buscador */}
            <div className="p-3 sm:p-5 border-b border-border/70 bg-background/70 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/" onClick={onClose} className="flex-shrink-0 mr-1 hidden sm:block">
                  <Image
                    src="/images/design-mode/image.png"
                    alt="Telas Real"
                    width={110}
                    height={36}
                    className="h-7 sm:h-8 w-auto object-contain"
                  />
                </Link>

                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary flex-shrink-0 pointer-events-none" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="¿Qué tela estás buscando? (Satín, Brush, Wafer, Licra...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 sm:pl-12 pr-20 sm:pr-28 h-12 sm:h-13 text-sm sm:text-base rounded-full sm:rounded-2xl border-primary/25 bg-muted/40 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary transition-all shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        executeSearch(searchQuery)
                      }
                    }}
                  />

                  <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("")
                          inputRef.current?.focus()
                        }}
                        aria-label="Limpiar texto"
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => executeSearch(searchQuery)}
                      disabled={!searchQuery.trim()}
                      className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-full sm:rounded-xl text-xs font-semibold uppercase tracking-wider gap-1.5 shadow-md active:scale-95 transition-transform"
                    >
                      <span>Buscar</span>
                      <ArrowRight className="h-3.5 w-3.5 hidden sm:inline-block" />
                    </Button>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Cerrar buscador"
                  className="p-2 sm:p-2.5 hover:bg-muted rounded-full transition-colors flex-shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable con animación escalonada */}
            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain animate-search-content flex-1">
            {/* 1. AUTOCOMPLETE SUGGESTIONS (VISIBLE WHEN USER IS TYPING) */}
            {searchQuery.trim().length > 0 && autocompleteSuggestions.length > 0 && (
              <div className="max-w-4xl mx-auto mb-6 p-3.5 sm:p-4 bg-muted/40 rounded-2xl border border-border/60 animate-in fade-in">
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Sugerencias de autocompletado
                </div>
                <div className="flex flex-wrap gap-2">
                  {autocompleteSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeSearch(suggestion)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background border border-border/80 hover:border-primary hover:text-primary text-xs sm:text-sm font-medium transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. EMPTY STATE: SEARCH HISTORY + POPULAR SEARCHES + FEATURED PRODUCTS */}
            {searchQuery.trim().length === 0 ? (
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                {/* Search History from localStorage */}
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> Búsquedas recientes
                      </h3>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-xs text-muted-foreground hover:text-rose-500 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Borrar historial
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((term, index) => (
                        <div
                          key={index}
                          className="group flex items-center rounded-full bg-muted/80 border border-border/60 pl-3.5 pr-1.5 py-1 text-xs sm:text-sm font-medium hover:bg-primary/10 hover:border-primary/40 transition-all shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={() => executeSearch(term)}
                            className="text-foreground group-hover:text-primary transition-colors mr-1 cursor-pointer"
                          >
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveItem(e, term)}
                            aria-label={`Eliminar "${term}" del historial`}
                            className="p-1 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-background transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" /> Búsquedas populares
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {randomSearches.map((search, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => executeSearch(search)}
                        className="px-3.5 py-1.5 bg-muted/60 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/30 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommended products */}
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Productos recomendados</h3>
                  {loadingFeatured ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {featuredProducts.slice(0, 5).map((product) => (
                        <Link
                          key={product.id}
                          href={`/producto/${product.slug}`}
                          className="group"
                          onClick={() => {
                            saveSearchHistory(product.name)
                            onClose()
                          }}
                        >
                          <div className="mb-2 overflow-hidden rounded-lg aspect-square relative bg-muted">
                            <Image
                              src={product.images[0]?.src || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 50vw, 20vw"
                            />
                          </div>
                          <h4 className="text-sm font-medium mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm font-bold text-primary">${product.price.toLocaleString("es-CO")}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 3. ACTIVE SEARCH RESULTS */
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm font-light text-muted-foreground mt-4">Buscando telas para "{searchQuery}"...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">
                        {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado{searchResults.length !== 1 ? "s" : ""} para "{searchQuery}"
                      </h3>
                      <button
                        type="button"
                        onClick={() => executeSearch(searchQuery)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Ver todos en el catálogo <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/producto/${product.slug}`}
                          className="group"
                          onClick={() => {
                            saveSearchHistory(product.name || searchQuery)
                            onClose()
                          }}
                        >
                          <div className="mb-2 overflow-hidden rounded-lg aspect-square relative bg-muted shadow-2xs">
                            <Image
                              src={product.images[0]?.src || "/placeholder.svg"}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 50vw, 20vw"
                            />
                          </div>
                          <h4 className="text-sm font-medium mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm font-bold text-primary">${product.price.toLocaleString("es-CO")}</p>
                        </Link>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="mt-8 text-center">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="min-w-[150px]"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            "Cargar más productos"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="text-center py-16">
                    <p className="text-lg font-medium text-foreground mb-1">
                      No encontramos telas para "{searchQuery}"
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Intenta con otra palabra clave, revisa la ortografía o explora nuestras categorías populares.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.slice(0, 4).map((term, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => executeSearch(term)}
                          className="px-3.5 py-1.5 bg-muted rounded-full text-xs font-medium hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
  )
}
