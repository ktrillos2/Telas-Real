"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"

const b2bFormSchema = z.object({
  nombre: z.string().min(2, "El nombre completo es requerido"),
  cargo: z.string().min(2, "El cargo en la empresa es requerido"),
  empresa: z.string().min(2, "El nombre de la empresa es requerido"),
  nit: z.string().min(4, "El NIT / RUC es requerido"),
  correo: z.string().email("Correo electrónico no válido"),
  telefono: z.string().min(7, "El teléfono es requerido"),
  ciudad: z.string().min(2, "La ciudad es requerida"),
  intereses: z.array(z.string()).min(1, "Selecciona al menos un tipo de producto"),
  volumen: z.string().min(1, "Selecciona un volumen estimado"),
  necesidad: z.string().min(10, "Cuéntanos un poco más sobre tu necesidad"),
  terminos: z.boolean().refine((val) => val === true, "Debes aceptar la política de tratamiento de datos"),
})

type B2BFormValues = z.infer<typeof b2bFormSchema>

const productTypes = [
  "Telas para sublimación",
  "Telas para moda",
  "Telas deportivas",
  "Accesorios e insumos",
  "Telas para dotación",
  "Otro"
]

const volumeOptions = [
  "Menos de 100 metros",
  "100 - 500 metros",
  "500 - 1,000 metros",
  "1,000 - 5,000 metros",
  "Más de 5,000 metros",
]

const colombianCities = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Pasto",
  "Manizales",
  "Neiva",
  "Villavicencio",
  "Armenia",
  "Otra"
]

export function B2bForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<B2BFormValues>({
    resolver: zodResolver(b2bFormSchema),
    defaultValues: {
      nombre: "",
      cargo: "",
      empresa: "",
      nit: "",
      correo: "",
      telefono: "",
      ciudad: "",
      intereses: [],
      volumen: "",
      necesidad: "",
      terminos: false,
    },
  })

  async function onSubmit(data: B2BFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Solicitud enviada correctamente. Un asesor se comunicará pronto.")
        form.reset()
      } else {
        toast.error(result.error || "Hubo un error al enviar la solicitud.")
      }
    } catch (error) {
      toast.error("Error de conexión. Intenta nuevamente más tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl w-full max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Formulario Empresarial</h2>
      <p className="text-gray-500 mb-8 font-light">
        Cuéntanos sobre tu empresa y necesidades para ayudarte mejor.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Nombre completo *</label>
            <input
              {...form.register("nombre")}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.nombre && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Cargo en la empresa *</label>
            <input
              {...form.register("cargo")}
              placeholder="Ej: Gerente de Compras"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.cargo && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.cargo.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Nombre de la empresa *</label>
            <input
              {...form.register("empresa")}
              placeholder="Ej: Confecciones del Valle S.A.S."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.empresa && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.empresa.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">NIT / RUC *</label>
            <input
              {...form.register("nit")}
              placeholder="Ej: 900123456-7"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.nit && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.nit.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Correo empresarial *</label>
            <input
              {...form.register("correo")}
              type="email"
              placeholder="Ej: compras@empresa.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.correo && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.correo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Teléfono / WhatsApp *</label>
            <input
              {...form.register("telefono")}
              placeholder="Ej: 300 123 4567"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50"
            />
            {form.formState.errors.telefono && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.telefono.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Ciudad *</label>
          <select
            {...form.register("ciudad")}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50 appearance-none"
          >
            <option value="">Selecciona tu ciudad</option>
            {colombianCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {form.formState.errors.ciudad && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.ciudad.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">¿Qué tipo de productos te interesan? *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productTypes.map((type) => (
              <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  value={type}
                  {...form.register("intereses")}
                  className="w-5 h-5 rounded border-gray-300 text-[#0F172A] focus:ring-[#0F172A]"
                />
                <span className="text-sm text-gray-600 group-hover:text-[#0F172A] transition-colors">{type}</span>
              </label>
            ))}
          </div>
          {form.formState.errors.intereses && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.intereses.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Volumen mensual estimado de compra *</label>
          <select
            {...form.register("volumen")}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50 appearance-none"
          >
            <option value="">Selecciona un rango</option>
            {volumeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {form.formState.errors.volumen && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.volumen.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Cuéntanos sobre tu necesidad *</label>
          <textarea
            {...form.register("necesidad")}
            placeholder="Ej: Buscamos un proveedor con capacidad para temporadas altas y productos de sublimación personalizados."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A] outline-none transition-all bg-gray-50 resize-none"
          />
          {form.formState.errors.necesidad && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.necesidad.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              {...form.register("terminos")}
              className="w-5 h-5 rounded border-gray-300 text-[#0F172A] focus:ring-[#0F172A]"
            />
            <span className="text-sm text-gray-600">
              Acepto la <a href="/privacidad" target="_blank" className="text-[#0F172A] font-semibold hover:underline">política de tratamiento de datos personales</a>.
            </span>
          </label>
          {form.formState.errors.terminos && (
            <p className="text-red-500 text-xs mt-1">{form.formState.errors.terminos.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold py-4 rounded-lg flex items-center justify-center transition-all disabled:opacity-70 group"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            <>
              Enviar solicitud
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 font-medium">
          🔒 Tu información está segura con nosotros.
        </p>
      </form>
    </div>
  )
}
