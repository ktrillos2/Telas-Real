"use client"

import { useState, Suspense, useMemo, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { FabricUsesCarousel } from "@/components/fabric-uses-carousel"
import { MobileFiltersSidebar } from "@/components/mobile-filters-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { client } from "@/sanity/lib/client"
import { urlFor } from "@/sanity/lib/image"
import { groq } from "next-sanity"
import { Slider } from "@/components/ui/slider"
import { rankProducts, scoreProduct, fetchSalesMetrics, type SalesMetrics } from "@/lib/product-ranking"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
import { getWhatsAppUrl } from "@/lib/utils/whatsapp"
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
  TrendingUp,
  X,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mapeo de iconos para categorías conocidas
const categoryIcons: Record<string, any> = {
  // Sublimados
  "Productos/telas-sublimadas": Sparkles,
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
  "Productos/telas-unicolor": Shirt,
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

export type StoreAvatarItem = {
  _id: string
  id: string
  title: string
  image?: any
  imageUrl?: string
  filterType: 'usage' | 'category' | 'custom'
  usageSlug?: string
  usageTitle?: string
  usageId?: string
  categorySlug?: string
  categoryName?: string
  categoryId?: string
  customFilter?: string
  order?: number
  isActive?: boolean
}

const usoAvatars: Record<string, string> = {
  "/usos/telas-para-accesorios-complementos-hogar-y-mascotas": "/avatares/mascotas.webp",
  "/usos/telas-para-pantalones-y-palazzo": "/avatares/ropa-casual.webp",
  "/usos/telas-para-vestidos-y-faldas": "/avatares/ropa-formal.webp",
  "/usos/telas-para-uniformes-enfermera-profesora": "/avatares/uniformes.webp",
  "/usos/telas-para-chaquetas-y-buzos": "/avatares/ropa-comoda.webp",
  "/usos/telas-para-ropa-deportiva-y-vestidos-de-bano": "/avatares/deportivo.webp",
  "/usos/telas-para-vestidos-de-baño": "/avatares/vestidos-de-bano.webp",
  "/usos/telas-para-pijamas-y-ropa-de-dormir": "/avatares/pijamas.webp",
  "/usos/telas-para-camisetas-y-blusas": "/avatares/ropa-casual.webp",
}

const sortLabelMap: Record<string, string> = {
  "best-sellers": "Lo más vendido",
  "trending": "En tendencia",
  "sale": "En oferta",
  "price-asc": "Menor precio",
  "price-desc": "Mayor precio",
  "newest": "Más recientes",
  "oldest": "Más antiguos",
  "name-asc": "A-Z",
  "name-desc": "Z-A",
}

type TiendaProps = {
  urlCategory?: string
  urlSearch?: string
  initialCategories?: any[]
  initialProducts?: any[]
  initialUsages?: any[]
  initialAvatars?: StoreAvatarItem[]
  initialSort?: string
  initialSalesMetrics?: SalesMetrics | null
}

function TiendaContent({ urlCategory, urlSearch, initialCategories, initialProducts, initialUsages, initialAvatars, initialSort, initialSalesMetrics }: TiendaProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: homeData } = useHomeDataContext()
  const rawCategoryParam = urlCategory || searchParams.get("categoria")
  const categoryParam = rawCategoryParam ? decodeURIComponent(rawCategoryParam) : undefined
  const usoParam = searchParams.get("uso")
  const avatarParam = searchParams.get("avatar")
  const tonoParam = searchParams.get("tono")
  const tipoParam = searchParams.get("tipo")
  const searchParam = urlSearch || searchParams.get("search")
  const qParam = searchParams.get("q") // Fallback for search query
  const sortParam = searchParams.get("sort") || initialSort
  
  const rawSearch = searchParam || qParam
  const effectiveSearch = rawSearch ? decodeURIComponent(rawSearch) : undefined

  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(initialSalesMetrics || null)

  useEffect(() => {
    if (initialSalesMetrics) return
    fetchSalesMetrics().then(setSalesMetrics).catch(console.error)
  }, [initialSalesMetrics])

  const removeFilterParam = (paramName: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    router.replace(`/tienda${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }

  const [activeCategory, setActiveCategory] = useState(categoryParam || "todos")
  const [activeUso, setActiveUso] = useState<string | null>(usoParam)
  const [activeAvatar, setActiveAvatar] = useState<string | null>(avatarParam)
  const [activeTono, setActiveTono] = useState<string | null>(tonoParam)
  const [activeTipo, setActiveTipo] = useState<string | null>(tipoParam)

  const [maxPrice, setMaxPrice] = useState<number>(100000)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [selectedWidths, setSelectedWidths] = useState<string[]>([])
  const [selectedElasticities, setSelectedElasticities] = useState<string[]>([])
  const [selectedWeights, setSelectedWeights] = useState<string[]>([])
  const [selectedCompositions, setSelectedCompositions] = useState<string[]>([])
  const [selectedWeightRanges, setSelectedWeightRanges] = useState<string[]>([])
  const [sublimableFilter, setSublimableFilter] = useState<string>("all")

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string>(sortParam || "default")

  // Sync state with URL params when they change
  useEffect(() => {
    setActiveCategory(categoryParam || "todos")
    setActiveUso(usoParam)
    setActiveAvatar(avatarParam)
    setActiveTono(tonoParam)
    setActiveTipo(tipoParam)
    if (sortParam) {
      setSortBy(sortParam)
    } else {
      setSortBy("default")
    }
  }, [categoryParam, usoParam, avatarParam, tonoParam, tipoParam, sortParam])

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    setCurrentPage(1)
    const params = new URLSearchParams(searchParams.toString())
    if (newSort === "default") {
      params.delete("sort")
    } else {
      params.set("sort", newSort)
    }
    const newUrl = `/tienda${params.toString() ? `?${params.toString()}` : ""}`
    router.replace(newUrl, { scroll: false })
  }

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Ref para el scroll del carrusel de categorías
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const hasAutoSelectedRef = useRef(false)

  // Ref para el scroll del carrusel de Usos (Avatares)
  const usagesCarouselRef = useRef<HTMLDivElement>(null)
  const [canScrollUsagesLeft, setCanScrollUsagesLeft] = useState(false)
  const [canScrollUsagesRight, setCanScrollUsagesRight] = useState(false)

  // Avatars state (from Sanity storeAvatar)
  const [avatars, setAvatars] = useState<StoreAvatarItem[]>(initialAvatars || [])
  const [loadingAvatars, setLoadingAvatars] = useState(!initialAvatars || initialAvatars.length === 0)

  useEffect(() => {
    if (initialAvatars && initialAvatars.length > 0) {
      setAvatars(initialAvatars)
      setLoadingAvatars(false)
      return
    }
    const fetchAvatars = async () => {
      try {
        const data = await client.fetch(groq`
          *[_type == "storeAvatar" && coalesce(isActive, true) == true] | order(order asc, _createdAt asc) {
            "_id": _id,
            "id": _id,
            title,
            "imageUrl": image.asset->url + "?auto=format&w=220&q=75",
            image,
            filterType,
            "usageSlug": usage->slug.current,
            "usageTitle": usage->title,
            "usageId": usage->_id,
            "categorySlug": category->slug.current,
            "categoryName": category->name,
            "categoryId": category->_id,
            customFilter,
            order
          }
        `)
        if (data && data.length > 0) {
          setAvatars(data)
        }
      } catch (error) {
        console.error("Error fetching store avatars:", error)
      } finally {
        setLoadingAvatars(false)
      }
    }
    fetchAvatars()
  }, [initialAvatars])

  // Usages state (fallback)
  const [usages, setUsages] = useState<any[]>(initialUsages || [])
  const [loadingUsages, setLoadingUsages] = useState(!initialUsages)

  useEffect(() => {
    if (initialUsages && initialUsages.length > 0) return
    const fetchUsages = async () => {
      try {
        const data = await client.fetch(groq`
                *[_type == "usage" && !(title match "*sudadera*" || slug.current match "*sudadera*")] {
                    "id": slug.current,
                    title,
                    "slug": slug.current,
                    "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && references(^._id)])
                }
            `)
        const filtered = data.filter((uso: any) => {
          const title = (uso.title || '').toLowerCase();
          const slug = (uso.slug || '').toLowerCase();
          return uso.count > 0 && !title.includes('sudadera') && !slug.includes('sudadera');
        })
        setUsages(filtered)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingUsages(false)
      }
    }
    fetchUsages()
  }, [initialUsages])

  const isAvatarActive = (avatar: StoreAvatarItem) => {
    if (activeAvatar === avatar._id || activeAvatar === avatar.id) return true
    if (activeUso && avatar.usageSlug) {
      const cleanActive = activeUso.replace('/usos/', '').toLowerCase()
      const cleanAvatar = avatar.usageSlug.replace('/usos/', '').toLowerCase()
      if (activeUso === avatar.usageSlug || cleanActive === cleanAvatar) return true
    }
    return false
  }

  const currentActiveAvatarObj = useMemo(() => {
    if (!activeAvatar && !activeUso) return null
    return avatars.find(a => 
      (activeAvatar && (a._id === activeAvatar || a.id === activeAvatar)) ||
      (activeUso && a.usageSlug && (a.usageSlug === activeUso || a.usageSlug.replace('/usos/', '') === activeUso.replace('/usos/', '')))
    ) || null
  }, [activeAvatar, activeUso, avatars])

  const handleAvatarClick = (avatar: StoreAvatarItem) => {
    if (isAvatarActive(avatar)) {
      setActiveAvatar(null)
      setActiveUso(null)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('avatar')
      params.delete('uso')
      router.replace(`/tienda${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
      return
    }

    setActiveAvatar(avatar._id || avatar.id)
    setActiveCategory("todos")

    const params = new URLSearchParams(searchParams.toString())
    params.set('avatar', avatar._id || avatar.id)
    params.delete('categoria')

    if (avatar.filterType === 'usage' && avatar.usageSlug) {
      setActiveUso(avatar.usageSlug)
      params.set('uso', avatar.usageSlug)
    } else {
      setActiveUso(null)
      params.delete('uso')
    }

    router.replace(`/tienda?${params.toString()}`, { scroll: false })
  }

  // Track whether we are in Insumos view or Telas view
  const isInsumosView = useMemo(() => {
    const cat = (activeCategory || '').toLowerCase();
    return cat === 'insumos' || cat === 'hilos' || cat === 'tijeras' || cat.includes('hilo') || cat.includes('tijera');
  }, [activeCategory]);

  // Fetch Categories from Sanity
  const [categories, setCategories] = useState<any[]>(
    initialCategories ? initialCategories.map((c: any) => ({ ...c, icon: categoryIcons[c.slug] || Package })) : []
  )
  const [loadingCategories, setLoadingCategories] = useState(!initialCategories)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        if (isInsumosView) {
          const [totalInsumos, hilosCount, tijerasCount] = await Promise.all([
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
              references("cat-hilos") || references("cat-tijeras") ||
              references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
              title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )])`),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
              references("cat-hilos") ||
              references(*[_type == "category" && (slug.current in ["hilos", "hilo-de-coser-40-02-colombia-categoria"])]._id) ||
              title match "*hilo*" || slug.current match "*hilo*"
            )])`),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && (
              references("cat-tijeras") ||
              references(*[_type == "category" && (slug.current in ["tijeras", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
              title match "*tijera*" || slug.current match "*tijera*"
            )])`)
          ]);

          const insumosCats = [
            { id: "insumos", name: "Todos los Insumos", slug: "insumos", icon: Package, count: totalInsumos },
            { id: "hilos", name: "Hilos", slug: "hilos", icon: CircleDot, count: hilosCount },
            { id: "tijeras", name: "Tijeras", slug: "tijeras", icon: Scissors, count: tijerasCount },
          ];
          setCategories(insumosCats);
        } else {
          const [data, totalTelas] = await Promise.all([
            client.fetch(groq`
              *[_type == "category" && coalesce(isActive, true) == true && !(slug.current in ["tijeras", "hilos", "insumos", "sudaderas", "sudadera", "telas-para-sudaderas-sweaters", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"]) && !(title match "*sudadera*" || slug.current match "*sudadera*")] {
                "id": slug.current,
                name,
                "slug": slug.current,
                "count": count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
                  references("cat-hilos") || references("cat-tijeras") ||
                  references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
                  title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
                ) && references(^._id)])
              }
            `),
            client.fetch(groq`count(*[_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock" && !(
              references("cat-hilos") || references("cat-tijeras") ||
              references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
              title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )])`)
          ]);

          const allCat = { id: "todos", name: "Todos", slug: "todos", icon: Tag, count: totalTelas };
          const filtered = data.filter((cat: any) => cat.count > 0);
          const mapped = filtered.map((cat: any) => ({
            ...cat,
            icon: categoryIcons[cat.slug] || Package
          }));

          setCategories([allCat, ...mapped]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [isInsumosView]);

  // Sync active category
  useEffect(() => {
    if (categoryParam) {
      const lower = categoryParam.toLowerCase();
      if (lower === "todos" || lower === "telas" || lower === "insumos" || lower === "hilos" || lower === "tijeras") {
        if (activeCategory !== lower) {
          setActiveCategory(lower);
        }
        return;
      }

      if (categories.length > 0) {
        const match = categories.find(c =>
          c.slug === categoryParam ||
          c.slug.toLowerCase().includes(categoryParam.toLowerCase()) ||
          c.name.toLowerCase().includes(categoryParam.toLowerCase())
        );
        if (match && match.slug !== activeCategory) {
          setActiveCategory(match.slug);
        }
      }
    }
  }, [categoryParam, categories, activeCategory]);

  // Fetch Products from Sanity
  const [allProducts, setAllProducts] = useState<any[]>(initialProducts || [])
  const [loadingProducts, setLoadingProducts] = useState(!initialProducts)
  const [errorProducts, setErrorProducts] = useState<string | null>(null)

  // Use a ref to prevent double fetching on initial load if we have initial products
  const hasFetchedInitialRef = useRef(false)

  useEffect(() => {
    const fetchProducts = async () => {
      // Skip fetching on mount only if we have matching initial products and haven't fetched yet
      if (initialProducts && initialProducts.length > 0 && !hasFetchedInitialRef.current) {
        hasFetchedInitialRef.current = true
        return
      }
      
      setLoadingProducts(true)
      try {
        let conditions = `_type == "product" && stockStatus != "outOfStock" && stock_status != "outofstock"`
        
        if (isInsumosView) {
          if (activeCategory === 'hilos' || activeCategory?.includes('hilo')) {
            conditions += ` && (references("cat-hilos") || references(*[_type == "category" && (slug.current in ["hilos", "hilo-de-coser-40-02-colombia-categoria"])]._id) || title match "*hilo*" || slug.current match "*hilo*")`
          } else if (activeCategory === 'tijeras' || activeCategory?.includes('tijera')) {
            conditions += ` && (references("cat-tijeras") || references(*[_type == "category" && (slug.current in ["tijeras", "tijeras-corte-profesional-colombia-categoria"])]._id) || title match "*tijera*" || slug.current match "*tijera*")`
          } else {
            // 'insumos' - all insumos
            conditions += ` && (
              references("cat-hilos") || references("cat-tijeras") ||
              references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
              title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
            )`
          }
        } else {
          // Telas mode - STRICT EXCLUSION OF INSUMOS
          conditions += ` && !(
            references("cat-hilos") || references("cat-tijeras") ||
            references(*[_type == "category" && (slug.current in ["tijeras", "hilos", "insumos", "hilo-de-coser-40-02-colombia-categoria", "tijeras-corte-profesional-colombia-categoria"])]._id) ||
            title match "*tijera*" || title match "*hilo*" || slug.current match "*tijera*" || slug.current match "*hilo*"
          )`

          if (activeCategory !== 'todos' && activeCategory !== 'telas') {
            conditions += ` && references(*[_type == "category" && (slug.current == $catSlug || slug.current match $catSlug)]._id)`
          }

          if (activeUso) {
            conditions += ` && references(*[_type == "usage" && slug.current == $usoSlug]._id)`
          }
        }

        if (effectiveSearch) {
          const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
          let searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter(w => !stopWords.includes(w) && w.length > 1)
          
          if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\\s+/).filter(Boolean)
          }

          searchWords.forEach((_, index) => {
            const pName = `search${index}`
            conditions += ` && (
              title match $${pName} || 
              description match $${pName} ||
              descriptionShort match $${pName} ||
              categories[]->name match $${pName} ||
              usages[]->title match $${pName} ||
              tones[]->title match $${pName} ||
              attributes[].value match $${pName} ||
              attributes[].name match $${pName}
            )`
          })
        }

        let query = `*[${conditions}]`

        query += `{
                _id,
                "name": title,
                "slug": slug.current,
                pricePerKilo,
                price,
                "sale_price": coalesce(salePrice, sale_price),
                "prices": {
                    "price": price,
                    "regular_price": price, 
                    "sale_price": coalesce(salePrice, sale_price)
                },
                "image": images[0],
                "imageAlt": images[0].alt,
                "lqip": images[0].asset->metadata.lqip,
                "images": images[]{ "src": asset->url + "?auto=format&w=600&q=70", "id": _key },
                "categories": categories[]->{ "id": _id, name, "slug": slug.current },
                "usages": usages[]->{ "id": _id, title, "slug": slug.current },
                "tones": tones[]->{ "id": _id, title, "slug": slug.current },
                "attributes": attributes[]{ name, "terms": [{ "name": value }] },
                stock_status,
                stockStatus,
                isVisible,
                short_description,
                weight,
                badge,
                _createdAt,
                tags[]->{ "id": _id, name, "slug": slug.current },
                "categorySlugs": categories[]->slug.current
            }`

        const paramsQuery: any = {}
        if (effectiveSearch) {
          const stopWords = ['tela', 'telas', 'para', 'de', 'la', 'el', 'las', 'los', 'en', 'y', 'con']
          let searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter((w: string) => !stopWords.includes(w) && w.length > 1)
          
          if (searchWords.length === 0) {
            searchWords = effectiveSearch.toLowerCase().split(/\s+/).filter(Boolean)
          }

          searchWords.forEach((word: string, index: number) => {
            paramsQuery[`search${index}`] = `*${word}*`
          })
        }
        if (activeCategory !== 'todos' && activeCategory !== 'telas') paramsQuery.catSlug = activeCategory
        if (activeUso) paramsQuery.usoSlug = activeUso

        console.log("GROQ Query FetchProducts:", query);
        console.log("Params FetchProducts:", paramsQuery);

        const data = await client.fetch(query, paramsQuery)
        console.log("Data length FetchProducts:", data.length);

        // Map to match component expectation
        const mapped = data.map((p: any) => {
          // Lógica opt-out: agotado SOLO si está explícitamente marcado como outOfStock.
          // Productos sin stockStatus se consideran disponibles por defecto.
          const isStock =
            p.stockStatus !== 'outOfStock' &&
            p.stock_status !== 'outofstock';
          const scores = scoreProduct(p, salesMetrics || undefined);

          return {
            id: p._id,
            name: p.name,
            slug: p.slug,
            pricePerKilo: p.pricePerKilo,
            price: p.price,
            regularPrice: p.price,
            regular_price: p.price,
            salePrice: p.sale_price,
            sale_price: p.sale_price,
            image: p.image ? urlFor(p.image).width(800).url() : "/placeholder.svg",
            imageAlt: p.imageAlt,
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
            badge: p.badge,
            _createdAt: p._createdAt,
            tags: p.tags || [],
            categorySlugs: p.categorySlugs,
            ...scores
          }
        })

        setAllProducts(mapped)

        const calcMax = mapped.reduce((max: number, p: any) => {
          const currentPrice = p.sale_price || p.price || 0;
          return currentPrice > max ? currentPrice : max;
        }, 0);
        const newMax = Math.max(calcMax, 10000);
        
        setMaxPrice(prevMax => {
          setPriceRange(prevRange => {
             if (prevRange[1] === prevMax || prevRange[1] === 17000 || prevRange[1] === 100000) {
               return [prevRange[0], newMax];
             }
             return prevRange;
          });
          return newMax;
        });
      } catch (e: any) {
        setErrorProducts(e.message)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [activeCategory, effectiveSearch, activeUso, activeTono, activeTipo])

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
      console.log('Atributos del primer producto:', allProducts[0].attributes.map((attr: any) => attr.name))
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

    filtered = filtered.filter((product) => {
      const currentPrice = product.sale_price || product.price
      return currentPrice >= priceRange[0] && currentPrice <= priceRange[1]
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

    // Filtrar por Avatar o Uso Activo
    const currentActiveAvatarObj = avatars.find(a => a._id === activeAvatar || a.id === activeAvatar)

    if (currentActiveAvatarObj) {
      filtered = filtered.filter(product => {
        // 1. Si el tipo es uso
        if (currentActiveAvatarObj.filterType === 'usage' && currentActiveAvatarObj.usageSlug) {
          const cleanUsage = currentActiveAvatarObj.usageSlug.replace('/usos/', '').toLowerCase()
          const hasUsage = product.usages?.some((u: any) =>
            u._id === currentActiveAvatarObj.usageId ||
            u.slug === currentActiveAvatarObj.usageSlug ||
            u.slug?.replace('/usos/', '').toLowerCase() === cleanUsage ||
            (u.title && currentActiveAvatarObj.usageTitle && u.title.toLowerCase() === currentActiveAvatarObj.usageTitle.toLowerCase())
          )
          if (hasUsage) return true
        }

        // 2. Si el tipo es categoría
        if (currentActiveAvatarObj.filterType === 'category' && currentActiveAvatarObj.categorySlug) {
          const hasCat = product.categories?.some((c: any) =>
            c._id === currentActiveAvatarObj.categoryId ||
            c.slug === currentActiveAvatarObj.categorySlug ||
            (c.name && currentActiveAvatarObj.categoryName && c.name.toLowerCase() === currentActiveAvatarObj.categoryName.toLowerCase())
          )
          if (hasCat) return true
        }

        // 3. Filtro personalizado o búsqueda por término
        const customTerm = (currentActiveAvatarObj.customFilter || currentActiveAvatarObj.title || '').trim()
        if (customTerm) {
          const normTerm = customTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

          // Coincidencia en título
          const normTitle = (product.name || product.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          if (normTitle.includes(normTerm)) return true

          // Coincidencia en categorías
          const inCat = product.categories?.some((c: any) =>
            (c.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normTerm) ||
            (c.slug || "").includes(normTerm)
          )
          if (inCat) return true

          // Coincidencia en usos
          const inUsage = product.usages?.some((u: any) =>
            (u.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normTerm) ||
            (u.slug || "").includes(normTerm)
          )
          if (inUsage) return true

          // Coincidencia en etiquetas
          const inTag = product.tags?.some((t: any) =>
            (t.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normTerm) ||
            (t.slug || "").includes(normTerm)
          )
          if (inTag) return true

          // Coincidencia en atributos
          const inAttr = product.attributes?.some((a: any) =>
            (a.name || "").toLowerCase().includes(normTerm) ||
            (a.value || (a.terms && a.terms[0]?.name) || "").toLowerCase().includes(normTerm)
          )
          if (inAttr) return true
        }

        return false
      })
    } else if (activeUso) {
      filtered = filtered.filter(product => {
        // 1. Clean up param: remove "/usos/" prefix if present
        const searchTerm = activeUso.replace('/usos/', '').toLowerCase();

        // 2. Check references (if they exist)
        const hasReference = product.usages?.some((usage: any) =>
          usage.slug === activeUso || usage.slug === searchTerm
        );
        if (hasReference) return true;

        // 3. Check Categories (slug or name)
        const hasInCategories = product.categories?.some((cat: any) =>
          cat.slug?.includes(searchTerm) ||
          cat.name?.toLowerCase().includes(searchTerm)
        );
        if (hasInCategories) return true;

        // 4. Check Tags
        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug?.includes(searchTerm) ||
          tag.name?.toLowerCase().includes(searchTerm)
        );

        return hasInCategories || hasInTags;
      })
    }

    // Filtrar por Tono (desde URL)
    if (activeTono) {
      filtered = filtered.filter(product => {
        // 1. Clean up param: remove "/tonos/" prefix if present
        const searchTerm = activeTono.replace('/tonos/', '').toLowerCase();

        // 2. Check references
        const hasReference = product.tones?.some((tone: any) =>
          tone.slug === activeTono || tone.slug === searchTerm
        );
        if (hasReference) return true;

        // 3. Fallback: categories
        const hasInCategories = product.categories?.some((cat: any) =>
          cat.slug.includes(searchTerm) ||
          cat.slug.includes(`tonos-${searchTerm}`) ||
          cat.name.toLowerCase().includes(searchTerm)
        );

        // 4. Fallback: tags
        const hasInTags = product.tags?.some((tag: any) =>
          tag.slug?.includes(searchTerm) ||
          tag.name?.toLowerCase().includes(searchTerm)
        );

        // 5. Fallback: title match (e.g. "Acetato Azul")
        const hasInTitle = product.name.toLowerCase().includes(searchTerm);

        return hasInCategories || hasInTags || hasInTitle;
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

    // Ordenar con algoritmo de ranking
    return rankProducts(filtered, sortBy, salesMetrics || undefined)
  }, [allProducts, activeCategory, activeAvatar, activeUso, avatars, activeTono, activeTipo, priceRange, selectedWidths, selectedElasticities, selectedWeights, selectedCompositions, selectedWeightRanges, sublimableFilter, sortBy, salesMetrics])

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

  // Función para hacer scroll en el carrusel de categorías
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

  // Actualizar estado de botones de scroll de categorías
  const updateScrollButtons = () => {
    if (!carouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Escuchar cambios en el scroll de categorías
  const handleScroll = () => {
    updateScrollButtons()
  }

  // Función para hacer scroll en el carrusel de Usos (Avatares)
  const scrollUsagesCarousel = (direction: 'left' | 'right') => {
    if (!usagesCarouselRef.current) return

    const scrollAmount = usagesCarouselRef.current.clientWidth * 0.75
    const newScrollLeft = direction === 'left'
      ? usagesCarouselRef.current.scrollLeft - scrollAmount
      : usagesCarouselRef.current.scrollLeft + scrollAmount

    usagesCarouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  // Actualizar estado de botones de scroll de Usos
  const updateUsagesScrollButtons = () => {
    if (!usagesCarouselRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = usagesCarouselRef.current
    setCanScrollUsagesLeft(scrollLeft > 5)
    setCanScrollUsagesRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  // Escuchar cambios en el scroll de Usos
  const handleUsagesScroll = () => {
    updateUsagesScrollButtons()
  }

  // Sincronizar visibilidad de flechas al cambiar datos y redimensionar pantalla
  useEffect(() => {
    updateUsagesScrollButtons()
    updateScrollButtons()
    const handleResize = () => {
      updateUsagesScrollButtons()
      updateScrollButtons()
    }
    window.addEventListener('resize', handleResize)
    const timeout = setTimeout(() => {
      updateUsagesScrollButtons()
      updateScrollButtons()
    }, 400)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [avatars, usages, categories])

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
                <h1 className="text-4xl md:text-5xl font-light mb-4 text-balance">
                  {isInsumosView 
                    ? "Insumos y Accesorios" 
                    : sortBy === "best-sellers"
                    ? "Lo Más Vendido"
                    : sortBy === "trending"
                    ? "En Tendencia"
                    : sortBy === "sale"
                    ? "Promociones y Ofertas"
                    : "Nuestra Tienda"
                  }
                </h1>
                <p className="text-lg font-light text-muted-foreground text-pretty max-w-2xl">
                  {isInsumosView 
                    ? "Explora nuestro catálogo de hilos, tijeras y herramientas de confección"
                    : sortBy === "best-sellers"
                    ? "Descubre los textiles favoritos con mayor volumen de compra y preferencia"
                    : sortBy === "trending"
                    ? "Explora las telas más populares, novedades y artículos con alta demanda actual"
                    : sortBy === "sale"
                    ? "Aprovecha descuentos y precios especiales en telas seleccionadas"
                    : "Explora nuestro catálogo completo de telas de alta calidad"
                  }
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
                    <a 
                      href={getWhatsAppUrl(homeData?.whatsappSettings?.whatsappNumber, "Hola, tengo dudas sobre una compra en Telas Real y me gustaría recibir asesoría.")} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
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

        {/* Sección de Usos (Avatares) - Solo para Telas */}
        {!isInsumosView && (
          <section className="py-8 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="relative">
                {/* Botón scroll izquierda Usos */}
                {canScrollUsagesLeft && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollUsagesCarousel('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-900/90 hover:bg-white text-foreground shadow-md rounded-full h-8 w-8 md:h-10 md:w-10 border border-border transition-transform active:scale-95"
                    aria-label="Desplazar a la izquierda"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                )}

                {loadingAvatars ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div 
                    ref={usagesCarouselRef}
                    onScroll={handleUsagesScroll}
                    className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pt-5 pb-5 px-6 md:px-8 touch-pan-x snap-x snap-mandatory items-center"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {avatars.map((avatar) => {
                      const active = isAvatarActive(avatar)
                      const avatarSrc = avatar.imageUrl || (avatar.image ? urlFor(avatar.image).width(220).format('webp').quality(75).url() : undefined) || `/avatares/${avatar.id.replace('avatar-', '')}.webp` || "/placeholder-logo.svg"
                      
                      return (
                        <button
                          key={avatar._id || avatar.id}
                          onClick={() => handleAvatarClick(avatar)}
                          className="flex flex-col items-center gap-2 flex-shrink-0 w-[115px] md:w-[125px] snap-start focus:outline-none group p-1"
                          aria-label={`Filtrar por ${avatar.title}`}
                        >
                          <div className={`w-[98px] h-[98px] md:w-[108px] md:h-[108px] rounded-2xl flex items-center justify-center p-1.5 transition-all duration-200 ${
                            active 
                              ? 'border-2 border-primary bg-primary/10 shadow-md shadow-primary/20' 
                              : 'border-2 border-transparent group-hover:border-border/60 bg-muted/20 group-hover:bg-muted/40'
                          }`}>
                            <img 
                              src={avatarSrc} 
                              alt={avatar.title} 
                              width={110}
                              height={110}
                              className="w-full h-full object-contain select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
                              loading="eager"
                              decoding="async"
                            />
                          </div>
                          <span className={`text-xs md:text-sm text-center leading-tight transition-colors duration-200 line-clamp-2 ${
                            active 
                              ? 'font-bold text-primary' 
                              : 'font-medium text-foreground group-hover:text-primary'
                          }`}>
                            {avatar.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Botón scroll derecha Usos */}
                {canScrollUsagesRight && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => scrollUsagesCarousel('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-900/90 hover:bg-white text-foreground shadow-md rounded-full h-8 w-8 md:h-10 md:w-10 border border-border transition-transform active:scale-95"
                    aria-label="Desplazar a la derecha"
                  >
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
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
        )}

        <section className="py-8 border-b border-border bg-muted/20">
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
                          setActiveUso(null)
                          setActiveAvatar(null)
                          const newUrl = category.id === 'todos' 
                            ? '/tienda' 
                            : (category.id === 'insumos' || category.id === 'hilos' || category.id === 'tijeras')
                            ? `/tienda?categoria=${category.id}`
                            : `/tienda/${category.id}`
                          window.history.pushState(null, '', newUrl)
                        }}
                        className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-md transition-colors flex-shrink-0 min-w-[100px] h-[60px] ${(activeCategory === category.id || (activeCategory === "telas" && category.id === "todos"))
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                      >
                        <span className="text-sm font-light text-center">{category.name}</span>
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
            {!isInsumosView && activeCategory !== "todos" && activeCategory !== "telas" && (
              <div className="mb-8">
                <FabricUsesCarousel category={activeCategory} />
              </div>
            )}

            {/* Active URL Filters Badges */}
            {(activeAvatar || activeUso || activeTono || activeTipo) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm font-medium text-muted-foreground mr-2">Filtros activos:</span>

                {currentActiveAvatarObj && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    <span className="font-medium">
                      {currentActiveAvatarObj.title}
                    </span>
                    <button
                      onClick={() => {
                        setActiveAvatar(null)
                        setActiveUso(null)
                        removeFilterParam("avatar")
                        removeFilterParam("uso")
                      }}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="Quitar filtro de avatar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {activeUso && !currentActiveAvatarObj && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    <span className="font-medium capitalize">
                      {activeUso.replace('/usos/', '').replace(/-/g, ' ')}
                    </span>
                    <button
                      onClick={() => removeFilterParam("uso")}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {activeTono && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    <span className="font-medium capitalize">
                      {activeTono.replace('/tonos/', '').replace(/-/g, ' ')}
                    </span>
                    <button
                      onClick={() => removeFilterParam("tono")}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {activeTipo && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                    <span className="font-medium capitalize">
                      {activeTipo.replace(/-/g, ' ')}
                    </span>
                    <button
                      onClick={() => removeFilterParam("tipo")}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className={`flex flex-col lg:flex-row gap-8`}>
              <aside className="hidden lg:block lg:w-72 space-y-6 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                    Precio
                    <ChevronDown className="h-4 w-4" />
                  </h2>
                  <div className="space-y-4">
                    <Slider
                      min={0}
                      max={maxPrice}
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
                  <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                    Ancho
                    <ChevronDown className="h-4 w-4" />
                  </h2>
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
                    <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                      Elasticidad Tela
                      <ChevronDown className="h-4 w-4" />
                    </h2>
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
                    <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                      Composición
                      <ChevronDown className="h-4 w-4" />
                    </h2>
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
                  <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                    Peso
                    <ChevronDown className="h-4 w-4" />
                  </h2>
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
                  <h2 className="text-lg font-light mb-4 flex items-center justify-between">
                    Sublimable
                    <ChevronDown className="h-4 w-4" />
                  </h2>
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
                {/* Active collection banner if sort is active */}
                {sortBy === "best-sellers" && (
                  <div className="mb-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">Colección: Lo Más Vendido</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Mostrando los textiles preferidos ordenados por popularidad y volumen de compras.</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSortChange("default")}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Quitar
                    </Button>
                  </div>
                )}

                {sortBy === "trending" && (
                  <div className="mb-6 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">Colección: En Tendencia</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Mostrando las telas con mayor demanda reciente y novedades del mercado.</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSortChange("default")}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Quitar
                    </Button>
                  </div>
                )}

                {sortBy === "sale" && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <Tag className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">Colección: Ofertas y Promociones</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Mostrando telas con rebajas activas y precios especiales.</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleSortChange("default")}
                      className="text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <X className="h-3.5 w-3.5" /> Quitar
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mb-6 lg:hidden pb-16">
                  <Button variant="outline" onClick={() => setMobileFiltersOpen(true)} className="flex-1 gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex-1 gap-2 bg-transparent text-xs sm:text-sm">
                        <ArrowUpDown className="h-4 w-4" />
                        {sortLabelMap[sortBy] || "Ordenar por"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleSortChange("best-sellers")} className={sortBy === "best-sellers" ? "font-bold text-primary" : ""}>
                        <Flame className="h-4 w-4 mr-2 text-amber-500" strokeWidth={1.5} />
                        Lo más vendido
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("trending")} className={sortBy === "trending" ? "font-bold text-primary" : ""}>
                        <Sparkles className="h-4 w-4 mr-2 text-purple-500" strokeWidth={1.5} />
                        En tendencia
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("sale")} className={sortBy === "sale" ? "font-bold text-primary" : ""}>
                        <Tag className="h-4 w-4 mr-2 text-rose-500" strokeWidth={1.5} />
                        En oferta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("newest")} className={sortBy === "newest" ? "font-bold text-primary" : ""}>
                        Más recientes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("price-asc")} className={sortBy === "price-asc" ? "font-bold text-primary" : ""}>
                        Menor precio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("price-desc")} className={sortBy === "price-desc" ? "font-bold text-primary" : ""}>
                        Mayor precio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("name-asc")} className={sortBy === "name-asc" ? "font-bold text-primary" : ""}>
                        A-Z
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("name-desc")} className={sortBy === "name-desc" ? "font-bold text-primary" : ""}>
                        Z-A
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("oldest")} className={sortBy === "oldest" ? "font-bold text-primary" : ""}>
                        Más antiguos
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="hidden lg:flex justify-between items-center mb-6">
                  <p className="text-sm font-light text-muted-foreground">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, displayProducts.length)} de {displayProducts.length} productos
                    {activeCategory !== "todos" && activeCategory !== "telas" && (
                      <span className="ml-1">en {categories.find(c => c.id === activeCategory)?.name}</span>
                    )}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent text-xs sm:text-sm">
                        <ArrowUpDown className="h-4 w-4" />
                        {sortLabelMap[sortBy] ? `Ordenar: ${sortLabelMap[sortBy]}` : "Ordenar por"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => handleSortChange("best-sellers")} className={sortBy === "best-sellers" ? "font-bold text-primary" : ""}>
                        <Flame className="h-4 w-4 mr-2 text-amber-500" strokeWidth={1.5} />
                        Lo más vendido
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("trending")} className={sortBy === "trending" ? "font-bold text-primary" : ""}>
                        <Sparkles className="h-4 w-4 mr-2 text-purple-500" strokeWidth={1.5} />
                        En tendencia
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("sale")} className={sortBy === "sale" ? "font-bold text-primary" : ""}>
                        <Tag className="h-4 w-4 mr-2 text-rose-500" strokeWidth={1.5} />
                        En oferta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("newest")} className={sortBy === "newest" ? "font-bold text-primary" : ""}>
                        Más recientes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("price-asc")} className={sortBy === "price-asc" ? "font-bold text-primary" : ""}>
                        Menor precio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("price-desc")} className={sortBy === "price-desc" ? "font-bold text-primary" : ""}>
                        Mayor precio
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("name-asc")} className={sortBy === "name-asc" ? "font-bold text-primary" : ""}>
                        A-Z
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("name-desc")} className={sortBy === "name-desc" ? "font-bold text-primary" : ""}>
                        Z-A
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSortChange("oldest")} className={sortBy === "oldest" ? "font-bold text-primary" : ""}>
                        Más antiguos
                      </DropdownMenuItem>
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
                          slug={product.slug}
                          name={product.name}
                          price={product.price}
                          regularPrice={product.regularPrice}
                          salePrice={product.salePrice}
                          image={product.image}
                          imageAlt={product.imageAlt}
                          blurDataURL={product.blurDataURL}
                          priority={index < 6}
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          pricePerKilo={product.pricePerKilo}
                          is_in_stock={product.is_in_stock}
                          badge={product.badge}
                          categorySlugs={product.categorySlugs}
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
        maxPrice={maxPrice}
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

export default function TiendaPage({ urlCategory, urlSearch, initialCategories, initialProducts, initialUsages, initialAvatars, initialSort, initialSalesMetrics }: TiendaProps) {
  return (
    <Suspense fallback={<div className="container mx-auto py-20 text-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <TiendaContent 
        urlCategory={urlCategory} 
        urlSearch={urlSearch} 
        initialCategories={initialCategories}
        initialProducts={initialProducts}
        initialUsages={initialUsages}
        initialAvatars={initialAvatars}
        initialSort={initialSort}
        initialSalesMetrics={initialSalesMetrics}
      />
    </Suspense>
  )
}
