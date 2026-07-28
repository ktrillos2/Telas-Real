import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Building2, Package, Truck, Target, CheckCircle2, ChevronRight, BarChart } from "lucide-react"
import { B2bForm } from "@/components/forms/b2b-form"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { client } from "@/sanity/lib/client"
import { groq } from "next-sanity"

const query = groq`*[_type == "empresasPage"][0]{
  seoTitle,
  seoDescription,
  hero {
    tagline,
    title,
    description,
    buttonText,
    "backgroundImage": backgroundImage.asset->url + "?auto=format&w=1920&q=80"
  },
  introduction {
    title,
    description
  },
  stats {
    years,
    clients,
    tons,
    inventory
  },
  successCases {
    title,
    subtitle,
    cases[] {
      clientName,
      problem,
      solution,
      result,
      colorTheme
    }
  },
  formSection {
    tagline,
    title,
    description,
    benefits[] {
      icon,
      title,
      description
    },
    footerText
  }
}`

export async function generateMetadata(): Promise<Metadata> {
  const data = await client.fetch(query)
  return {
    title: data?.seoTitle || "Ventas Corporativas y B2B | Telas Real",
    description: data?.seoDescription || "Soluciones textiles integrales para empresas. Precios mayoristas, abastecimiento garantizado y asesoría especializada en telas y sublimación.",
  }
}

function getIconComponent(iconName: string, className: string) {
  switch (iconName) {
    case 'Package': return <Package className={className} />
    case 'Truck': return <Truck className={className} />
    case 'Building2': return <Building2 className={className} />
    default: return <CheckCircle2 className={className} />
  }
}

