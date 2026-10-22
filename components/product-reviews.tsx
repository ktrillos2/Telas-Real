"use client"

import React, { useState, useRef, useMemo, useEffect } from "react"
import Image from "next/image"
import {
  Star,
  Camera,
  Video,
  X,
  Upload,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Play,
  Maximize2,
  Filter,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LegalCheckboxes } from "@/components/legal-checkboxes"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export interface ReviewItem {
  _id: string
  author: string
  rating: number
  title?: string
  comment: string
  colorVariantName?: string
  verifiedPurchase?: boolean
  createdAt: string
  images?: Array<{
    _key: string
    url: string
    alt?: string
  }>
  videos?: Array<{
    _key: string
    url: string
    title?: string
    filename?: string
  }>
}

export interface ProductReviewsProps {
  productId?: string
  productSlug: string
  productTitle: string
  productFamilySlug?: string
  selectedColorName?: string
  initialReviews?: ReviewItem[]
}

interface UploadQueueItem {
  id: string
  file: File
  category: "image" | "video"
  previewUrl: string
  formattedSize: string
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function ProductReviews({
  productId,
  productSlug,
  productTitle,
  productFamilySlug,
  selectedColorName,
  initialReviews = [],
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState<string>("")
  const [activeFilter, setActiveFilter] = useState<"all" | "media" | number>("all")

  // Modal de visualización multimedia (Lightbox)
  const [activeMedia, setActiveMedia] = useState<{
    url: string
    type: "image" | "video"
    title?: string
    author?: string
  } | null>(null)

  // Form State
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [authorName, setAuthorName] = useState("")
  const [email, setEmail] = useState("")
  const [reviewTitle, setReviewTitle] = useState("")
  const [comment, setComment] = useState("")
  const [filesToUpload, setFilesToUpload] = useState<UploadQueueItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [privacyError, setPrivacyError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  // Enlace directo desde el correo / WhatsApp de compra: /producto/<slug>?calificar=1[&nombre=..&email=..]
  // abre el formulario de reseña y lleva al cliente a esta sección.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (!params.has("calificar") && window.location.hash !== "#calificar") return
    const name = params.get("nombre")
    const mail = params.get("email")
    if (name) setAuthorName(name)
    if (mail) setEmail(mail)
    const timer = setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      setIsModalOpen(true)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  // Cargar reseñas actualizadas si no venían en initialReviews o tras montar
  useEffect(() => {
    let isMounted = true
    async function loadFreshReviews() {
      try {
        const queryParams = new URLSearchParams()
        if (productSlug) queryParams.set("slug", productSlug)
        if (productFamilySlug) queryParams.set("familySlug", productFamilySlug)
        if (productId) queryParams.set("productId", productId)

        const res = await fetch(`/api/reviews?${queryParams.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data?.reviews) {
            setReviews(data.reviews)
          }
        }
      } catch (err) {
        console.error("Error al cargar reseñas:", err)
      }
    }

    if (initialReviews.length === 0) {
      loadFreshReviews()
    }

    return () => {
      isMounted = false
    }
  }, [productSlug, productFamilySlug, productId, initialReviews.length])

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const total = reviews.length
    if (total === 0) {
      return {
        total: 0,
        average: 5,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        mediaCount: 0,
      }
    }

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let mediaCount = 0
    const sum = reviews.reduce((acc, r) => {
      const val = Math.min(5, Math.max(1, Math.round(r.rating || 5)))
      breakdown[val as keyof typeof breakdown] = (breakdown[val as keyof typeof breakdown] || 0) + 1
      if ((r.images && r.images.length > 0) || (r.videos && r.videos.length > 0)) {
        mediaCount++
      }
      return acc + (r.rating || 5)
    }, 0)

    const average = parseFloat((sum / total).toFixed(1))
    return { total, average, breakdown, mediaCount }
  }, [reviews])

  // Filtrado de reseñas
  const filteredReviews = useMemo(() => {
    if (activeFilter === "media") {
      return reviews.filter(
        (r) => (r.images && r.images.length > 0) || (r.videos && r.videos.length > 0)
      )
    }
    if (typeof activeFilter === "number") {
      return reviews.filter((r) => Math.round(r.rating) === activeFilter)
    }
    return reviews
  }, [reviews, activeFilter])

  // Manejo de archivos seleccionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processIncomingFiles(e.target.files)
    }
  }

  const processIncomingFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList)
    const newItems: UploadQueueItem[] = []

    for (const file of filesArray) {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name)
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)

      if (!isVideo && !isImage) {
        toast.error(`Formato no soportado: ${file.name}. Solo fotos y videos.`)
        continue
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        toast.error(`El video ${file.name} supera el límite de 50 MB.`)
        continue
      }

      if (isImage && file.size > 15 * 1024 * 1024) {
        toast.error(`La foto ${file.name} supera el límite de 15 MB.`)
        continue
      }

      const category = isVideo ? "video" : "image"
      const previewUrl = URL.createObjectURL(file)

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        category,
        previewUrl,
        formattedSize: formatBytes(file.size),
      })
    }

    if (newItems.length > 0) {
      setFilesToUpload((prev) => [...prev, ...newItems])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeQueueFile = (id: string) => {
    setFilesToUpload((prev) => {
      const found = prev.find((f) => f.id === id)
      if (found?.previewUrl) {
        URL.revokeObjectURL(found.previewUrl)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files) {
      processIncomingFiles(e.dataTransfer.files)
    }
  }

  // Enviar Reseña a Sanity
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authorName.trim() || authorName.trim().length < 2) {
      toast.error("Por favor escribe tu nombre.")
      return
    }

    if (!comment.trim() || comment.trim().length < 5) {
      toast.error("Por favor escribe un comentario de al menos 5 caracteres.")
      return
    }

    if (!acceptTerms || !acceptPrivacy) {
      setTermsError(!acceptTerms)
      setPrivacyError(!acceptPrivacy)
      toast.error("Debes aceptar los Términos y la Política de Tratamiento de Datos.")
      return
    }

    setIsSubmitting(true)
    setSubmitProgress("Preparando archivos...")

    try {
      const uploadedImages: Array<{ assetId: string; url: string; alt?: string }> = []
      const uploadedVideos: Array<{ assetId: string; url: string; title?: string }> = []

      // Subir cada archivo por streaming a Sanity CDN
      for (let i = 0; i < filesToUpload.length; i++) {
        const item = filesToUpload[i]
        const typeLabel = item.category === "video" ? "video" : "foto"
        setSubmitProgress(`Subiendo ${typeLabel} (${i + 1} de ${filesToUpload.length})...`)

        const uploadRes = await fetch(
          `/api/reviews/upload?filename=${encodeURIComponent(item.file.name)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": item.file.type || "application/octet-stream",
              "X-Filename": encodeURIComponent(item.file.name),
            },
            body: item.file,
          }
        )

        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error || `Error subiendo ${item.file.name}`)
        }

        if (item.category === "image") {
          uploadedImages.push({
            assetId: uploadData.assetId,
            url: uploadData.url,
            alt: `Foto de reseña para ${productTitle}`,
          })
        } else {
          uploadedVideos.push({
            assetId: uploadData.assetId,
            url: uploadData.url,
            title: `Video de reseña para ${productTitle}`,
          })
        }
      }

      setSubmitProgress("Guardando tu reseña...")

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: productId || undefined,
          productSlug,
          productTitle,
          productFamilySlug,
          colorVariantName: selectedColorName || undefined,
          author: authorName.trim(),
          email: email.trim() || undefined,
          rating,
          title: reviewTitle.trim() || undefined,
          comment: comment.trim(),
          images: uploadedImages,
          videos: uploadedVideos,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Error al registrar la reseña.")
      }

      // Éxito: agregar la reseña localmente de inmediato
      if (data.review) {
        setReviews((prev) => [data.review, ...prev])
      }

      // Efecto Confeti
      try {
        const confetti = (await import("canvas-confetti")).default
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
        })
      } catch {
        // Ignorar si confetti falla
      }

