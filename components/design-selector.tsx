
"use client"

import { useState, useEffect } from "react"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Upload, X, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"

interface DesignSelectorProps {
  onDesignSelect: (category: string, design: string, isCustom: boolean) => void
  category?: string
}

export function DesignSelector({ onDesignSelect, category }: DesignSelectorProps) {
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [totalDesigns, setTotalDesigns] = useState(0)
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null)

  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customPreview, setCustomPreview] = useState<string | null>(null)

  const ITEMS_PER_PAGE = 40

  // Fetch Designs
  useEffect(() => {
    const fetchDesigns = async () => {
      setLoading(true)
      try {
        const start = page * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE

        const searchFilter = searchTerm ? `&& (name match $search + "*" || category match $search + "*" || subcategory match $search + "*")` : ""
        
        const query = groq`{
          "items": *[_type == "imagenSublimada" && (
            !defined($category) || category match $category
          ) ${searchFilter}] | order(_createdAt desc) [${start}...${end}] {
            _id,
            name,
            "imageUrl": image.asset->url,
            category,
            subcategory
          },
          "total": count(*[_type == "imagenSublimada" && (
             !defined($category) || category match $category
          ) ${searchFilter}])
        }`

        const data = await client.fetch(query, { search: searchTerm, category: category || null })
        setDesigns(data.items)
        setTotalDesigns(data.total)
      } catch (error) {
        console.error("Error fetching designs:", error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchDesigns()
    }, 500) // Debounce search

    return () => clearTimeout(timer)
  }, [searchTerm, page, category])

  // Custom File Upload
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setCustomFile(file)
      const previewUrl = URL.createObjectURL(file)
      setCustomPreview(previewUrl)
      setSelectedDesignId("custom")
      onDesignSelect("Personalizado", previewUrl, true)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  })

  // Handle Design Selection
  const handleSelect = (design: any) => {
    setSelectedDesignId(design._id)
    setCustomFile(null)
    setCustomPreview(null)
    onDesignSelect(design.category || "Sublimado", design.imageUrl, false)
  }

  const clearSelection = () => {
    setSelectedDesignId(null)
    setCustomFile(null)
    setCustomPreview(null)
    onDesignSelect("", "", false)
  }

  const totalPages = Math.ceil(totalDesigns / ITEMS_PER_PAGE)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl font-medium">Selecciona tu Diseño</h3>
          <p className="text-sm text-muted-foreground">Elige de nuestra galería o sube tu propia imagen</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar diseño..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(0) // Reset to first page
            }}
          />
        </div>
      </div>

      {/* Selected Preview (if any) */}
      <AnimatePresence>
        {(selectedDesignId || customPreview) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-muted/30 rounded-lg border border-primary/20 flex items-center gap-4"
          >
            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white border border-border">
              <Image
                src={customPreview || designs.find(d => d._id === selectedDesignId)?.imageUrl || "/placeholder.svg"}
                alt="Selected"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {customPreview ? "Diseño Personalizado" : designs.find(d => d._id === selectedDesignId)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {customPreview ? "Imagen subida por ti" : "Seleccionado de la galería"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
        {/* Upload Button Card */}
        <div
          {...getRootProps()}
          className={`relative w-full h-full border-2 border-dashed rounded-full flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-300 aspect-square text-center gap-1 group
            ${selectedDesignId === 'custom'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
        >
          <input {...getInputProps()} />
          <div className="p-1.5 rounded-full bg-muted group-hover:bg-background transition-colors">
            <Upload className="h-4 w-4" />
          </div>
          <div className="space-y-0 text-[10px] leading-tight">
            <p className="font-semibold">Subir</p>
            <p className="opacity-70">diseño</p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-full" />
          ))
        ) : (
          /* Designs Grid */
          designs.map((design) => (
            <div
              key={design._id}
              onClick={() => handleSelect(design)}
              className={`relative group cursor-pointer rounded-full overflow-hidden border-2 aspect-square transition-all
                    ${selectedDesignId === design._id ? 'border-primary ring-2 ring-primary/20 scale-95' : 'border-transparent hover:border-border'}`}
            >
              <Image
                src={design.imageUrl}
                alt={design.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 33vw, 15vw"
              />

              {/* Overlay Info */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-1 text-white text-center">
                <p className="text-[9px] font-medium line-clamp-2 leading-tight">{design.name}</p>
              </div>

              {/* Selected Check */}
              {selectedDesignId === design._id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="bg-primary text-white p-1 rounded-full shadow-md">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Siguiente <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
