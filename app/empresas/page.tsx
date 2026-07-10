import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Building2, Package, Truck, Target, CheckCircle2, ChevronRight, BarChart } from "lucide-react"
import { B2bForm } from "@/components/forms/b2b-form"
import { AnimatedCounter } from "@/components/ui/animated-counter"

export const metadata: Metadata = {
  title: "Ventas Corporativas y B2B | Telas Real",
  description: "Soluciones textiles integrales para empresas. Precios mayoristas, abastecimiento garantizado y asesoría especializada en telas y sublimación.",
}

export default function EmpresasPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* 1. Banner Inicial (Hero Section) */}
      <section className="relative bg-[#0F172A] text-white overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/modern-fabric-store-interior.jpg" // Usando una imagen genérica existente de tela/tienda
            alt="Fábrica de telas y suministros"
            fill
            className="object-cover opacity-20 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-3/5 space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold tracking-wider uppercase border border-blue-500/30">
              Canal Mayorista B2B
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Potenciamos el crecimiento de tu empresa
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl font-light">
              Soluciones textiles integrales con capacidad de respuesta para grandes volúmenes. Precios especiales, abastecimiento garantizado y calidad de primer nivel.
            </p>
            <div className="pt-4">
              <Link
                href="#formulario-b2b"
                className="inline-flex items-center gap-2 bg-white text-[#0F172A] hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Soluciones Empresariales
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Espacio para texto introductorio */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-[#0F172A]">
            Un aliado estratégico para tu cadena de suministro
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            Entendemos que en la industria textil, la puntualidad, la calidad y el volumen son factores críticos para el éxito. En Telas Real hemos diseñado un canal corporativo exclusivo para dotaciones, marcas de moda, talleres de confección y distribuidores que buscan un proveedor confiable y a largo plazo.
          </p>
        </div>
      </section>

      {/* 3. Cifras que generan confianza */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Card 1 */}
            <div className="relative p-8 rounded-[2rem] bg-white border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex p-4 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-500">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-5xl font-extrabold text-[#0F172A] mb-3 tracking-tighter">
                  <AnimatedCounter prefix="+" value={15} />
                </h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors duration-300">
                  Años de exp.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative p-8 rounded-[2rem] bg-white border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex p-4 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-500">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-5xl font-extrabold text-[#0F172A] mb-3 tracking-tighter">
                  <AnimatedCounter prefix="+" value={500} />
                </h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] group-hover:text-emerald-500 transition-colors duration-300">
                  Clientes
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative p-8 rounded-[2rem] bg-white border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex p-4 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all duration-500">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-5xl font-extrabold text-[#0F172A] mb-3 tracking-tighter">
                  <AnimatedCounter prefix="+" value={1200} />
                </h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] group-hover:text-purple-600 transition-colors duration-300">
                  Ton / Año
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="relative p-8 rounded-[2rem] bg-white border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 group overflow-hidden flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="mb-6 inline-flex p-4 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-500">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-5xl font-extrabold text-[#0F172A] mb-3 tracking-tighter">
                  <AnimatedCounter prefix="+" value={500000} />
                </h3>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] group-hover:text-orange-500 transition-colors duration-300">
                  Metros disp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Casos de éxito */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">
              Clientes que crecen con Telas Real
            </h2>
            <p className="text-gray-600 text-lg">Casos reales de éxito e impacto en la industria.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Caso 1 */}
            <article className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-6 border-b pb-4">Marca de Ropa Deportiva</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-red-500 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      El Problema
                    </h4>
                    <p className="text-gray-600 font-light">Retrasos constantes en la entrega de telas sublimadas para sus colecciones principales, afectando sus lanzamientos.</p>
                  </div>
                  
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-blue-600 mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      La Solución
                    </h4>
                    <p className="text-gray-600 font-light">Implementación de un plan de abastecimiento programado con Telas Real, asegurando stock en bodega y sublimación in-house.</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-2xl">
                    <h4 className="flex items-center gap-2 font-bold text-green-700 mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      El Resultado
                    </h4>
                    <p className="text-green-900 font-medium">Reducción del 40% en tiempos de producción y aumento de capacidad de respuesta ante picos de demanda.</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Caso 2 */}
            <article className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-[#0F172A] mb-6 border-b pb-4">Empresa de Dotación Corporativa</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-red-500 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      El Problema
                    </h4>
                    <p className="text-gray-600 font-light">Inconsistencia en los tonos de las telas entre diferentes lotes de producción, generando rechazos por parte del cliente final.</p>
                  </div>
                  
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-blue-600 mb-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      La Solución
                    </h4>
                    <p className="text-gray-600 font-light">Telas Real desarrolló una estandarización de colorimetría exclusiva para la marca y asignó un inventario reservado por temporada.</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-2xl">
                    <h4 className="flex items-center gap-2 font-bold text-green-700 mb-2">
                      <BarChart className="w-5 h-5" />
                      El Resultado
                    </h4>
                    <p className="text-green-900 font-medium">0% de rechazos por variación de tono y crecimiento del 25% en licitaciones ganadas.</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Formulario B2B y Beneficios (Layout Dividido) */}
      <section id="formulario-b2b" className="py-20 bg-[#0F172A]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 max-w-7xl mx-auto">
            
            {/* Columna Izquierda: Información y Beneficios */}
            <div className="w-full lg:w-5/12 text-white space-y-12">
              <div>
                <span className="text-blue-400 font-semibold tracking-wider text-sm uppercase">Canal Mayorista B2B</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">Hablemos de negocios</h2>
                <p className="text-gray-300 text-lg font-light">
                  Completa el formulario y uno de nuestros asesores mayoristas se comunicará contigo para brindarte una propuesta personalizada.
                </p>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Precios mayoristas</h3>
                    <p className="text-gray-400 font-light">Accede a precios especiales por volumen y frecuencia de compra.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Abastecimiento garantizado</h3>
                    <p className="text-gray-400 font-light">Capacidad de respuesta para temporadas altas y entregas programadas.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Servicios especializados</h3>
                    <p className="text-gray-400 font-light">Sublimación personalizada, desarrollos a la medida y asesoría en telas.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-gray-300 font-light">
                  En Telas Real construimos relaciones de largo plazo basadas en confianza, calidad y cumplimiento.
                </p>
              </div>
            </div>

            {/* Columna Derecha: Formulario */}
            <div className="w-full lg:w-7/12">
              <B2bForm />
            </div>
            
          </div>
        </div>
      </section>
    </main>
  )
}
