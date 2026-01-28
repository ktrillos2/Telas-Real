"use client"

import { useState, Suspense, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { FabricUsesCarousel } from "@/components/fabric-uses-carousel"
import { MobileFiltersSidebar } from "@/components/mobile-filters-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { useProducts } from "@/lib/hooks/useProducts"
import { useCategories } from "@/lib/hooks/useCategories"
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
  const hasAutoSelectedRef = useRef(false) // Track if we've already auto-selected based on URL

  // Obtener categorías primero
  const { categories: wpCategories, loading: loadingCategories, error: errorCategories } = useCategories()

  // Sincronizar activeCategory con el parámetro de URL solo cuando cambia
  // Sincronizar activeCategory con el parámetro de URL y las categorías disponibles
  useEffect(() => {
    if (categoryParam) {
      let targetSlug = categoryParam

      // Si ya tenemos categorías cargadas, intentamos encontrar la mejor coincidencia
      if (wpCategories.length > 0) {
        const exactMatch = wpCategories.find(cat => cat.slug === categoryParam)

        if (!exactMatch) {
          // Busqueda aproximada o corrección de alias
          const fuzzyMatch = wpCategories.find(cat =>
            cat.slug.includes(categoryParam) ||
            (categoryParam === 'sublimados' && cat.slug.includes('sublimado'))
          )

          if (fuzzyMatch) {
            targetSlug = fuzzyMatch.slug
          }
        }
      }

      if (targetSlug !== activeCategory) {
        setActiveCategory(targetSlug)
        hasAutoSelectedRef.current = false // Reset when URL category changes
      }
    }
  }, [categoryParam, wpCategories, activeCategory])

  // Sincronizar filtros con parámetros de URL
  useEffect(() => {
    if (usoParam !== activeUso) {
      setActiveUso(usoParam)
      hasAutoSelectedRef.current = false // Reset when URL params change
    }
  }, [usoParam])

  useEffect(() => {
    if (tonoParam !== activeTono) {
      setActiveTono(tonoParam)
      hasAutoSelectedRef.current = false // Reset when URL params change
    }
  }, [tonoParam])

  useEffect(() => {
    if (tipoParam !== activeTipo) {
      setActiveTipo(tipoParam)
      hasAutoSelectedRef.current = false // Reset when URL params change
    }
  }, [tipoParam])

  // Auto-seleccionar categoría basada en uso, tono o tipo (solo una vez)
  useEffect(() => {
    if ((usoParam || tonoParam || tipoParam) && wpCategories.length > 0 && !hasAutoSelectedRef.current) {
      // Find matching category for uso
      if (usoParam) {
        const matchingCategory = wpCategories.find(cat =>
          cat.slug.includes(usoParam) ||
          cat.slug.includes(`para-confeccion-${usoParam}`) ||
          cat.slug.includes(`tela-${usoParam}`) ||
          cat.name.toLowerCase().includes(usoParam)
        )
        if (matchingCategory) {
          setActiveCategory(matchingCategory.slug)
          hasAutoSelectedRef.current = true
        }
      }

      // Find matching category for tono
      if (tonoParam && !usoParam) { // Only if uso didn't already set a category
        const matchingCategory = wpCategories.find(cat =>
          cat.slug.includes(tonoParam) ||
          cat.slug.includes(`tonos-${tonoParam}`) ||
          cat.slug.includes(`telas-color-${tonoParam}`) ||
          cat.name.toLowerCase().includes(tonoParam)
        )
        if (matchingCategory) {
          setActiveCategory(matchingCategory.slug)
          hasAutoSelectedRef.current = true
        }
      }

      // Find matching category for tipo
      if (tipoParam && !usoParam && !tonoParam) {
        const matchingCategory = wpCategories.find(cat =>
          cat.slug.includes(tipoParam) ||
          cat.name.toLowerCase().includes(tipoParam)
        )
        if (matchingCategory) {
          setActiveCategory(matchingCategory.slug)
          hasAutoSelectedRef.current = true
        }
      }
    }
  }, [usoParam, tonoParam, tipoParam, wpCategories])

  // Encontrar el ID y el count de la categoría activa
  const activeCategoryData = useMemo(() => {
    if (activeCategory === "todos") return { id: undefined, count: 100 }
    const category = wpCategories.find(cat => cat.slug === activeCategory)
    return {
      id: category?.id,
      count: category?.count || 100 // Usar el count de la categoría o 100 por defecto
    }
  }, [activeCategory, wpCategories])

  // Obtener productos filtrados por categoría con el límite exacto
  const { products: allProducts, loading: loadingProducts, error: errorProducts } = useProducts(
    1,
    activeCategoryData.count,
    activeCategoryData.id?.toString()
  )

  // Resetear a página 1 cuando cambia la categoría
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory])

  // Construir categorías con iconos
  const categories = useMemo(() => {
    // Calcular el total de productos solo si no hay categoría activa
    const totalCount = activeCategory === "todos" ? allProducts.length : wpCategories.reduce((sum, cat) => sum + cat.count, 0)
    const allCategory = { id: "todos", name: "Todos", slug: "todos", icon: Tag, count: totalCount }

    const mappedCategories = wpCategories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      slug: cat.slug,
      icon: categoryIcons[cat.slug] || Package,
      count: cat.count
    }))

    return [allCategory, ...mappedCategories]
  }, [wpCategories, activeCategory, allProducts.length])

  // Extraer valores únicos de elasticidad de los productos
  const availableElasticities = useMemo(() => {
    const elasticities = new Set<string>()
    allProducts.forEach(product => {
      const elasticidadAttr = product.attributes.find(attr => attr.name === "Elasticidad")
      if (elasticidadAttr) {
        elasticidadAttr.terms.forEach(term => elasticities.add(term.name))
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
      const pesoAttr = product.attributes.find(attr =>
        attr.name.toLowerCase().includes("peso") ||
        attr.name.toLowerCase().includes("gramaje") ||
        attr.name.toLowerCase().includes("weight")
      )
      if (pesoAttr) {
        pesoAttr.terms.forEach(term => weights.add(term.name))
      }
    })

    console.log('Available weights:', Array.from(weights))
    return Array.from(weights).sort()
  }, [allProducts])

  // Extraer valores únicos de composición de los productos
  const availableCompositions = useMemo(() => {
    const compositions = new Set<string>()
    allProducts.forEach(product => {
      const composicionAttr = product.attributes.find(attr =>
        attr.name.toLowerCase().includes("composición") ||
        attr.name.toLowerCase().includes("composicion") ||
        attr.name.toLowerCase().includes("composition") ||
        attr.name.toLowerCase().includes("material")
      )
      if (composicionAttr) {
        composicionAttr.terms.forEach(term => compositions.add(term.name))
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
        const anchoAttr = product.attributes.find(attr => attr.name === "Ancho")
        if (!anchoAttr) return false
        return anchoAttr.terms.some(term => {
          const width = term.name.match(/(\d+\.?\d*)/)?.[1]
          return width && selectedWidths.includes(width)
        })
      })
    }

    // Filtrar por elasticidad
    if (selectedElasticities.length > 0) {
      filtered = filtered.filter(product => {
        const elasticidadAttr = product.attributes.find(attr => attr.name === "Elasticidad")
        if (!elasticidadAttr) return false
        return elasticidadAttr.terms.some(term =>
          selectedElasticities.includes(term.name)
        )
      })
    }

    // Filtrar por peso
    if (selectedWeights.length > 0) {
      filtered = filtered.filter(product => {
        const pesoAttr = product.attributes.find(attr =>
          attr.name.toLowerCase().includes("peso") ||
          attr.name.toLowerCase().includes("gramaje") ||
          attr.name.toLowerCase().includes("weight")
        )
        if (!pesoAttr) return false
        return pesoAttr.terms.some(term =>
          selectedWeights.includes(term.name)
        )
      })
    }

    // Filtrar por composición
    if (selectedCompositions.length > 0) {
      filtered = filtered.filter(product => {
        const composicionAttr = product.attributes.find(attr =>
          attr.name.toLowerCase().includes("composición") ||
          attr.name.toLowerCase().includes("composicion") ||
          attr.name.toLowerCase().includes("composition") ||
          attr.name.toLowerCase().includes("material")
        )
        if (!composicionAttr) return false
        return composicionAttr.terms.some(term =>
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
          const pesoAttr = product.attributes.find(attr =>
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
        const isSublimableProduct = product.categories?.some(cat =>
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
        // Check if product has the uso in categories, tags, or attributes
        const hasInCategories = product.categories?.some(cat =>
          cat.slug.includes(activeUso) ||
          cat.name.toLowerCase().includes(activeUso)
        )

        // Also check in tags if they exist
        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug.includes(activeUso) ||
          tag.name.toLowerCase().includes(activeUso)
        )

        return hasInCategories || hasInTags
      })
    }

    // Filtrar por Tono (desde URL)
    if (activeTono) {
      filtered = filtered.filter(product => {
        // Check if product has the tono in categories or tags
        const hasInCategories = product.categories?.some(cat =>
          cat.slug.includes(activeTono) ||
          cat.slug.includes(`tonos-${activeTono}`) ||
          cat.name.toLowerCase().includes(activeTono)
        )

        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug.includes(activeTono) ||
          tag.name.toLowerCase().includes(activeTono)
        )

        return hasInCategories || hasInTags
      })
    }

    // Filtrar por Tipo (desde URL)
    if (activeTipo) {
      filtered = filtered.filter(product => {
        // Check if product has the tipo in categories or tags
        const hasInCategories = product.categories?.some(cat =>
          cat.slug.includes(activeTipo) ||
          cat.name.toLowerCase().includes(activeTipo)
        )

        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug.includes(activeTipo) ||
          tag.name.toLowerCase().includes(activeTipo)
        )

        return hasInCategories || hasInTags
      })
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
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

              <div className="flex-1">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                      {paginatedProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          price={product.price}
                          regularPrice={product.regular_price}
                          salePrice={product.sale_price}
                          image={product.image}
                          priority={index < 6}
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

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                            className="w-10 h-10"
                          >
                            {page}
                          </Button>
                        ))}

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
      <Footer />
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
