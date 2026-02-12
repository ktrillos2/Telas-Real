"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const popularSearches = [
  "Telas deportivas",
  "Sublimados",
  "Telas unicolor",
  "Lycra",
  "Telas elegantes",
  "Dry-Fit",
  "Telas casuales",
  "Algodón",
]

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [randomSearches, setRandomSearches] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(true)

  // Debounce search query to avoid too many requests
  // We need to implement useDebounce or just use a timeout here if useDebounce is not available.
  // Assuming useDebounce exists or I'll implement simple timeout.
  // Checking prompts... I don't recall seeing useDebounce. I'll use simple timeout ref.

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await client.fetch(groq`
          *[_type == "product" && (stockStatus == "inStock" || isVisible == true)][0...8] {
            _id,
            "name": title,
            "slug": slug.current,
            price,
            "image": images[0].asset->url
          }
        `)
        setFeaturedProducts(data.map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          images: [{ src: p.image || "/placeholder.svg" }]
        })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingFeatured(false)
      }
    }
    fetchFeatured()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await client.fetch(groq`
          *[_type == "product" && (stockStatus == "inStock" || isVisible == true) && (
            title match "*" + $query + "*" || 
            description match "*" + $query + "*" ||
            categories[]->name match "*" + $query + "*" ||
            tags[]->name match "*" + $query + "*"
          )]
        `, { query: searchQuery })

        setSearchResults(data.map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          images: [{ src: p.image || "/placeholder.svg" }]
        })))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (isOpen) {
      const shuffled = [...popularSearches].sort(() => 0.5 - Math.random())
      setRandomSearches(shuffled.slice(0, 5))
      setSearchQuery("")
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[101] pointer-events-none flex flex-col">
        <div className="container mx-auto px-4 pointer-events-auto animate-in slide-in-from-top duration-300">
          <div className="bg-background border-b border-border">
            <div className="flex items-center gap-2 py-4 sm:py-6">
              <Image
                src="/images/design-mode/image.png"
                alt="Telas Real"
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto flex-shrink-0"
              />

              <div className="flex-1 relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 h-10 sm:h-12 text-sm sm:text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onClose()
                      window.location.href = `/ tienda ? search = ${encodeURIComponent(searchQuery)} `
                    }
                  }}
                />
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          <div className="py-8 max-h-[calc(100vh-140px)] overflow-y-auto">
            {searchQuery.trim().length === 0 ? (
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">Búsquedas populares</h3>
                  <div className="flex flex-wrap gap-2">
                    {randomSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="px-4 py-2 bg-muted rounded-full text-sm font-light hover:bg-muted/70 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-4 text-muted-foreground">Productos recomendados</h3>
                  {loadingFeatured ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {featuredProducts.slice(0, 5).map((product) => (
                        <Link key={product.id} href={`/ producto / ${product.id} `} className="group" onClick={onClose}>
                          <div className="mb-2 overflow-hidden rounded-lg">
                            <Image
                              src={product.images[0]?.src || "/placeholder.svg"}
                              alt={product.name}
                              width={200}
                              height={200}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <h4 className="text-sm font-light mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-sm font-normal">${product.price.toLocaleString()}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm font-light text-muted-foreground mt-4">Buscando productos...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                      {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                      {searchResults.length !== 1 ? "s" : ""}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {searchResults.map((product) => (
                        <Link key={product.id} href={`/ producto / ${product.id} `} className="group" onClick={onClose}>
                          <div className="mb-2 overflow-hidden rounded-lg">
                            <Image
                              src={product.images[0]?.src || "/placeholder.svg"}
                              alt={product.name}
                              width={200}
                              height={200}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <h4 className="text-sm font-light mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-sm font-normal">${product.price.toLocaleString()}</p>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="text-center py-16">
                    <p className="text-lg font-light text-muted-foreground">
                      No se encontraron productos para "{searchQuery}"
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
