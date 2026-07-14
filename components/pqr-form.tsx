"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  apellido: z.string().min(2, "El apellido es obligatorio"),
  documento: z.string().min(5, "El documento es obligatorio"),
  correo: z.string().email("Correo electrónico inválido"),
  pais: z.string().min(1, "Selecciona un país"),
  celular: z.string().min(7, "El celular es obligatorio"),
  asunto: z.string().min(3, "El asunto es obligatorio"),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export function PqrForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      documento: "",
      correo: "",
      pais: "Colombia",
      celular: "",
      asunto: "",
      mensaje: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        fechaEnvio: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
      };

      const response = await fetch("/api/pqr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Ocurrió un error");

      toast.success("¡Formulario enviado con éxito!", {
        description: "Nuestro equipo revisará tu solicitud y te contactará pronto.",
      });
      reset();
    } catch (error: any) {
      toast.error("Error al enviar", {
        description: error.message || "No se pudo enviar el formulario. Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "h-12 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:border-slate-400 transition-colors shadow-sm rounded-lg px-4";
  const errorStyles = "border-red-300 focus-visible:ring-red-400 bg-red-50/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
        
        {/* Nombre */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Nombre *</Label>
          <Input
            {...register("nombre")}
            placeholder="Ej. Juan"
            className={`${inputStyles} ${errors.nombre ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.nombre && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.nombre.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Apellido */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Apellido *</Label>
          <Input
            {...register("apellido")}
            placeholder="Ej. Pérez"
            className={`${inputStyles} ${errors.apellido ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.apellido && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.apellido.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Documento */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Número de Documento *</Label>
          <Input
            {...register("documento")}
            placeholder="Ej. 1002345678"
            className={`${inputStyles} ${errors.documento ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.documento && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.documento.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Correo */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Correo Electrónico *</Label>
          <Input
            type="email"
            {...register("correo")}
            placeholder="juan.perez@ejemplo.com"
            className={`${inputStyles} ${errors.correo ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.correo && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.correo.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Celular */}
        <div className="space-y-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Celular *</Label>
          <Input
            type="tel"
            {...register("celular")}
            placeholder="+57 300 000 0000"
            className={`${inputStyles} ${errors.celular ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.celular && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.celular.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* País */}
        <div className="space-y-2 md:col-span-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">País *</Label>
          <Select defaultValue="Colombia" onValueChange={(value) => setValue("pais", value)}>
            <SelectTrigger className={`${inputStyles} ${errors.pais ? errorStyles : ""}`}>
              <SelectValue placeholder="Selecciona un país" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-lg">
              {["Colombia", "México", "Perú", "Chile", "Ecuador", "Argentina", "España", "Otro"].map((country) => (
                <SelectItem key={country} value={country} className="cursor-pointer focus:bg-slate-50 py-2.5 rounded-md my-0.5 mx-1">
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AnimatePresence>
            {errors.pais && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.pais.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Asunto */}
        <div className="space-y-2 md:col-span-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Asunto *</Label>
          <Input
            {...register("asunto")}
            placeholder="¿Cuál es el motivo de tu solicitud?"
            className={`${inputStyles} ${errors.asunto ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.asunto && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.asunto.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Mensaje */}
        <div className="space-y-2 md:col-span-2 relative">
          <Label className="text-[14px] font-medium text-gray-700 ml-0.5">Mensaje *</Label>
          <Textarea
            {...register("mensaje")}
            placeholder="Describe tu petición, queja, reclamo o sugerencia con el mayor detalle posible..."
            className={`min-h-[140px] resize-y py-3 px-4 bg-gray-50/50 border-gray-200 text-[15px] focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:border-slate-400 transition-colors shadow-sm rounded-lg ${errors.mensaje ? errorStyles : ""}`}
          />
          <AnimatePresence>
            {errors.mensaje && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-[13px] font-medium text-red-500 absolute -bottom-5 left-1">
                {errors.mensaje.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 text-[16px] font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando solicitud...
            </span>
          ) : (
            "Enviar Solicitud"
          )}
        </Button>
        <p className="text-center text-[13px] text-gray-500 mt-5">
          Tus datos serán tratados conforme a nuestra política de privacidad.
        </p>
      </div>
    </form>
  );
}
