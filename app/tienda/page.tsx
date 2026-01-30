"use client"

import { useState, Suspense, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { FabricUsesCarousel } from "@/components/fabric-uses-carousel"
import { MobileFiltersSidebar } from "@/components/mobile-filters-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { client } from "@/sanity/lib/client"
import { urlFor } from "@/sanity/lib/image"
import { groq } from "next-sanity"
import { Slider } from "@/components/ui/slider"
import {
  Shirt,
  Sparkles,
  Dumbbell,
  Crown,
  Coffee,
  Tag,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Package,
  Palette,
  Pilcrow,
  Heart,
  Zap,
  Wind,
  Droplet,
  Sun,
  Moon,
  Star,
  Flame,
  Leaf,
  Feather,
  Waves,
  Snowflake,
  Dog,
  Gift,
  Mountain,
  Palmtree,
  Trees,
  Gem,
  Scissors,
  Lightbulb,
  CircleDot,
  Workflow,
  Layers,
  BadgePercent,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mapeo de iconos para categorías conocidas
const categoryIcons: Record<string, any> = {
  // Sublimados
  "sublimado-telas-textil": Sparkles,
  "sublimados": Sparkles,
  "acetato-sublimado": Sparkles,
  "antifluido-licrado-sublimado": Sparkles,
  "antifluido-rigido-sublimado": Sparkles,
  "chifon-crepe-sublimado": Sparkles,
  "piel-de-conejo-sublimado": Sparkles,
  "poly-licra-sublimado": Sparkles,
  "rib-sublimado": Sparkles,
  "satin-sublimado": Sparkles,
  "scuba-crepe-sublimado": Sparkles,
  "suavetina-sublimado": Sparkles,

  // Unicolor
  "telaunicolor": Shirt,
  "unicolor": Shirt,
  "acetato-unicolor": Shirt,
  "brush-unicolor": Palette,
  "cartago-unicolor": Shirt,
  "chifon-crepe-unicolor": Feather,
  "chirripo-unicolor": Mountain,
  "conchal-unicolor": Waves,
  "crepe-unicolor": Shirt,
  "dominical-unicolor": Waves,
  "granito-de-arroz-unicolor": CircleDot,
  "irazu-unicolor": Mountain,
  "licra-deportiva-unicolor": Dumbbell,
  "manzanillo-unicolor": Palmtree,
  "montezuma-unicolor": Waves,
  "tela_palmares_unicolor_confeccion": Palmtree,
  "piel-de-conejo-unicolor": Feather,
  "pinilla-unicolor": Trees,
  "poly-licra-unicolor": Shirt,
  "rib-unicolor": Workflow,
  "satin-unicolor": Gem,
  "savegre-unicolor": Mountain,
  "scuba-crepe-unicolor": Shirt,
  "seda-de-mango-unicolor": Feather,
  "tamarindo-unicolor": Leaf,
  "tela-terciopelo": Gem,
  "uvita-unicolor": Palmtree,
  "wafer-unicolor-tela-galleta-confeccion": Layers,

  // Deportivos
  "tela_para_confeccion_licra_deportiva": Dumbbell,
  "tela-para-confeccion-deportivos-comodos": Dumbbell,
  "deportivos": Dumbbell,
  "deportivo": Dumbbell,

  // Elegantes
  "tela-para-confeccion-prendas-elegantes": Crown,
  "elegantes": Crown,

  // Casual
  "tela-moda-casual-confeccion": Coffee,
  "casual": Coffee,

  // Pijamas
  "tela-para-pijamas": Moon,

  // Accesorios y Mascotas
  "telas_para_accesorios_mascotas": Dog,

  // Linos
  "lino-cabuya": Leaf,
  "lino-cahuita": Waves,
  "lino-poliester": Shirt,

  // Acogedores
  "tela-confeccion-piel-de-conejo-cobija": Snowflake,

  // Verano
  "tela-verano-confeccion-traje-de-bano-salidas-de-bano": Sun,

  // Tonos/Colores
  "tonos-amarillos": Sun,
  "tonos-azules": Droplet,
  "tonos-claros": Lightbulb,
  "tonos-medios": CircleDot,
  "tonos-oscuros": Moon,
  "tonos-rojos": Flame,
  "tonos-rosados": Heart,
  "tonos-verdes": Leaf,
  "telas-color-neon-telascolores": Zap,

  // Ofertas
  "ofertas_telas_promociones": BadgePercent,

  // Otros
  "pithaya": Leaf,
  "sin-categorizar": Package,
}


function TiendaContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("categoria")
  const usoParam = searchParams.get("uso")
  const tonoParam = searchParams.get("tono")
  const tipoParam = searchParams.get("tipo")
  const searchParam = searchParams.get("search")

  const [activeCategory, setActiveCategory] = useState(categoryParam || "todos")
  const [activeUso, setActiveUso] = useState<string | null>(usoParam)
  const [activeTono, setActiveTono] = useState<string | null>(tonoParam)
  const [activeTipo, setActiveTipo] = useState<string | null>(tipoParam)

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000])
  const [selectedWidths, setSelectedWidths] = useState<string[]>([])
  const [selectedElasticities, setSelectedElasticities] = useState<string[]>([])
  const [selectedWeights, setSelectedWeights] = useState<string[]>([])
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>([])
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>([])
  const [sublimableFilter, setSublimableFilter] = useState<string>("all")

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>("default")

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Ref para el scroll del carrusel de categorías
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const hasAutoSelectedRef = useRef(false)

  // Fetch Categories from Sanity
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await client.fetch(groq`
                *[_type == "category"] {
                    "id": slug.current,
                    name,
                    "slug": slug.current,
                    "count": count(*[_type == "product" && references(^._id)])
                }
            `)
        // Add "Todos" category
        const totalProducts = await client.fetch(groq`count(*[_type == "product"])`)
        const allCat = { id: "todos", name: "Todos", slug: "todos", icon: Tag, count: totalProducts }

        // Map icons
        const mapped = data.map((cat: any) => ({
          ...cat,
          icon: categoryIcons[cat.slug] || Package
        }))

        setCategories([allCat, ...mapped])
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // Sync active category
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      // ... (keep existing logic simpler if possible, or just exact match)
      // For now just basic match
      const match = categories.find(c => c.slug === categoryParam)
      if (match && match.slug !== activeCategory) {
        setActiveCategory(match.slug)
      }
    }
  }, [categoryParam, categories])


  // Fetch Products from Sanity
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [errorProducts, setErrorProducts] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        let query = `*[_type == "product"]`
        // Initial filter
        if (activeCategory !== 'todos') {
          const catSlug = activeCategory
          query = `*[_type == "product" && references(*[_type == "category" && slug.current == "${catSlug}"]._id)]`
        }

        // Apply Search Filter if exists
        if (searchParam) {
          // If we already have a specialized query (category filter), we wrap it or append &&
          // But GROQ string manipulation is tricky.
          // Easier approach: Start specific or generic, then append conditions.

          // Re-building query strategy:
          let conditions = `_type == "product"`

          if (activeCategory !== 'todos') {
            conditions += ` && references(*[_type == "category" && slug.current == "${activeCategory}"]._id)`
          }

          if (searchParam) {
            conditions += ` && (
                title match $search + "*" || 
                description match $search + "*" ||
                categories[]->name match $search + "*" ||
                tags[]->name match $search + "*" ||
                usages[]->title match $search + "*" ||
                tones[]->title match $search + "*"
             )`
          }

          query = `*[${conditions}]`

          if (searchParam) {
            query += ` | score(
              title match $search + "*" * 5,
              categories[]->name match $search + "*" * 3,
              tags[]->name match $search + "*" * 2,
              usages[]->title match $search + "*" * 2,
              tones[]->title match $search + "*" * 2,
              description match $search + "*" * 1
            ) | order(_score desc)`
          }
        }

        query += `{
                _id,
                "name": title,
                "slug": slug.current,
                price,
                sale_price,
                "prices": {
                    "price": price,
                    "regular_price": price, 
                    "sale_price": sale_price
                },
                "image": images[0],
                "lqip": images[0].asset->metadata.lqip,
                "images": images[]{ "src": asset->url, "id": _key },
                "categories": categories[]->{ "id": _id, name, "slug": slug.current },
                "usages": usages[]->{ "id": _id, title, "slug": slug.current },
                "tones": tones[]->{ "id": _id, title, "slug": slug.current },
                "attributes": attributes[]{ name, "terms": [{ "name": value }] },
                stock_status,
                stockStatus,
                short_description,
                description,
                weight,
                tags[]->{ "id": _id, name, "slug": slug.current }
            }`

        const data = await client.fetch(groq`${query}`, { search: searchParam })

        // Map to match component expectation
        const mapped = data.map((p: any) => {
          const isStock = (p.stockStatus && p.stockStatus === 'inStock') ||
            (p.stock_status && p.stock_status === 'instock');

          return {
            id: p._id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            regular_price: p.price,
            sale_price: p.sale_price,
            image: p.image ? urlFor(p.image).width(800).url() : "/placeholder.svg",
            blurDataURL: p.lqip,
            images: p.images || [],
            categories: p.categories || [],
            usages: p.usages || [],
            tones: p.tones || [],
            attributes: p.attributes || [],
            is_in_stock: isStock,
            short_description: p.short_description || "",
            description: p.description || "",
            weight: p.weight,
            tags: p.tags || []
          }
        })

        setAllProducts(mapped)
      } catch (e: any) {
        setErrorProducts(e.message)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [activeCategory, searchParam])

  // Resetear a página 1 cuando cambia la categoría
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory])



  // Extraer valores únicos de elasticidad de los productos
  const availableElasticities = useMemo(() => {
    const elasticities = new Set<string>()
    allProducts.forEach(product => {
      const elasticidadAttr = product.attributes.find((attr: any) => attr.name === "Elasticidad")
      if (elasticidadAttr) {
        elasticidadAttr.terms.forEach((term: any) => elasticities.add(term.name))
      }
    })
    return Array.from(elasticities).sort()
  }, [allProducts])

  // Extraer valores únicos de peso de los productos
  const availableWeights = useMemo(() => {
    const weights = new Set<string>()

    // Debug: ver qué atributos tienen los productos
    if (allProducts.length > 0) {
      console.log('Atributos del primer producto:', allProducts[0].attributes.map(attr => attr.name))
    }

    allProducts.forEach(product => {
      // Buscar cualquier atributo que contenga "peso" o "gramaje" (case insensitive)
      const pesoAttr = product.attributes.find((attr: any) =>
        attr.name.toLowerCase().includes("peso") ||
        attr.name.toLowerCase().includes("gramaje") ||
        attr.name.toLowerCase().includes("weight")
      )
      if (pesoAttr) {
        pesoAttr.terms.forEach((term: any) => weights.add(term.name))
      }
    })

    console.log('Available weights:', Array.from(weights))
    return Array.from(weights).sort()
  }, [allProducts])

  // Extraer valores únicos de composición de los productos
  const availableCompositions = useMemo(() => {
    const compositions = new Set<string>()
    allProducts.forEach(product => {
      const composicionAttr = product.attributes.find((attr: any) =>
        attr.name.toLowerCase().includes("composición") ||
        attr.name.toLowerCase().includes("composicion") ||
        attr.name.toLowerCase().includes("composition") ||
        attr.name.toLowerCase().includes("material")
      )
      if (composicionAttr) {
        composicionAttr.terms.forEach((term: any) => compositions.add(term.name))
      }
    })
    return Array.from(compositions).sort()
  }, [allProducts])

  // Actualizar botones de scroll cuando cambien las categorías
  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(updateScrollButtons, 100)
    }
  }, [categories])

  // Filtrar y procesar productos
  const displayProducts = useMemo(() => {
    let filtered = allProducts

    // La categoría ya viene filtrada desde la API, no necesitamos filtrarla aquí

    // Filtrar por precio con range
    filtered = filtered.filter((product) => {
      return product.price >= priceRange[0] && product.price <= priceRange[1]
    })

    // Filtrar por ancho
    if (selectedWidths.length > 0) {
      filtered = filtered.filter(product => {
        const anchoAttr = product.attributes.find((attr: any) => attr.name === "Ancho")
        if (!anchoAttr) return false
        return anchoAttr.terms.some((term: any) => {
          const width = term.name.match(/(\d+\.?\d*)/)?.[1]
          return width && selectedWidths.includes(width)
        })
      })
    }

    // Filtrar por elasticidad
    if (selectedElasticities.length > 0) {
      filtered = filtered.filter(product => {
        const elasticidadAttr = product.attributes.find((attr: any) => attr.name === "Elasticidad")
        if (!elasticidadAttr) return false
        return elasticidadAttr.terms.some((term: any) =>
          selectedElasticities.includes(term.name)
        )
      })
    }

    // Filtrar por peso
    if (selectedWeights.length > 0) {
      filtered = filtered.filter(product => {
        const pesoAttr = product.attributes.find((attr: any) =>
          attr.name.toLowerCase().includes("peso") ||
          attr.name.toLowerCase().includes("gramaje") ||
          attr.name.toLowerCase().includes("weight")
        )
        if (!pesoAttr) return false
        return pesoAttr.terms.some((term: any) =>
          selectedWeights.includes(term.name)
        )
      })
    }

    // Filtrar por composición
    if (selectedCompositions.length > 0) {
      filtered = filtered.filter(product => {
        const composicionAttr = product.attributes.find((attr: any) =>
          attr.name.toLowerCase().includes("composición") ||
          attr.name.toLowerCase().includes("composicion") ||
          attr.name.toLowerCase().includes("composition") ||
          attr.name.toLowerCase().includes("material")
        )
        if (!composicionAttr) return false
        return composicionAttr.terms.some((term: any) =>
          selectedCompositions.includes(term.name)
        )
      })
    }

    // Filtrar por rango de peso (g/m)
    if (selectedWeightRanges.length > 0) {
      filtered = filtered.filter(product => {
        let weightValue = 0

        // 1. Check direct weight property
        if (product.weight) {
          const weight = parseFloat(product.weight)
          if (!isNaN(weight) && weight > 0) {
            weightValue = weight
          }
        }

        // 2. Fallback to attributes if weight property is not valid
        if (weightValue === 0) {
          const pesoAttr = product.attributes.find((attr: any) =>
            attr.name.toLowerCase().includes("peso") ||
            attr.name.toLowerCase().includes("gramaje") ||
            attr.name.toLowerCase().includes("weight") ||
            attr.name.toLowerCase().includes("g/m")
          )

          if (pesoAttr && pesoAttr.terms.length > 0) {
            // Extract numeric value from term (e.g., "250 g/m" -> 250)
            const match = pesoAttr.terms[0].name.match(/(\d+)/)
            if (match) {
              weightValue = parseInt(match[1])
            }
          }
        }
        // 3. Fallback to description parsing if still 0
        if (weightValue === 0) {
          // Look for patterns like "250 g/m", "250g/m", "250 gr", "250gr"
          const weightRegex = /(\d+)\s*(?:g\/m|gr|g)(?!\w)/i

          // Check short description first
          let match = product.short_description.match(weightRegex)
          if (match) {
            weightValue = parseInt(match[1])
          } else {
            // Check full description
            match = product.description.match(weightRegex)
            if (match) {
              weightValue = parseInt(match[1])
            }
          }
        }

        if (weightValue === 0) return false

        return selectedWeightRanges.some(range => {
          if (range === "0-200") return weightValue >= 0 && weightValue <= 200
          if (range === "201-400") return weightValue >= 201 && weightValue <= 400
          if (range === "401-600") return weightValue >= 401 && weightValue <= 600
          return false
        })
      })
    }

    // Filtrar por sublimable
    if (sublimableFilter !== "all") {
      filtered = filtered.filter(product => {
        // Check if product has "sublimado" or "sublimable" in categories
        const isSublimableProduct = product.categories?.some((cat: any) =>
          cat.slug.includes("sublimado") ||
          cat.slug.includes("sublimable") ||
          cat.name.toLowerCase().includes("sublimado") ||
          cat.name.toLowerCase().includes("sublimable")
        )

        return sublimableFilter === "yes" ? isSublimableProduct : !isSublimableProduct
      })
    }

    // Filtrar por Uso (desde URL)
    if (activeUso) {
      filtered = filtered.filter(product => {
        // Check if product has the uso in referenced Usages
        const hasReference = product.usages?.some((usage: any) => usage.slug === activeUso)
        if (hasReference) return true;

        // Fallback: Check in tags, categories, attributes logic if needed, but prefer Reference
        const hasInCategories = product.categories?.some((cat: any) =>
          cat.slug.includes(activeUso) ||
          cat.name.toLowerCase().includes(activeUso)
        )

        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug?.includes(activeUso) ||
          tag.name?.toLowerCase().includes(activeUso)
        )

        return hasInCategories || hasInTags
      })
    }

    // Filtrar por Tono (desde URL)
    if (activeTono) {
      filtered = filtered.filter(product => {
        // Check if product has the tone in referenced Tones
        const hasReference = product.tones?.some((tone: any) => tone.slug === activeTono)
        if (hasReference) return true;

        // Fallback
        const hasInCategories = product.categories?.some((cat: any) =>
          cat.slug.includes(activeTono) ||
          cat.slug.includes(`tonos-${activeTono}`) ||
          cat.name.toLowerCase().includes(activeTono)
        )

        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug?.includes(activeTono) ||
          tag.name?.toLowerCase().includes(activeTono)
        )

        return hasInCategories || hasInTags
      })
    }

    // Filtrar por Tipo (desde URL)
    if (activeTipo) {
      filtered = filtered.filter(product => {
        // Check if product has the tipo in categories or tags
        const hasInCategories = product.categories?.some((cat: any) =>
          cat.slug.includes(activeTipo) ||
          cat.name.toLowerCase().includes(activeTipo)
        )

        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug?.includes(activeTipo) ||
          tag.name?.toLowerCase().includes(activeTipo)
        )

        return hasInCategories || hasInTags
      })
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      // Prioritize stock: in-stock items come first
      if (a.is_in_stock && !b.is_in_stock) return -1
      if (!a.is_in_stock && b.is_in_stock) return 1

      switch (sortBy) {
        case "price-asc":
          return a.price - b.price
        case "price-desc":
          return b.price - a.price
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "newest":
          return b.id - a.id
        case "oldest":
          return a.id - b.id
        default:
          return 0
      }
    })

    return sorted
  }, [allProducts, activeCategory, priceRange, selectedWidths, selectedElasticities, selectedWeights, selectedCompositions, selectedWeightRanges, sublimableFilter, sortBy])

  const totalPages = Math.ceil(displayProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = displayProducts.slice(startIndex, endIndex)

  const toggleWidth = (width: string) => {
    setSelectedWidths((prev) => (prev.includes(width) ? prev.filter((w) => w !== width) : [...prev, width]))
  }

  const toggleElasticity = (elasticity: string) => {
    setSelectedElasticities((prev) =>
      prev.includes(elasticity) ? prev.filter((e) => e !== elasticity) : [...prev, elasticity],
    )
  }

  const toggleWeight = (weight: string) => {
    setSelectedWeights((prev) =>
      prev.includes(weight) ? prev.filter((w) => w !== weight) : [...prev, weight],
    )
  }

  const toggleComposition = (composition: string) => {
    setSelectedCompositions((prev) =>
      prev.includes(composition) ? prev.filter((c) => c !== composition) : [...prev, composition],
    )
  }

  const toggleWeightRange = (range: string) => {
    setSelectedWeightRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    )
  }

  // Función para hacer scroll en el carrusel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return

    const scrollAmount = carouselRef.current.clientWidth * 0.8 // Scroll 80% del ancho visible
    const newScrollLeft = direction === 'left'
      ? carouselRef.current.scrollLeft - scrollAmount
      : carouselRef.current.scrollLeft + scrollAmount

    carouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  // Actualizar estado de botones de scroll
  const updateScrollButtons = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Escuchar cambios en el scroll
  const handleScroll = () => {
    updateScrollButtons()
  }

  // Mostrar error
  if (errorProducts) {
    return (
      <div className="min-h-screen">
        <main className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg font-light text-muted-foreground mb-4">Error al cargar productos</p>
            <p className="text-sm text-muted-foreground">{errorProducts}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <main>
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Title Section */}
              <div className="text-center md:text-left flex-1">
                <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">Nuestra Tienda</h1>
                <p className="text-lg font-light text-muted-foreground text-pretty max-w-2xl">
                  Explora nuestro catálogo completo de telas de alta calidad
                </p>
              </div>

              {/* Help Section */}
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">¿Necesitas ayuda con tu compra?</p>
                    <a href="https://wa.me/573014453123" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Habla con nuestros especialistas
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">¿Necesitas más información?</p>
                    <Link href="/puntos-atencion" className="text-primary hover:underline">
                      Visita nuestro centro de ayuda
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="relative">
              {/* Botón scroll izquierda */}
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollCarousel('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              {/* Carrusel de categorías */}
              {loadingCategories ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div
                  ref={carouselRef}
                  onScroll={handleScroll}
                  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {categories.map((category) => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category.id)
                          // Clear uso and tono filters when manually selecting a category
                          setActiveUso(null)
                          setActiveTono(null)
                        }}
                        className={`flex flex-col items-center gap-2 px-6 py-4 rounded-lg transition-colors flex-shrink-0 min-w-[140px] ${activeCategory === category.id
                          ? "bg-primary/10 text-primary"
                          : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        <span className="text-sm font-light text-center">{category.name}</span>
                        {category.id !== "todos" && (
                          <span className="text-xs text-muted-foreground">({category.count})</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Botón scroll derecha */}
              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => scrollCarousel('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-md"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Estilo para ocultar scrollbar */}
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            {activeCategory !== "todos" && (
              <div className="mb-8">
                <FabricUsesCarousel category={activeCategory} />
              </div>
            )}

            <div className={`flex flex-col lg:flex-row gap-8`}>
              <aside className="hidden lg:block lg:w-72 space-y-6 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                    Precio
                    <ChevronDown className="h-4 w-4" />
                  </h3>
                  <div className="space-y-4">
                    <Slider
                      min={0}
                      max={50000}
                      step={1000}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm font-light text-muted-foreground">
                      <span>${priceRange[0].toLocaleString("es-CO")}</span>
                      <span>${priceRange[1].toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                    Ancho
                    <ChevronDown className="h-4 w-4" />
                  </h3>
                  <div className="space-y-2">
                    {["1.50", "1.55", "1.60", "1.70"].map((width) => (
                      <div key={width} className="flex items-center space-x-2">
                        <Checkbox
                          id={`width-${width}`}
                          checked={selectedWidths.includes(width)}
                          onCheckedChange={() => toggleWidth(width)}
                        />
                        <Label htmlFor={`width-${width}`} className="font-light text-sm cursor-pointer">
                          {width} metros
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {availableElasticities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                      Elasticidad Tela
                      <ChevronDown className="h-4 w-4" />
                    </h3>
                    <div className="space-y-2">
                      {availableElasticities.map((elasticity) => (
                        <div key={elasticity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`elasticity-${elasticity}`}
                            checked={selectedElasticities.includes(elasticity)}
                            onCheckedChange={() => toggleElasticity(elasticity)}
                          />
                          <Label htmlFor={`elasticity-${elasticity}`} className="font-light text-sm cursor-pointer">
                            {elasticity}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {availableCompositions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                      Composición
                      <ChevronDown className="h-4 w-4" />
                    </h3>
                    <div className="space-y-2">
                      {availableCompositions.map((composition) => (
                        <div key={composition} className="flex items-center space-x-2">
                          <Checkbox
                            id={`composition-${composition}`}
                            checked={selectedCompositions.includes(composition)}
                            onCheckedChange={() => toggleComposition(composition)}
                          />
                          <Label htmlFor={`composition-${composition}`} className="font-light text-sm cursor-pointer">
                            {composition}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                    Peso
                    <ChevronDown className="h-4 w-4" />
                  </h3>
                  <div className="space-y-2">
                    {["0-200", "201-400", "401-600"].map((range, index) => {
                      const labels = {
                        "0-200": "0 - 200 g/m",
                        "201-400": "201 - 400 g/m",
                        "401-600": "401 - 600 g/m"
                      }
                      return (
                        <div key={range} className="flex items-center space-x-2">
                          <Checkbox
                            id={`weight-range-${range}`}
                            checked={selectedWeightRanges.includes(range)}
                            onCheckedChange={() => toggleWeightRange(range)}
                          />
                          <Label htmlFor={`weight-range-${range}`} className="font-light text-sm cursor-pointer">
                            {labels[range as keyof typeof labels]}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-light mb-4 flex items-center justify-between">
                    Sublimable
                    <ChevronDown className="h-4 w-4" />
                  </h3>
                  <RadioGroup value={sublimableFilter} onValueChange={setSublimableFilter}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="all" id="sublimable-all" />
                      <Label htmlFor="sublimable-all" className="font-light text-sm cursor-pointer">
                        Todos
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="sublimable-yes" />
                      <Label htmlFor="sublimable-yes" className="font-light text-sm cursor-pointer">
                        Sí
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sublimable-no" />
                      <Label htmlFor="sublimable-no" className="font-light text-sm cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </aside>

              <div className="flex-1 min-w-0 w-full overflow-x-hidden">
                <div className="flex gap-2 mb-6 lg:hidden pb-16">
                  <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="flex-1 gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                        <ArrowUpDown className="h-4 w-4" />
                        Ordenar por
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Menor precio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Mayor precio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("newest")}>Más recientes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")}>Más antiguos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name-asc")}>A-Z</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Z-A</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="hidden lg:flex justify-between items-center mb-6">
                  <p className="text-sm font-light text-muted-foreground">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, displayProducts.length)} de {displayProducts.length} productos
                    {activeCategory !== "todos" && (
                      <span className="ml-1">en {categories.find(c => c.id === activeCategory)?.name}</span>
                    )}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <ArrowUpDown className="h-4 w-4" />
                        Ordenar por
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setSortBy("price-asc")}>Menor precio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("price-desc")}>Mayor precio</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("newest")}>Más recientes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")}>Más antiguos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name-asc")}>A-Z</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name-desc")}>Z-A</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-muted-foreground">Cargando productos...</p>
                  </div>
                ) : paginatedProducts.length > 0 ? (

                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                      {paginatedProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          price={product.price}
                          regularPrice={product.regular_price}
                          salePrice={product.sale_price}
                          image={product.image}
                          blurDataURL={product.blurDataURL}
                          priority={index < 6}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          is_in_stock={product.is_in_stock}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-12">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {(() => {
                          const pages = []
                          // always show first page
                          pages.push(
                            <Button
                              key={1}
                              variant={currentPage === 1 ? "default" : "outline"}
                              size="icon"
                              onClick={() => setCurrentPage(1)}
                              className="w-10 h-10"
                            >
                              1
                            </Button>
                          )

                          let startPage, endPage
                          if (totalPages <= 5) {
                            startPage = 2
                            endPage = totalPages - 1
                          } else {
                            if (currentPage <= 3) {
                              startPage = 2
                              endPage = 4
                            } else if (currentPage >= totalPages - 2) {
                              startPage = totalPages - 3
                              endPage = totalPages - 1
                            } else {
                              startPage = currentPage - 1
                              endPage = currentPage + 1
                            }
                          }

                          if (startPage > 2) {
                            pages.push(<span key="ellipsis-start" className="flex items-end px-1">...</span>)
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            if (i > 1 && i < totalPages) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant={currentPage === i ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => setCurrentPage(i)}
                                  className="w-10 h-10"
                                >
                                  {i}
                                </Button>
                              )
                            }
                          }

                          if (endPage < totalPages - 1) {
                            pages.push(<span key="ellipsis-end" className="flex items-end px-1">...</span>)
                          }

                          // always show last page if > 1
                          if (totalPages > 1) {
                            pages.push(
                              <Button
                                key={totalPages}
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="icon"
                                onClick={() => setCurrentPage(totalPages)}
                                className="w-10 h-10"
                              >
                                {totalPages}
                              </Button>
                            )
                          }

                          return pages
                        })()}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-lg font-light text-muted-foreground">
                      No hay productos disponibles con los filtros seleccionados
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <MobileFiltersSidebar
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedWidths={selectedWidths}
        toggleWidth={toggleWidth}
        selectedElasticities={selectedElasticities}
        toggleElasticity={toggleElasticity}
        selectedWeightRanges={selectedWeightRanges}
        toggleWeightRange={toggleWeightRange}
        sublimableFilter={sublimableFilter}
        setSublimableFilter={setSublimableFilter}
        selectedCompositions={selectedCompositions}
        toggleComposition={toggleComposition}
        availableElasticities={availableElasticities}
        availableCompositions={availableCompositions}
      />
    </div>
  )
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <TiendaContent />
    </Suspense>
  )
}
