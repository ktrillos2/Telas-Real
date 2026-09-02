"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Upload, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Info, 
  ShoppingCart, 
  MessageCircle, 
  FileText, 
  Plus, 
  Minus, 
  X, 
  Loader2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart } from "@/lib/contexts/CartContext"
import { useHomeDataContext } from "@/lib/contexts/HomeDataContext"
import { getWhatsAppUrl } from "@/lib/utils/whatsapp"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

export interface SublimatedFabric {
  _id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  sale_price?: number
  designSelectionEnabled?: boolean
  designCategory?: string
  customDesignCategory?: string
  image?: string
  categories?: { name: string; slug: string }[]
}

interface SublimacionWizardProps {
  fabrics: SublimatedFabric[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  embedded?: boolean
}

export function SublimacionWizard({ 
  fabrics = [], 
  isOpen, 
  onOpenChange,
  embedded = false
}: SublimacionWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [selectedFabric, setSelectedFabric] = useState<SublimatedFabric | null>(null)
  const [fabricSearch, setFabricSearch] = useState("")

  // Design state
  const [designs, setDesigns] = useState<any[]>([])
  const [loadingDesigns, setLoadingDesigns] = useState(false)
  const [designSearch, setDesignSearch] = useState("")
  const [designPage, setDesignPage] = useState(0)
  const [totalDesigns, setTotalDesigns] = useState(0)
  const [selectedDesign, setSelectedDesign] = useState<{
    id: string
    name: string
    imageUrl: string
    category: string
    isCustom: boolean
  } | null>(null)

  // Custom Upload state
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customFileName, setCustomFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Quantity state (minimum 10 meters)
  const [quantity, setQuantity] = useState(10)

  const { addItem } = useCart()
  const { data: homeData } = useHomeDataContext()
  const whatsappNumber = homeData?.whatsappSettings?.whatsappNumber || "573159021516"

  const DESIGNS_PER_PAGE = 48

  // Filter fabrics
  const filteredFabrics = useMemo(() => {
    if (!fabricSearch.trim()) return fabrics
    const q = fabricSearch.toLowerCase()
    return fabrics.filter(f => 
      f.name?.toLowerCase().includes(q) || 
      f.designCategory?.toLowerCase().includes(q)
    )
  }, [fabrics, fabricSearch])

  // Fetch designs when fabric is selected
  useEffect(() => {
    if (!selectedFabric) return

    const fetchDesigns = async () => {
      setLoadingDesigns(true)
      try {
        const start = designPage * DESIGNS_PER_PAGE
        const end = start + DESIGNS_PER_PAGE

        const categoryFilter = selectedFabric.designCategory 
          ? `&& category match $cat` 
          : ""

        const searchFilter = designSearch.trim() 
          ? `&& (name match $search + "*" || category match $search + "*" || subcategory match $search + "*")` 
          : ""

        const query = groq`{
          "items": *[_type == "imagenSublimada" && isActive != false ${categoryFilter} ${searchFilter}] | order(_createdAt desc) [${start}...${end}] {
            _id,
            name,
            "imageUrl": image.asset->url + "?auto=format&w=350&q=75",
            category,
            subcategory
          },
          "total": count(*[_type == "imagenSublimada" && isActive != false ${categoryFilter} ${searchFilter}])
        }`

        const data = await client.fetch(query, {
          cat: selectedFabric.designCategory || null,
          search: designSearch.trim() || null
        })

        setDesigns(data.items || [])
        setTotalDesigns(data.total || 0)
      } catch (err) {
        console.error("Error loading designs:", err)
      } finally {
        setLoadingDesigns(false)
      }
    }

    const timer = setTimeout(fetchDesigns, 300)
    return () => clearTimeout(timer)
  }, [selectedFabric, designPage, designSearch])

  // Dropzone for custom upload (ONLY PDF)
  const onDrop = (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      toast.error("Por favor, sube tu diseño únicamente en formato PDF.")
      return
    }
    const file = acceptedFiles[0]
    if (file) {
      setCustomFile(file)
      setCustomFileName(file.name)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  // Handle custom upload save
  const handleSaveCustomUpload = async () => {
    if (!customFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', customFile)

      const res = await fetch('/api/upload-design', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok && data.url) {
        setSelectedDesign({
          id: 'custom',
          name: customFileName || 'Diseño Personalizado',
          imageUrl: data.url,
          category: 'Personalizado',
          isCustom: true
        })
        setIsUploadModalOpen(false)
        toast.success("Diseño subido correctamente")
      } else {
        toast.error(data.error || "Error al subir el diseño")
      }
    } catch (err) {
      toast.error("Error al subir el diseño")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!selectedFabric) {
      toast.error("Por favor selecciona una tela primero.")
      setCurrentStep(1)
      return
    }
    if (!selectedDesign) {
      toast.error("Por favor selecciona o sube un diseño.")
      setCurrentStep(2)
      return
    }
    if (quantity < 10) {
      toast.error("El pedido mínimo de sublimación es de 10 metros.")
      return
    }

    const unitPrice = selectedFabric.salePrice || selectedFabric.sale_price || selectedFabric.price

    addItem({
      id: Number(selectedFabric._id.replace(/\D/g, '').substring(0, 8)) || Date.now(),
      name: `${selectedFabric.name} - ${selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.name}`,
      price: unitPrice,
      regularPrice: selectedFabric.price,
      image: selectedDesign.isCustom ? (selectedFabric.image || '/placeholder.svg') : selectedDesign.imageUrl,
      slug: selectedFabric.slug,
      designName: selectedDesign.name,
      designUrl: selectedDesign.imageUrl,
      isCustom: selectedDesign.isCustom,
      hasPromo: Boolean(selectedFabric.salePrice && selectedFabric.salePrice < selectedFabric.price),
      categorySlugs: selectedFabric.categories?.map(c => c.slug) || ['sublimados']
    }, quantity)

    toast.success(`¡${quantity} metros añadidos al carrito!`, {
      description: `${selectedFabric.name} · ${selectedDesign.name}`
    })

    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  // Handle WhatsApp quotation
  const handleWhatsAppQuote = () => {
    if (!selectedFabric) return
    const unitPrice = selectedFabric.salePrice || selectedFabric.sale_price || selectedFabric.price
    const total = unitPrice * quantity

    const message = `Hola, me gustaría cotizar un pedido de sublimación:\n\n` +
      `• Tela: ${selectedFabric.name}\n` +
      `• Diseño: ${selectedDesign ? (selectedDesign.isCustom ? 'Diseño Personalizado' : selectedDesign.name) : 'Por definir'}\n` +
      (selectedDesign?.imageUrl ? `• Enlace diseño: ${selectedDesign.imageUrl}\n` : '') +
      `• Cantidad: ${quantity} metros\n` +
      `• Total estimado: $${total.toLocaleString()} COP\n\n` +
      `Quedo atento a las indicaciones para la muestra física de 20x20 cm.`

    window.open(getWhatsAppUrl(whatsappNumber, message), '_blank')
  }

  const unitPrice = selectedFabric ? (selectedFabric.salePrice || selectedFabric.sale_price || selectedFabric.price) : 0
  const totalPrice = unitPrice * quantity
  const totalPages = Math.ceil(totalDesigns / DESIGNS_PER_PAGE)

  // Minimalist Wizard Content
  const wizardContent = (
    <div className="flex flex-col h-full">
      {/* MINIMAL STEPS BAR */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-6 overflow-x-auto">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-sm transition-colors ${
              currentStep === 1 
                ? 'font-medium text-foreground border-b-2 border-primary pb-1 -mb-[17px]' 
                : selectedFabric 
                  ? 'text-muted-foreground hover:text-foreground font-light' 
                  : 'text-muted-foreground/60 font-light'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              currentStep === 1 ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </span>
            <span>Tela base</span>
            {selectedFabric && <Check className="w-3.5 h-3.5 text-primary ml-0.5" />}
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => selectedFabric && setCurrentStep(2)}
            disabled={!selectedFabric}
            className={`flex items-center gap-2 text-sm transition-colors ${
              !selectedFabric ? 'opacity-40 cursor-not-allowed text-muted-foreground' : ''
            } ${
              currentStep === 2 
                ? 'font-medium text-foreground border-b-2 border-primary pb-1 -mb-[17px]' 
                : selectedDesign 
                  ? 'text-muted-foreground hover:text-foreground font-light' 
                  : 'text-muted-foreground font-light'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              currentStep === 2 ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </span>
            <span>Diseño</span>
            {selectedDesign && <Check className="w-3.5 h-3.5 text-primary ml-0.5" />}
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => selectedFabric && selectedDesign && setCurrentStep(3)}
            disabled={!selectedFabric || !selectedDesign}
            className={`flex items-center gap-2 text-sm transition-colors ${
              (!selectedFabric || !selectedDesign) ? 'opacity-40 cursor-not-allowed text-muted-foreground' : ''
            } ${
              currentStep === 3 
                ? 'font-medium text-foreground border-b-2 border-primary pb-1 -mb-[17px]' 
                : 'text-muted-foreground font-light'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              currentStep === 3 ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </span>
            <span>Metraje y pedido</span>
          </button>
        </div>

        {/* Minimal Info Line */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground font-light">
          <span>• Mínimo 10m</span>
          <span>• Muestra 20×20 cm</span>
          <span>• Entrega 5-8 días</span>
        </div>
      </div>

      {/* MINIMAL INFO CALLOUT (Discrete) */}
      <div className="px-6 py-2.5 bg-muted/40 border-b border-border/40 flex flex-wrap items-center justify-between text-xs text-muted-foreground font-light">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Información importante: Pedido mínimo de <strong>10 metros</strong> · Muestra física de <strong>20 × 20 cm</strong> para aprobación antes de producción.</span>
        </div>
        <span className="hidden sm:inline text-[11px] opacity-80">Entrega: 5 a 8 días hábiles</span>
      </div>

      {/* STEP BODY */}
      <div className="p-6 overflow-y-auto max-h-[62vh]">
        <AnimatePresence mode="wait">
          {/* STEP 1: SELECT FABRIC (MINIMALIST) */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-normal text-foreground">Elige la tela base</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    Selecciona el material sobre el cual imprimiremos tu estampado
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar tela..." 
                    className="pl-8 h-9 text-xs font-light bg-background border-border/60"
                    value={fabricSearch}
                    onChange={(e) => setFabricSearch(e.target.value)}
                  />
                </div>
              </div>

              {filteredFabrics.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl">
                  <p className="text-sm text-muted-foreground font-light">No se encontraron telas disponibles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {filteredFabrics.map((fabric) => {
                    const isSelected = selectedFabric?._id === fabric._id
                    const priceToDisplay = fabric.salePrice || fabric.sale_price || fabric.price
                    const hasDiscount = Boolean(fabric.salePrice && fabric.salePrice < fabric.price)

                    return (
                      <div
                        key={fabric._id}
                        onClick={() => {
                          setSelectedFabric(fabric)
                          setSelectedDesign(null)
                          setDesignPage(0)
                        }}
                        className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 flex flex-col bg-card ${
                          isSelected 
                            ? 'border-primary ring-1 ring-primary shadow-sm' 
                            : 'border-border/60 hover:border-foreground/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="relative aspect-square w-full bg-muted/30 overflow-hidden">
                          <Image
                            src={fabric.image || "/placeholder.svg"}
                            alt={fabric.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-102"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </div>
                          )}
                          {hasDiscount && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                              OFERTA
                            </span>
                          )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <h4 className="font-light text-xs sm:text-sm text-foreground line-clamp-1 leading-snug mb-1">
                            {fabric.name}
                          </h4>
                          <div className="flex items-baseline justify-between mt-auto">
                            <span className="text-xs font-medium text-foreground">
                              ${priceToDisplay?.toLocaleString()} <span className="text-[10px] text-muted-foreground font-light">/m</span>
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] line-through text-muted-foreground font-light">
                                ${fabric.price?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: SELECT OR UPLOAD DESIGN (MINIMALIST) */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Selected Fabric Summary Tag */}
              {selectedFabric && (
                <div className="p-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
                      <Image
                        src={selectedFabric.image || "/placeholder.svg"}
                        alt={selectedFabric.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-light">Tela seleccionada:</p>
                      <h4 className="font-medium text-xs sm:text-sm text-foreground">{selectedFabric.name}</h4>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep(1)} 
                    className="text-xs font-light text-muted-foreground hover:text-foreground h-8"
                  >
                    Cambiar
                  </Button>
                </div>
              )}

              {/* Design Header & Search */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-normal text-foreground">Selecciona o sube tu diseño</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    {selectedFabric?.designCategory 
                      ? `Catálogo de estampados para ${selectedFabric.designCategory}` 
                      : 'Elige un diseño de nuestro catálogo o sube tu propio archivo'}
                  </p>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar diseño..." 
                    className="pl-8 h-9 text-xs font-light bg-background border-border/60"
                    value={designSearch}
                    onChange={(e) => {
                      setDesignSearch(e.target.value)
                      setDesignPage(0)
                    }}
                  />
                </div>
              </div>

              {/* Selected Design Preview Tag */}
              {selectedDesign && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-primary shrink-0 bg-white flex items-center justify-center">
                      {selectedDesign.isCustom ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : (
                        <Image
                          src={selectedDesign.imageUrl}
                          alt={selectedDesign.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-medium text-primary">
                        Diseño elegido
                      </span>
                      <h4 className="font-medium text-xs sm:text-sm text-foreground">{selectedDesign.name}</h4>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedDesign(null)} 
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Quitar
                  </Button>
                </div>
              )}

              {/* Circular Designs Grid (Compact & Minimalist) */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-2.5">
                {/* UPLOAD CUSTOM BUTTON */}
                <div
                  onClick={() => setIsUploadModalOpen(true)}
                  className={`relative w-full border-2 border-dashed rounded-full flex flex-col items-center justify-center p-1 cursor-pointer transition-colors aspect-square text-center gap-0.5 group ${
                    selectedDesign?.isCustom 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border/80 hover:border-primary hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                  title="Subir diseño personalizado"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span className="text-[8px] font-medium leading-none">Subir</span>
                </div>

                {/* Loading state */}
                {loadingDesigns ? (
                  Array.from({ length: 23 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-muted/40 animate-pulse rounded-full" />
                  ))
                ) : (
                  designs.map((d) => {
                    const isSelected = selectedDesign?.id === d._id
                    return (
                      <div
                        key={d._id}
                        onClick={() => setSelectedDesign({
                          id: d._id,
                          name: d.name || 'Diseño',
                          imageUrl: d.imageUrl,
                          category: d.category || 'Sublimado',
                          isCustom: false
                        })}
                        title={d.name || "Diseño"}
                        className={`relative group cursor-pointer rounded-full overflow-hidden border aspect-square transition-all ${
                          isSelected ? 'border-primary ring-2 ring-primary/40 scale-95 shadow-sm' : 'border-transparent hover:border-border hover:scale-105'
                        }`}
                      >
                        <Image
                          src={d.imageUrl}
                          alt={d.name || "Diseño"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 15vw, 8vw"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/25 flex items-center justify-center">
                            <div className="bg-primary text-white p-0.5 rounded-full shadow">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Minimal Pagination */}
              {!loadingDesigns && totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground font-light">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDesignPage(p => Math.max(0, p - 1))}
                    disabled={designPage === 0}
                    className="h-8 text-xs font-light"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                  </Button>
                  <span>
                    Página {designPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDesignPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={designPage >= totalPages - 1}
                    className="h-8 text-xs font-light"
                  >
                    Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: QUANTITY & SUMMARY (MINIMALIST) */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-normal text-foreground">Metraje y Confirmación</h3>
                <p className="text-xs text-muted-foreground font-light">
                  Selecciona la cantidad de metros que deseas estampar (mínimo 10m).
                </p>
              </div>

              {/* Minimal Order Card */}
              <div className="grid md:grid-cols-2 gap-6 bg-muted/20 border border-border/50 rounded-2xl p-5">
                {/* Product Summary */}
                <div className="flex gap-4 items-start border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/50 shrink-0 bg-muted/30">
                    <Image
                      src={selectedDesign?.isCustom ? (selectedFabric?.image || '/placeholder.svg') : (selectedDesign?.imageUrl || selectedFabric?.image || '/placeholder.svg')}
                      alt="Resumen"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-foreground">
                      {selectedFabric?.name}
                    </h4>
                    <p className="text-xs text-muted-foreground font-light">
                      Diseño: {selectedDesign?.name}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      ${unitPrice.toLocaleString()} / metro
                    </p>
                  </div>
                </div>

                {/* Meter Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-light text-muted-foreground block mb-2">
                      Cantidad en metros:
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(q => Math.max(10, q - 1))}
                        disabled={quantity <= 10}
                        className="h-9 w-9 shrink-0"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        min="10"
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 10
                          setQuantity(val < 10 ? 10 : val)
                        }}
                        className="text-center font-medium text-base h-9 w-24"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(q => q + 1)}
                        className="h-9 w-9 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground font-light">metros</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3">
                      {[10, 20, 50, 100].map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setQuantity(m)}
                          className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                            quantity === m 
                              ? 'bg-primary text-white border-primary font-medium' 
                              : 'bg-background hover:bg-muted border-border/60 text-muted-foreground font-light'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground font-light">Total estimado:</span>
                    <span className="text-xl font-bold text-foreground">
                      ${totalPrice.toLocaleString()} <span className="text-xs font-light text-muted-foreground">COP</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MINIMAL FOOTER ACTIONS */}
      <div className="p-4 px-6 bg-background border-t border-border/50 flex items-center justify-between gap-3">
        {currentStep > 1 ? (
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(s => (s - 1) as any)}
            className="text-xs font-light h-10"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Volver
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground font-light">
            Selecciona una tela para continuar
          </span>
        )}

        <div className="flex items-center gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={() => {
                if (currentStep === 1 && !selectedFabric) return
                if (currentStep === 2 && !selectedDesign) return
                setCurrentStep(s => (s + 1) as any)
              }}
              disabled={currentStep === 1 ? !selectedFabric : !selectedDesign}
              className="h-10 px-6 text-xs font-medium gap-1.5"
            >
              Continuar
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleWhatsAppQuote}
                className="h-10 text-xs font-light gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Cotizar por WhatsApp
              </Button>
              <Button
                onClick={handleAddToCart}
                className="h-10 px-6 text-xs font-medium gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Añadir al Carrito ({quantity}m)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MINIMAL UPLOAD MODAL */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-normal">Sube tu diseño personalizado</DialogTitle>
            <DialogDescription className="text-xs font-light">
              Sube tu archivo para sublimar en {selectedFabric?.name || 'la tela seleccionada'}.
            </DialogDescription>
          </DialogHeader>

          {/* Info Box */}
          <div className="bg-muted/40 border border-border/60 rounded-xl p-3.5 text-xs text-muted-foreground space-y-2 font-light">
            <p className="font-medium text-foreground flex items-center gap-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-primary" /> Indicaciones importantes:
            </p>
            <ul className="space-y-1 list-disc list-inside ml-1 text-[11px]">
              <li>Formato: <strong>Archivo PDF</strong> (único formato admitido).</li>
              <li>Medidas: 150 cm de ancho x hasta 1 m de repetición continua.</li>
              <li>Pedido mínimo para sublimación: <strong>10 metros</strong> en adelante.</li>
              <li>Se realiza muestra física de <strong>20 × 20 cm</strong> para tu aprobación previa.</li>
              <li>Tiempo de entrega: 5 a 8 días hábiles tras aprobación.</li>
            </ul>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input {...getInputProps()} />
            {customFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <p className="font-medium text-xs text-foreground">{customFileName}</p>
                <p className="text-[10px] text-muted-foreground font-light">Clic o arrastra para cambiar tu archivo PDF</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <p className="font-medium text-xs text-foreground">Arrastra tu archivo PDF aquí</p>
                <p className="text-[10px] text-muted-foreground font-light">Solo formato PDF (.pdf)</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
              className="text-xs font-light h-9"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCustomUpload}
              disabled={!customFile || isUploading}
              className="text-xs font-medium h-9"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Subiendo...
                </>
              ) : (
                'Guardar Diseño'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (embedded) {
    return (
      <div id="sublimar-wizard" className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden my-6">
        {wizardContent}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-xl font-normal text-foreground">
            Estudio de Sublimación
          </DialogTitle>
          <DialogDescription className="text-xs font-light text-muted-foreground">
            Selecciona tu tela, estampado y metraje.
          </DialogDescription>
        </DialogHeader>
        {wizardContent}
      </DialogContent>
    </Dialog>
  )
}
