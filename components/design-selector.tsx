"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, Check, Loader2 } from "lucide-react"

interface DesignImage {
  url: string
  id: string
  name: string
  folder: string
}

interface DesignSelectorProps {
  onDesignSelect: (category: string, design: string, isCustom: boolean) => void
  initialCategory?: string
}

const CATEGORIES = [
  { id: "TM", name: "TM" },
  { id: "TLF", name: "TLF" },
  { id: "TB", name: "TB" },
  { id: "COLECCION_2025_TL", name: "Colección 2025 TL" },
  { id: "COLECCION_2024_TL", name: "Colección 2024 TL" },
  { id: "COLECCION_2023_TL", name: "Colección 2023 TL" },
  { id: "COLECCION_2025_TM", name: "Coleccion 2025 TM" },
]

export function DesignSelector({ onDesignSelect, initialCategory = "TM" }: DesignSelectorProps) {
  const [category, setCategory] = useState<string>(initialCategory)
  const [images, setImages] = useState<DesignImage[]>([])
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [selectedDesign, setSelectedDesign] = useState<string | null>(null)
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customPreview, setCustomPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when category changes
  useEffect(() => {
    if (category === "personalizado") {
      setImages([])
      return
    }

    setImages([])
    setOffset(0)
    setHasMore(true)
    loadImages(0, category)
  }, [category])

  const loadImages = async (currentOffset: number, currentCategory: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/designs?limit=20&offset=${currentOffset}&folder=${currentCategory}`
      )
      if (!response.ok) throw new Error("Failed to load designs")

      const data = await response.json()

      if (currentOffset === 0) {
        setImages(data.images)
      } else {
        setImages(prev => [...prev, ...data.images])
      }

      setHasMore(data.hasMore)
    } catch (error) {
      console.error("Error loading designs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const newOffset = offset + 20
    setOffset(newOffset)
    loadImages(newOffset, category)
  }

  const handleImageSelect = (image: DesignImage) => {
    setSelectedDesign(image.url)
    setCustomFile(null)
    setCustomPreview(null)
    onDesignSelect(category, image.url, false)
  }

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      setCustomFile(file)
      // Use the URL returned from server for preview and selection
      setCustomPreview(data.url)
      setSelectedDesign(null)
      onDesignSelect("Personalizado", data.url, true)

    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error al subir la imagen. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
      <div className="space-y-2">
        <Label className="text-base font-bold text-zinc-700 dark:text-zinc-200">
          Categoría
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          ¿Tu diseño sublimado no está disponible? Pídelo desde 10 metros en la sección de Personalizado.
        </p>

        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val)
            setSelectedDesign(null)
            setCustomFile(null)
            setCustomPreview(null)
          }}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category === "personalizado" ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleCustomUpload}
          />

          {customPreview ? (
            <div className="space-y-4">
              <div className="relative w-40 h-40 mx-auto rounded-lg overflow-hidden border border-border">
                <Image
                  src={customPreview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-medium">{customFile?.name}</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar imagen
              </Button>
            </div>
          ) : (
            <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">Haz clic para subir tu diseño</p>
                <p className="text-sm text-muted-foreground">JPG, PNG o WEBP (Máx. 5MB)</p>
              </div>
              <Button variant="secondary">Seleccionar Archivo</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {images.length === 0 && !loading ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay diseños disponibles en esta categoría.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all group ${selectedDesign === image.url
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  onClick={() => handleImageSelect(image)}
                >
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                  {selectedDesign === image.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {hasMore && !loading && images.length > 0 && (
            <div className="text-center pt-2">
              <Button variant="ghost" onClick={handleLoadMore} size="sm">
                Cargar más diseños
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