      toast.success("¡Reseña publicada!", {
        description: "Tu reseña y archivos han sido publicados exitosamente.",
      })

      // Limpiar formulario y cerrar modal
      filesToUpload.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl)
      })
      setFilesToUpload([])
      setComment("")
      setReviewTitle("")
      setAuthorName("")
      setEmail("")
      setRating(5)
      setAcceptTerms(false)
      setAcceptPrivacy(false)
      setTermsError(false)
      setPrivacyError(false)
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error al enviar reseña:", error)
      toast.error(error?.message || "Ocurrió un error al guardar tu reseña.")
    } finally {
      setIsSubmitting(false)
      setSubmitProgress("")
    }
  }

  const ratingDescriptions: Record<number, string> = {
    1: "Muy malo",
    2: "Regular",
    3: "Bueno",
    4: "Muy bueno",
    5: "¡Excelente!",
  }

  return (
    <section ref={sectionRef} id="resenas" aria-label="Reseñas del producto" className="space-y-8 scroll-mt-24">
      {/* Resumen Principal de Calificaciones */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Calificación Promedio */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="text-4xl font-light text-primary">
                {stats.total > 0 ? stats.average.toFixed(1) : "5.0"}
              </span>
              <div className="flex text-amber-500 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(stats.total > 0 ? stats.average : 5)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mt-1">
                de 5 estrellas
              </span>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-light text-foreground">
                Opiniones de Clientes
              </h3>
              <p className="text-sm text-muted-foreground font-light mt-1">
                {stats.total > 0
                  ? `Basado en ${stats.total} reseña${stats.total === 1 ? "" : "s"} verificada${stats.total === 1 ? "" : "s"}.`
                  : "Sé el primero en compartir tu experiencia con esta tela."}
              </p>
              {stats.mediaCount > 0 && (
                <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Camera className="w-3.5 h-3.5" />
                  {stats.mediaCount} cliente{stats.mediaCount === 1 ? "" : "s"} adjuntaron fotos y videos reales
                </p>
              )}
            </div>
          </div>

          {/* Barras de Desglose por Estrellas */}
          <div className="w-full lg:w-72 space-y-1.5">
            {[5, 4, 3, 2, 1].map((starsCount) => {
              const count = stats.breakdown[starsCount as keyof typeof stats.breakdown] || 0
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              return (
                <button
                  key={starsCount}
                  type="button"
                  onClick={() =>
                    setActiveFilter(activeFilter === starsCount ? "all" : starsCount)
                  }
                  className={`w-full flex items-center gap-2 text-xs py-0.5 rounded px-2 transition-colors cursor-pointer ${
                    activeFilter === starsCount ? "bg-muted font-medium" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="w-8 flex items-center gap-0.5 text-muted-foreground">
                    {starsCount} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-muted-foreground font-light">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Botón para Abrir Modal */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              size="lg"
              className="w-full lg:w-auto h-12 px-6 rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Escribir una Reseña</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros de Reseñas */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Todas ({reviews.length})
          </button>
          {stats.mediaCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("media")}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeFilter === "media"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Camera className="w-3 h-3" />
              Con fotos y videos ({stats.mediaCount})
            </button>
          )}
          {[5, 4, 3, 2, 1].map((st) => {
            const cnt = stats.breakdown[st as keyof typeof stats.breakdown] || 0
            if (cnt === 0) return null
            return (
              <button
                key={st}
                type="button"
                onClick={() => setActiveFilter(st)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                  activeFilter === st
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{st}</span>
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>({cnt})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Lista de Reseñas */}
      {filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {filteredReviews.map((review) => {
            const hasMedia =
              (review.images && review.images.length > 0) ||
              (review.videos && review.videos.length > 0)

            return (
              <article
                key={review._id}
                className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado del Autor y Calificación */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-medium flex items-center justify-center uppercase text-sm border border-primary/20">
                        {review.author ? review.author.charAt(0) : "C"}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground leading-tight">
                          {review.author}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-light">
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString("es-CO", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Reciente"}
                          </span>
                          {review.colorVariantName && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Color: {review.colorVariantName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Estrellas */}
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Título y Comentario */}
                  {review.title && (
                    <h5 className="text-base font-medium text-foreground mb-1.5">
                      {review.title}
                    </h5>
                  )}
                  <p className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line mb-4">
                    {review.comment}
                  </p>

                  {/* Galería Multimedia de la Reseña */}
                  {hasMedia && (
                    <div className="flex flex-wrap gap-2.5 pt-2 mb-2">
                      {/* Fotos */}
                      {review.images?.map((img, idx) => (
                        <button
                          key={img._key || idx}
                          type="button"
                          onClick={() =>
                            setActiveMedia({
                              url: img.url,
                              type: "image",
                              title: review.title,
                              author: review.author,
                            })
                          }
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-border/80 group hover:ring-2 hover:ring-primary transition-all cursor-pointer flex-shrink-0"
                          title="Ver imagen ampliada"
                        >
                          <Image
                            src={img.url}
                            alt={img.alt || `Foto reseña ${review.author}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="80px"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </button>
                      ))}

                      {/* Videos */}
                      {review.videos?.map((vid, idx) => (
                        <button
                          key={vid._key || idx}
                          type="button"
                          onClick={() =>
                            setActiveMedia({
                              url: vid.url,
                              type: "video",
                              title: vid.title || review.title,
                              author: review.author,
                            })
                          }
                          className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-border/80 group hover:ring-2 hover:ring-primary transition-all cursor-pointer flex-shrink-0 flex items-center justify-center text-white"
                          title="Reproducir video"
                        >
                          <video
                            src={vid.url}
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Compra Verificada
                  </span>
                  <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Reseña Auténtica
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border bg-muted/20">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="text-lg font-light text-foreground mb-1">
            {activeFilter === "all"
              ? "Aún no hay reseñas para este producto"
              : "No hay reseñas que coincidan con este filtro"}
          </h4>
          <p className="text-sm text-muted-foreground font-light max-w-md mx-auto mb-6">
            ¿Compraste esta tela? Cuéntale a otros confeccionistas y diseñadores cómo fue tu
            experiencia, el tacto y la caída de la tela. ¡Puedes subir fotos y videos!
          </p>
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="rounded-xl cursor-pointer"
          >
            <Camera className="w-4 h-4 mr-2" /> Escribir Primera Reseña
          </Button>
        </div>
      )}

      {/* Modal / Dialog para Dejar una Reseña */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader className="text-left pb-4 border-b border-border">
            <DialogTitle className="text-xl md:text-2xl font-light text-foreground">
              Califica tu Tela
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm text-muted-foreground font-light mt-1">
              {productTitle}
              {selectedColorName ? ` — Tono: ${selectedColorName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-5 pt-2">
            {/* Calificación por Estrellas */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tu Calificación General *
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled =
                      starValue <= (hoverRating > 0 ? hoverRating : rating)
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverRating(starValue)}
                        onClick={() => setRating(starValue)}
                        className="p-1 rounded-md transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${starValue} estrellas`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Nombre y Correo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="review-author" className="text-xs">
                  Tu Nombre o Apodo *
                </Label>
                <Input
                  id="review-author"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ej: Carolina Martínez"
                  required
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-email" className="text-xs">
                  Correo Electrónico (Opcional)
                </Label>
                <Input
                  id="review-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Para validar tu compra"
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            {/* Título de la Reseña */}
            <div className="space-y-1.5">
              <Label htmlFor="review-title" className="text-xs">
                Título de tu Reseña (Opcional)
              </Label>
              <Input
                id="review-title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Ej: ¡Excelente caída y suavidad para pijamas!"
                className="rounded-xl h-11"
              />
            </div>

            {/* Comentario */}
            <div className="space-y-1.5">
              <Label htmlFor="review-comment" className="text-xs">
                Tu Comentario y Experiencia de Confección *
              </Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos cómo fue el tacto, la elasticidad, el color en vivo o la prenda que confeccionaste..."
                rows={4}
                required
                className="rounded-xl resize-none"
              />
            </div>

            {/* Adjuntar Fotos y Videos */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center justify-between">
                <span>Fotos y Videos de tu Confección (Opcional)</span>
                <span className="text-muted-foreground font-light text-[11px]">
                  Hasta 15MB fotos / 50MB videos
                </span>
              </Label>

              {/* Zona de Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-2 text-primary">
                    <Camera className="w-5 h-5" />
                    <Video className="w-5 h-5" />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground">
                    Haz clic o arrastra fotos y videos aquí
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Soporta fotos (JPG, PNG, WebP) y videos (MP4, MOV, WebM) en alta resolución
                  </p>
                </div>
              </div>

              {/* Lista de archivos en cola con miniatura */}
              {filesToUpload.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {filesToUpload.map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-xl overflow-hidden border border-border bg-muted/40 p-1 group"
                    >
                      <div className="relative w-full h-20 rounded-lg overflow-hidden bg-black/10">
                        {item.category === "image" ? (
                          <Image
                            src={item.previewUrl}
                            alt="Previa foto"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-white">
                            <Video className="w-6 h-6 text-primary mb-1" />
                            <span className="text-[10px] text-muted-foreground">Video</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeQueueFile(item.id)
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-light truncate mt-1 px-1">
                        {item.file.name} ({item.formattedSize})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progreso de Envío */}
            {isSubmitting && submitProgress && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary text-xs font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{submitProgress}</span>
              </div>
            )}

            {/* Consentimiento Legal: Términos y Tratamiento de Datos */}
            <LegalCheckboxes
              variant="compact"
              acceptTerms={acceptTerms}
              onAcceptTermsChange={(val) => {
                setAcceptTerms(val)
                if (val) setTermsError(false)
              }}
              acceptPrivacy={acceptPrivacy}
              onAcceptPrivacyChange={(val) => {
                setAcceptPrivacy(val)
                if (val) setPrivacyError(false)
              }}
              termsId="review-terms"
              privacyId="review-privacy"
              errorTerms={termsError}
              errorPrivacy={privacyError}
              showBadge={true}
            />

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl h-11 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl h-11 px-6 font-medium cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Publicar Reseña
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Lightbox para Visualización en Pantalla Completa de Fotos y Videos */}
      <Dialog
        open={Boolean(activeMedia)}
        onOpenChange={(open) => {
          if (!open) setActiveMedia(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-4 bg-black/95 text-white border-neutral-800 rounded-2xl flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-800">
            <div>
              <p className="text-sm font-medium">
                {activeMedia?.author ? `Adjunto por ${activeMedia.author}` : "Archivo multimedia de cliente"}
              </p>
              {activeMedia?.title && (
                <p className="text-xs text-neutral-400 font-light">{activeMedia.title}</p>
              )}
            </div>
          </div>

          <div className="relative w-full max-h-[70vh] flex items-center justify-center py-4 overflow-hidden">
            {activeMedia?.type === "image" ? (
              <div className="relative w-full h-[60vh] max-h-[600px]">
                <Image
                  src={activeMedia.url}
                  alt={activeMedia.title || "Foto de reseña de cliente"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
            ) : activeMedia?.type === "video" ? (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                playsInline
                className="max-h-[60vh] w-auto max-w-full rounded-lg"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
