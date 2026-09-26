"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  Loader2, 
  UploadCloud, 
  X, 
  Film, 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PQRS_TYPES, PQRS_TIENDAS } from "@/lib/pqr";

const MAX_TOTAL_FILES = 10;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_PDF_SIZE = 15 * 1024 * 1024;   // 15 MB

interface UploadedFileItem {
  id: string;
  file: File;
  previewUrl?: string;
  category: "image" | "video" | "pdf";
  formattedSize: string;
}

interface SubmittedCaseData {
  radicado: string;
  tipo: string;
  tienda: string;
  nombre: string;
  apellido: string;
  correo: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const formSchema = z.object({
  tipo: z.enum(["peticion", "queja", "reclamo", "sugerencia", "felicitacion"], {
    errorMap: () => ({ message: "Selecciona el tipo de solicitud" }),
  }),
  tienda: z.string().min(1, "Selecciona la tienda o canal de atención"),
  nombre: z.string().min(2, "El nombre es obligatorio"),
  apellido: z.string().min(2, "El apellido es obligatorio"),
  documento: z.string().min(5, "El documento es obligatorio"),
  correo: z.string().email("Correo electrónico inválido"),
  celular: z.string().min(7, "El celular es obligatorio"),
  asunto: z.string().min(3, "El asunto es obligatorio"),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export function PqrForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string>("");
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<SubmittedCaseData | null>(null);
  const [copiedRadicado, setCopiedRadicado] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();

  // Limpiar URLs de objetos para evitar fugas de memoria
  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [files]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "peticion",
      tienda: "T1 E-commerce",
      nombre: "",
      apellido: "",
      documento: "",
      correo: "",
      celular: "",
      asunto: "",
      mensaje: "",
    },
  });

  const selectedTipo = watch("tipo") || "peticion";
  const selectedTienda = watch("tienda") || "T1 E-commerce";
  const selectedTipoInfo = PQRS_TYPES.find((t) => t.id === selectedTipo);

  const processIncomingFiles = (incomingList: FileList | File[]) => {
    const listArray = Array.from(incomingList);
    if (!listArray.length) return;

    if (files.length + listArray.length > MAX_TOTAL_FILES) {
      toast.error("Límite de archivos excedido", {
        description: `Solo puedes adjuntar hasta un máximo de ${MAX_TOTAL_FILES} archivos por solicitud.`,
      });
      return;
    }

    const newItems: UploadedFileItem[] = [];

    for (const file of listArray) {
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
      const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!isImage && !isVideo && !isPdf) {
        toast.error(`Formato no permitido: ${file.name}`, {
          description: "Solo se aceptan fotos (JPG, PNG, WEBP), videos (MP4, MOV, WEBM) o documentos PDF.",
        });
        continue;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast.error(`Video demasiado pesado: ${file.name}`, {
          description: `El tamaño máximo por video es de 50 MB (${formatBytes(file.size)} detectados).`,
        });
        continue;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        toast.error(`Imagen demasiado pesada: ${file.name}`, {
          description: `El tamaño máximo por imagen es de 15 MB (${formatBytes(file.size)} detectados).`,
        });
        continue;
      }

      if (isPdf && file.size > MAX_PDF_SIZE) {
        toast.error(`PDF demasiado pesado: ${file.name}`, {
          description: `El tamaño máximo por documento es de 15 MB (${formatBytes(file.size)} detectados).`,
        });
        continue;
      }

      // Evitar duplicados exactos
      const exists = files.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (exists) {
        continue;
      }

      const category: "image" | "video" | "pdf" = isVideo
        ? "video"
        : isImage
        ? "image"
        : "pdf";

      const previewUrl = isImage || isVideo ? URL.createObjectURL(file) : undefined;

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl,
        category,
        formattedSize: formatBytes(file.size),
      });
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length} archivo(s) agregado(s)`);
    }

    // Limpiar input nativo para permitir re-seleccionar el mismo archivo si fue removido
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (idToRemove: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const copyRadicadoToClipboard = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedRadicado(true);
      toast.success("Número de radicado copiado");
      setTimeout(() => setCopiedRadicado(false), 2500);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const uploadedEvidencias: any[] = [];

      // Subir cada archivo por streaming individual a Sanity CDN sin sobrecargar la memoria
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const categoryLabel =
          item.category === "video"
            ? "video"
            : item.category === "image"
            ? "foto"
            : "documento";

        setSubmitStatus(`Subiendo ${categoryLabel} (${i + 1} de ${files.length})...`);

        const uploadRes = await fetch(
          `/api/pqr/upload?filename=${encodeURIComponent(item.file.name)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": item.file.type || "application/octet-stream",
              "X-Filename": encodeURIComponent(item.file.name),
            },
            body: item.file,
          }
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(
            uploadData.error || `Error al subir el archivo ${item.file.name}`
          );
        }

        uploadedEvidencias.push({
          assetId: uploadData.assetId,
          url: uploadData.url,
          filename: uploadData.filename || item.file.name,
          size: uploadData.size || item.file.size,
          type: uploadData.type || item.category,
        });
      }

      setSubmitStatus("Generando número de caso y notificando a Servicio al Cliente...");

      const response = await fetch("/api/pqr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: data.tipo,
          tienda: data.tienda,
          nombre: data.nombre,
          apellido: data.apellido,
          documento: data.documento,
          correo: data.correo,
          celular: data.celular,
          asunto: data.asunto,
          mensaje: data.mensaje,
          fechaEnvio: new Date().toLocaleString("es-CO", {
            timeZone: "America/Bogota",
          }),
          evidencias: uploadedEvidencias,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Ocurrió un error al registrar la solicitud"
        );
      }

      const assignedRadicado = result.radicado || "P0001-2026";

      toast.success("¡Solicitud Radicada Exitosamente!", {
        description: `Número de caso asignado: ${assignedRadicado}`,
      });

      // Guardar el estado de caso radicado para mostrar comprobante
      setSubmittedCase({
        radicado: assignedRadicado,
        tipo: result.tipo || selectedTipoInfo?.title || data.tipo,
        tienda: data.tienda,
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
      });

      // Limpiar formulario y evidencias
      files.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setFiles([]);
      reset();
    } catch (error: any) {
      toast.error("Error al enviar", {
        description:
          error.message ||
          "No se pudo enviar el formulario. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitStatus("");
    }
  };

  const imageCount = files.filter((f) => f.category === "image").length;
  const videoCount = files.filter((f) => f.category === "video").length;
  const pdfCount = files.filter((f) => f.category === "pdf").length;

  const inputStyles =
    "h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:border-slate-400 transition-colors shadow-sm rounded-lg px-4";
  const errorStyles = "border-red-300 focus-visible:ring-red-400 bg-red-50/30";

  // Pantalla de Confirmación con Número de Radicado
  if (submittedCase) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 sm:p-10 text-center space-y-6"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            ✓ Solicitud Radicada con Éxito
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
            ¡Hemos recibido tu solicitud!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            Cada solicitud recibe un número de caso para facilitar su clasificación, seguimiento y trazabilidad.
          </p>
        </div>

        {/* Tarjeta destacada con número de radicado oficial */}
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/90 border-2 border-slate-200 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Número de Radicado / Caso Asignado
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider font-mono bg-white px-5 py-2 rounded-xl border border-slate-300 shadow-xs select-all">
              {submittedCase.radicado}
            </span>
            <button
              type="button"
              onClick={() => copyRadicadoToClipboard(submittedCase.radicado)}
              className="p-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
              title="Copiar radicado"
            >
              {copiedRadicado ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="pt-1 text-xs text-slate-600 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Tipo: <strong className="text-slate-800">{submittedCase.tipo}</strong></span>
            <span>•</span>
            <span>Canal/Sede: <strong className="text-slate-800">{submittedCase.tienda}</strong></span>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto space-y-2 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-100">
          <p>
            Hemos enviado un comprobante a <strong>{submittedCase.correo}</strong> con el resumen de tu solicitud.
          </p>
          <p className="text-gray-500 text-xs">
            Nuestro equipo de Servicio al Cliente revisará los detalles y te responderá en el menor tiempo posible.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={() => {
              setSubmittedCase(null);
            }}
            variant="outline"
            className="h-11 px-6 text-sm font-medium rounded-lg border-gray-300 hover:bg-gray-50"
          >
            Registrar otra solicitud
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
        
        {/* 1. Tipo de PQRS con descripción en letra gris */}
        <div className="space-y-2 relative md:col-span-1">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Tipo de Solicitud (PQRS) *
          </Label>
          <Select
            value={selectedTipo}
            onValueChange={(val: any) => setValue("tipo", val, { shouldValidate: true })}
          >
            <SelectTrigger
              className={`w-full ${inputStyles} ${errors.tipo ? errorStyles : ""}`}
            >
              <SelectValue placeholder="Selecciona el tipo de PQRS" />
            </SelectTrigger>
            <SelectContent className="max-h-[380px] z-50 bg-white">
              {PQRS_TYPES.map((item) => (
                <SelectItem
                  key={item.id}
                  value={item.id}
                  className="cursor-pointer py-2.5 focus:bg-slate-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex flex-col text-left py-0.5">
                    <span className="font-semibold text-gray-900 text-sm">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500 font-normal leading-snug mt-0.5 whitespace-normal">
                      {item.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Letra gris con la explicación detallada del ítem seleccionado */}
          {selectedTipoInfo && (
            <motion.div
              key={selectedTipoInfo.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 bg-gray-50/90 border border-gray-200/80 rounded-lg text-xs leading-relaxed"
            >
              <p className="font-semibold text-gray-800 mb-0.5">
                {selectedTipoInfo.title}
              </p>
              <p className="text-gray-500 font-normal">
                {selectedTipoInfo.description}
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {errors.tipo && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.tipo.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Selección de Tienda */}
        <div className="space-y-2 relative md:col-span-1">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Tienda o Canal de Atención *
          </Label>
          <Select
            value={selectedTienda}
            onValueChange={(val: any) => setValue("tienda", val, { shouldValidate: true })}
          >
            <SelectTrigger
              className={`w-full ${inputStyles} ${errors.tienda ? errorStyles : ""}`}
            >
              <SelectValue placeholder="Selecciona la tienda o canal" />
            </SelectTrigger>
            <SelectContent className="max-h-[320px] z-50 bg-white">
              {PQRS_TIENDAS.map((tiendaName) => (
                <SelectItem
                  key={tiendaName}
                  value={tiendaName}
                  className="cursor-pointer py-2 focus:bg-slate-50 text-sm font-medium text-gray-800"
                >
                  {tiendaName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1 pl-0.5">
            Indica la sede física o canal digital relacionado con tu solicitud.
          </p>

          <AnimatePresence>
            {errors.tienda && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.tienda.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Nombre */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Nombre *
          </Label>
          <Input
            {...register("nombre")}
            placeholder="Ej. Juan"
            className={`${inputStyles} ${errors.nombre ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.nombre && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.nombre.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Apellido */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Apellido *
          </Label>
          <Input
            {...register("apellido")}
            placeholder="Ej. Pérez"
            className={`${inputStyles} ${errors.apellido ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.apellido && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.apellido.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Documento */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Número de Documento *
          </Label>
          <Input
            {...register("documento")}
            placeholder="Ej. 1002345678"
            className={`${inputStyles} ${errors.documento ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.documento && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.documento.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Correo */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Correo Electrónico *
          </Label>
          <Input
            type="email"
            {...register("correo")}
            placeholder="juan.perez@ejemplo.com"
            className={`${inputStyles} ${errors.correo ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.correo && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.correo.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Celular */}
        <div className="space-y-2 relative md:col-span-2">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Celular *
          </Label>
          <Input
            type="tel"
            {...register("celular")}
            placeholder="+57 300 000 0000"
            className={`${inputStyles} ${errors.celular ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.celular && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.celular.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Asunto */}
        <div className="space-y-2 md:col-span-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Asunto *
          </Label>
          <Input
            {...register("asunto")}
            placeholder="¿Cuál es el motivo de tu solicitud?"
            className={`${inputStyles} ${errors.asunto ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.asunto && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.asunto.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mensaje */}
        <div className="space-y-2 md:col-span-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">
            Mensaje *
          </Label>
          <Textarea
            {...register("mensaje")}
            placeholder="Describe tu petición, queja, reclamo, sugerencia o felicitación con el mayor detalle posible..."
            className={`min-h-[140px] resize-y py-3 px-4 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:border-slate-400 transition-colors shadow-sm rounded-lg ${
              errors.mensaje ? errorStyles : ""
            }`}
          />
          <AnimatePresence>
            {errors.mensaje && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1"
              >
                {errors.mensaje.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Evidencias Adjuntas (Múltiples fotos, videos y documentos) */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={fileInputId} className="text-[14px] font-medium text-gray-700 ml-0.5 flex items-center gap-2">
              <span>Evidencias Adjuntas (Fotos, Videos o Documentos)</span>
              <span className="text-xs font-normal text-gray-500">(Opcional)</span>
            </Label>
            {files.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {files.length} / {MAX_TOTAL_FILES} archivos
                </span>
                {(imageCount > 0 || videoCount > 0 || pdfCount > 0) && (
                  <span className="text-gray-400 hidden sm:inline">
                    ({imageCount > 0 && `${imageCount} foto${imageCount > 1 ? "s" : ""}`}
                    {imageCount > 0 && (videoCount > 0 || pdfCount > 0) && ", "}
                    {videoCount > 0 && `${videoCount} video${videoCount > 1 ? "s" : ""}`}
                    {videoCount > 0 && pdfCount > 0 && ", "}
                    {pdfCount > 0 && `${pdfCount} PDF${pdfCount > 1 ? "s" : ""}`})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Zona de Arrastrar y Soltar */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
              isDragging
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-gray-200 hover:border-slate-400 bg-gray-50/40 hover:bg-gray-50/80"
            }`}
          >
            <input
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processIncomingFiles(e.target.files);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm ${
                  isDragging
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-slate-700 group-hover:text-primary group-hover:border-primary/30"
                }`}
              >
                <UploadCloud className="w-7 h-7" strokeWidth={1.75} />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="text-primary hover:underline">Haz clic para subir</span> o arrastra tus archivos aquí
                </p>
                <p className="text-xs text-gray-500">
                  Acepta varias <strong>imágenes</strong> (JPG, PNG), varios <strong>videos</strong> (MP4, MOV) o <strong>PDF</strong>.
                </p>
                <p className="text-[11px] text-gray-400">
                  Máximo 50 MB por video • 15 MB por foto/PDF • Hasta {MAX_TOTAL_FILES} archivos
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 h-9 text-xs rounded-lg border-gray-300 pointer-events-none group-hover:border-slate-400"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Seleccionar fotos, videos o PDF
              </Button>
            </div>
          </div>

          {/* Lista de Archivos Seleccionados con Preview Dinámica */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2"
              >
                {files.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="group relative bg-white border border-gray-200 rounded-xl p-3 shadow-xs hover:shadow-md transition-shadow flex items-center gap-3 overflow-hidden"
                  >
                    {/* Thumbnail / Icono según categoría */}
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 relative">
                      {item.category === "image" && item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : item.category === "video" && item.previewUrl ? (
                        <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                          <video
                            src={item.previewUrl}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            playsInline
                          />
                          <Film className="w-5 h-5 text-white/90 absolute drop-shadow-md" />
                        </div>
                      ) : item.category === "pdf" ? (
                        <FileText className="w-7 h-7 text-rose-500" />
                      ) : (
                        <FileCheck2 className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    {/* Información del archivo */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-medium text-gray-900 truncate" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 font-normal ${
                            item.category === "video"
                              ? "bg-purple-100 text-purple-700 border-purple-200"
                              : item.category === "image"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.category === "video"
                            ? "Video"
                            : item.category === "image"
                            ? "Foto"
                            : "PDF"}
                        </Badge>
                        <span className="text-[11px] text-gray-400">
                          {item.formattedSize}
                        </span>
                      </div>
                    </div>

                    {/* Botón de eliminar archivo */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(item.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-[16px] font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {submitStatus ||
                (files.length > 0
                  ? `Procesando ${files.length} archivo(s)...`
                  : "Procesando solicitud...")}
            </span>
          ) : (
            "Enviar Solicitud PQRS"
          )}
        </Button>
        <p className="text-center text-[13px] text-gray-500 mt-5">
          Tus datos serán tratados conforme a nuestra política de privacidad.
        </p>
      </div>
    </form>
  );
}