export default async function EmpresasPage() {
  const data = await client.fetch(query)

  const hero = {
    tagline: data?.hero?.tagline || 'Canal Mayorista B2B',
    title: data?.hero?.title || 'Potenciamos el crecimiento de tu empresa',
    description: data?.hero?.description || 'Soluciones textiles integrales con capacidad de respuesta para grandes volúmenes. Precios especiales, abastecimiento garantizado y calidad de primer nivel.',
    buttonText: data?.hero?.buttonText || 'Soluciones Empresariales',
    backgroundImage: data?.hero?.backgroundImage || '/banner-hq.png'
  }

  const intro = {
    title: data?.introduction?.title || 'Un aliado estratégico para tu cadena de suministro',
    description: data?.introduction?.description || 'Entendemos que en la industria textil, la puntualidad, la calidad y el volumen son factores críticos para el éxito. En Telas Real hemos diseñado un canal corporativo exclusivo para pronta moda, talleres de confección y distribuidores que buscan un proveedor confiable y a largo plazo.'
  }

  const stats = {
    years: data?.stats?.years ?? 7,
    clients: data?.stats?.clients ?? 200,
    tons: data?.stats?.tons ?? 1400,
    inventory: data?.stats?.inventory ?? 500000
  }

  const cases = {
    title: data?.successCases?.title || 'Clientes que crecen con Telas Real',
    subtitle: data?.successCases?.subtitle || 'Casos reales de éxito e impacto en la industria.',
    cases: data?.successCases?.cases?.length > 0 ? data.successCases.cases : [
      {
        clientName: 'Sebastian',
        problem: 'Retrasos constantes en la entrega de telas sublimadas para sus colecciones principales, afectando sus lanzamientos.',
        solution: 'Implementación de un plan de abastecimiento programado con Telas Real, asegurando stock en bodega y sublimación in-house.',
        result: 'Reducción del 40% en tiempos de producción y aumento de capacidad de respuesta ante picos de demanda.',
        colorTheme: 'blue'
      },
      {
        clientName: 'Leidy Rodriguez',
        problem: 'Inconsistencia en los tonos de las telas entre diferentes lotes de producción, generando rechazos por parte del cliente final.',
        solution: 'Telas Real desarrolló una estandarización de colorimetría exclusiva para la marca y asignó un inventario reservado por temporada.',
        result: '0% de rechazos por variación de tono y crecimiento del 25% en licitaciones ganadas.',
        colorTheme: 'purple'
      },
      {
        clientName: 'Tai Clothes',
        problem: 'Problemas con la calidad de insumos para escalar su línea de moda, limitando su expansión.',
        solution: 'Asesoría personalizada en telas y establecimiento de un canal de distribución ágil para sus volúmenes requeridos.',
        result: 'Crecimiento sostenido con un proveedor que escala al ritmo de la marca garantizando calidad superior.',
        colorTheme: 'orange'
      }
    ]
  }

  const formSection = {
    tagline: data?.formSection?.tagline || 'SOLUCIONES A MEDIDA',
    title: data?.formSection?.title || 'Hablemos de negocios',
    description: data?.formSection?.description || 'Completa el formulario y uno de nuestros asesores mayoristas se comunicará contigo para brindarte una solución oportuna.',
    footerText: data?.formSection?.footerText || 'Garantizamos la privacidad de tus datos. Al enviar el formulario aceptas nuestra política de tratamiento de datos.',
    benefits: data?.formSection?.benefits?.length > 0 ? data.formSection.benefits : [
      { icon: 'Package', title: 'Precios mayoristas', description: 'Accede a precios especiales por volumen y frecuencia de compra.' },
      { icon: 'Truck', title: 'Abastecimiento garantizado', description: 'Capacidad de respuesta para temporadas altas y entregas programadas.' },
      { icon: 'Building2', title: 'Servicios especializados', description: 'Sublimación personalizada, desarrollos a la medida y asesoría en telas.' }
    ]
  }

  const getThemeClasses = (color: string) => {
    switch(color) {
      case 'purple': return { bg: 'bg-purple-50', text: 'text-purple-600' }
      case 'orange': return { bg: 'bg-orange-50', text: 'text-orange-500' }
      case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-600' }
      case 'red': return { bg: 'bg-red-50', text: 'text-red-600' }
      case 'blue': 
      default: 
        return { bg: 'bg-blue-50', text: 'text-blue-600' }
    }
  }

  return (
    <main className="bg-white min-h-screen">
      {/* 1. Banner Inicial (Hero Section) */}
      <section className="relative bg-[#0F172A] text-white overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={hero.backgroundImage}
            alt={hero.title}
            fill
            className="object-cover opacity-20 mix-blend-overlay"
            priority
            unoptimized={hero.backgroundImage?.startsWith?.('blob:')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/90 to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-3/5 space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold tracking-wider uppercase border border-blue-500/30">
              {hero.tagline}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {hero.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl font-light">
              {hero.description}
            </p>
            <div className="pt-4">
              <Link
                href="#formulario-b2b"
                className="inline-flex items-center gap-2 bg-white text-[#0F172A] hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                {hero.buttonText}
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
            {intro.title}
          </h2>
          <p className="text-lg text-gray-600 font-light leading-relaxed">
            {intro.description}
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
                  <AnimatedCounter prefix="+" value={stats.years} />
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
                  <AnimatedCounter prefix="+" value={stats.clients} />
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
                  <AnimatedCounter prefix="+" value={stats.tons} />
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
                  <AnimatedCounter prefix="+" value={stats.inventory} />
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
              {cases.title}
            </h2>
            <p className="text-gray-600 text-lg">{cases.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {cases.cases.map((c: any, index: number) => {
              const theme = getThemeClasses(c.colorTheme)
              return (
                <article key={index} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} rounded-bl-full -z-0`}></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-[#0F172A] mb-6 border-b pb-4">{c.clientName}</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="flex items-center gap-2 font-bold text-red-500 mb-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          El Problema
                        </h4>
                        <p className="text-gray-600 font-light text-sm">{c.problem}</p>
                      </div>
                      
                      <div>
                        <h4 className={`flex items-center gap-2 font-bold ${theme.text} mb-2`}>
                          <span className={`w-2 h-2 rounded-full ${theme.bg.replace('bg-', 'bg-').replace('-50', '-500')}`}></span>
                          La Solución
                        </h4>
                        <p className="text-gray-600 font-light text-sm">{c.solution}</p>
                      </div>

                      <div className="bg-green-50 p-4 rounded-xl">
                        <h4 className="flex items-center gap-2 font-bold text-green-700 mb-2">
                          <CheckCircle2 className="w-5 h-5" />
                          El Resultado
                        </h4>
                        <p className="text-green-900 font-medium text-sm">{c.result}</p>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
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
                <span className="text-blue-400 font-semibold tracking-wider text-sm uppercase">{formSection.tagline}</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">{formSection.title}</h2>
                <p className="text-gray-300 text-lg font-light">
                  {formSection.description}
                </p>
              </div>

              <div className="space-y-8">
                {formSection.benefits.map((b: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      {getIconComponent(b.icon, "w-6 h-6 text-white")}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{b.title}</h3>
                      <p className="text-gray-400 font-light">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-gray-300 font-light">
                  {formSection.footerText}
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
