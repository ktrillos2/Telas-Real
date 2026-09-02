"use client"

import { useState, useEffect } from "react"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Upload, X, Check, Loader2, ChevronLeft, ChevronRight, FileText, Info, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { uploadPdfDesign, formatFileSize, type UploadProgress } from "@/lib/upload-utils"

interface DesignSelectorProps {
  onDesignSelect: (category: string, design: string, isCustom: boolean, fileName?: string) => void
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
  const [customFileName, setCustomFileName] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)

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
          "items": *[_type == "imagenSublimada" && isActive != false && (
            !defined($category) || $category == "TODOS" || $category == "todos" || category match $category
          ) ${searchFilter}] | order(_createdAt desc) [${start}...${end}] {
            _id,
            name,
            "imageUrl": image.asset->url + "?auto=format&w=400&q=70",
            category,
            subcategory
          },
          "total": count(*[_type == "imagenSublimada" && isActive != false && (
             !defined($category) || $category == "TODOS" || $category == "todos" || category match $category
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

  // Custom File Drop
  const onDrop = (acceptedFiles: File[], fileRejections: any[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setCustomFile(file)
      setCustomFileName(file.name)
      return
    }

    // Fallback: If react-dropzone rejected the file due to MIME detection issues on certain OS,
    // but the file extension is .pdf, accept it
    if (fileRejections.length > 0) {
      const rejectedFile = fileRejections[0]?.file
      if (rejectedFile && rejectedFile.name && rejectedFile.name.toLowerCase().endsWith('.pdf')) {
        setCustomFile(rejectedFile)
        setCustomFileName(rejectedFile.name)
        return
      }

      const isTooLarge = fileRejections[0]?.errors?.some((e: any) => e.code === 'file-too-large')
      if (isTooLarge) {
        toast.error("El archivo excede el tamaño máximo permitido de 50 MB.")
      } else {
        toast.error("Por favor, sube tu diseño en formato PDF (.pdf).")
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf', '.PDF'],
      'application/x-pdf': ['.pdf', '.PDF'],
      'application/acrobat': ['.pdf', '.PDF'],
      'applications/vnd.pdf': ['.pdf', '.PDF'],
      'text/pdf': ['.pdf', '.PDF'],
      'text/x-pdf': ['.pdf', '.PDF']
    },
    maxSize: 50 * 1024 * 1024,
    maxFiles: 1
  })

  // Handle Custom Design Save
  const handleSaveCustomDesign = async () => {
    if (!customFile) {
      toast.error("Por favor selecciona un archivo PDF primero.")
      return
    }

    setIsUploading(true)
    setUploadProgress({
      percent: 0,
      stage: 'uploading',
      loaded: 0,
      total: customFile.size,
    })

    try {
      const data = await uploadPdfDesign(customFile, {
        onProgress: (progress) => {
          setUploadProgress(progress)
        }
      })

      if (data && data.url) {
        setSelectedDesignId("custom")
        const resolvedFileName = customFileName || data.filename || "Diseño Personalizado.pdf"
        onDesignSelect("Personalizado", data.url, true, resolvedFileName)
        setIsUploadModalOpen(false)
        setCustomFile(null)
        setCustomFileName(null)
        toast.success("Diseño PDF subido correctamente")
      }
    } catch (err: any) {
      console.error("Error al subir diseño:", err)
      toast.error(err?.message || "Error al subir el archivo")
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  // Handle Design Selection
  const handleSelect = (design: any) => {
    setSelectedDesignId(design._id)
    setCustomFile(null)
    setCustomFileName(null)
    onDesignSelect(design.category || "Sublimado", design.imageUrl, false, design.name)
  }

  const clearSelection = () => {
    setSelectedDesignId(null)
    setCustomFile(null)
    setCustomFileName(null)
    onDesignSelect("", "", false)
  }

  const totalPages = Math.ceil(totalDesigns / ITEMS_PER_PAGE)

  // Clear file state when modal is closed without saving
  useEffect(() => {
    if (!isUploadModalOpen && selectedDesignId !== "custom") {
      setCustomFile(null)
      setCustomFileName(null)
    }
  }, [isUploadModalOpen, selectedDesignId])


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
        {(selectedDesignId || (selectedDesignId === "custom" && customFileName)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-muted/30 rounded-lg border border-primary/20 flex items-center gap-4"
          >
            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-white border border-border flex items-center justify-center">
              {selectedDesignId === "custom" ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : (
                <Image
                  src={designs.find(d => d._id === selectedDesignId)?.imageUrl || "/placeholder.svg"}
                  alt="Selected"
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">
                {selectedDesignId === "custom" ? "Diseño Personalizado" : designs.find(d => d._id === selectedDesignId)?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedDesignId === "custom" ? customFileName : "Seleccionado de la galería"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
        {/* Upload Button Card (Triggers Modal) */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <div
              className={`relative w-full h-full border-2 border-dashed rounded-full flex flex-col items-center justify-center p-1 cursor-pointer transition-all duration-300 aspect-square text-center gap-1 group
                ${selectedDesignId === 'custom'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'}`}
            >
              <div className="p-1.5 rounded-full bg-muted group-hover:bg-background transition-colors">
                <Upload className="h-4 w-4" />
              </div>
              <div className="space-y-0 text-[10px] leading-tight">
                <p className="font-semibold">Subir</p>
                <p className="opacity-70">diseño</p>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sube tu diseño personalizado</DialogTitle>
              <DialogDescription>
                Asegúrate de que tu archivo cumple con los requisitos para una sublimación perfecta.
              </DialogDescription>
            </DialogHeader>

            {/* Requirements & Important Info Box */}
            <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-4 my-2 space-y-3.5">
              <div>
                <h4 className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-sm mb-2.5">
                  <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> Requisitos del Archivo
                </h4>
                <ul className="space-y-2 text-amber-900/80 dark:text-amber-200/80 text-xs sm:text-sm ml-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Formato:</strong> Archivo PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Medidas:</strong> 150 cm de ancho x máximo 1 m de largo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Diseño:</strong> Replicable (que pueda repetirse sin cortes visibles)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-amber-200/70 dark:border-amber-800/40">
                <h4 className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-sm mb-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> Información importante:
                </h4>
                <ul className="space-y-2 text-amber-900/80 dark:text-amber-200/80 text-xs sm:text-sm ml-1">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Pedido mínimo para sublimación:</strong> 10 metros en adelante.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>Se realiza una muestra de <strong>20 x 20 cm</strong> para aprobación antes de producir el pedido completo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Tiempo de entrega:</strong> 5 a 8 días hábiles después de aprobada la muestra.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Dropzone Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              {customFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary/10 text-primary rounded-full">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground max-w-sm truncate">{customFileName}</p>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {formatFileSize(customFile.size)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Haz clic o arrastra otro archivo para cambiarlo</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-muted rounded-full">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Arrastra tu archivo PDF aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">Solo formato PDF (.pdf) hasta 50 MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Real-time Progress Bar */}
            {isUploading && (
              <div className="space-y-2 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-foreground flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                    {uploadProgress?.stage === 'processing'
                      ? 'Procesando en el servidor...'
                      : `Subiendo archivo (${uploadProgress?.percent || 0}%)...`}
                  </span>
                  <span className="text-primary font-semibold">
                    {uploadProgress?.percent || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${Math.max(uploadProgress?.percent || 0, 5)}%` }}
                  />
                </div>
                {uploadProgress?.total ? (
                  <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                    <span>
                      {uploadProgress.stage === 'processing'
                        ? 'Guardando archivo en Sanity...'
                        : 'Transfiriendo datos...'}
                    </span>
                    <span>
                      {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCustomDesign}
                disabled={!customFile || isUploading}
                className="gap-2 min-w-[140px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress?.stage === 'processing' ? 'Procesando...' : `Subiendo ${uploadProgress?.percent || 0}%`}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar Diseño
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
