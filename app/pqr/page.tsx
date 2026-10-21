import { Metadata } from "next";
import Link from "next/link";
import { PqrForm } from "@/components/pqr-form";
import {
  MessageSquare,
  ShieldCheck,
  Clock,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Lightbulb,
  Heart,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/pqr" },
  title: { absolute: "Centro de Ayuda y PQRS | Telas Real Colombia" },
  description:
    "Canal oficial para radicar Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones de Telas Real. Asignación inmediata de número de radicado consecutivo y seguimiento en línea.",
};

export default function PqrPage() {
  const pqrTypes = [
    {
      title: "Petición",
      icon: FileText,
      desc: "Solicitud de información, documentos, aclaraciones o una gestión relacionada con nuestros productos o servicios.",
      badge: "Información y Trámites",
    },
    {
      title: "Queja",
      icon: AlertTriangle,
      desc: "Manifestación de inconformidad relacionada principalmente con la atención, el trato o el comportamiento recibido en cualquiera de nuestros canales.",
      badge: "Atención y Servicio",
    },
    {
      title: "Reclamo",
      icon: RotateCcw,
      desc: "Solicitud de solución frente a un producto textil, metraje, cobro, entrega o compromiso que consideras incumplido o defectuoso.",
      badge: "Garantías y Producto",
    },
    {
      title: "Sugerencia",
      icon: Lightbulb,
      desc: "Propuesta, idea o recomendación para mejorar un producto, catálogo, proceso de compra o forma de atención.",
      badge: "Mejora Continua",
    },
    {
      title: "Felicitación",
      icon: Heart,
      desc: "Reconocimiento a una persona, equipo, tienda física, producto o experiencia positiva que haya superado tus expectativas.",
      badge: "Reconocimiento",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* 1. Hero Section */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-[#F8FAFC] py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-primary/10">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] rounded-full bg-white opacity-40 blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[100%] rounded-full bg-primary/10 opacity-50 blur-3xl mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary backdrop-blur-md shadow-sm">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Estamos para escucharte</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1a202c]">
            Centro de Ayuda y <span className="text-primary font-normal">PQRS</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
            En Telas Real tu opinión es el motor de nuestra mejora continua. Ponemos a disposición de nuestros clientes este canal formal de <strong>Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones (PQRS)</strong> para recibir, clasificar y tramitar tus requerimientos con total claridad, transparencia y oportunidad.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2 text-xs sm:text-sm text-gray-500 font-light">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Número de radicado consecutivo inmediato
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Notificación oficial por correo electrónico
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Conforme al Estatuto del Consumidor
            </span>
          </div>
        </div>
      </section>

      {/* 2. Tipos de Solicitud */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#1a202c] mb-3">
              Tipos de Solicitud
            </h2>
            <p className="text-gray-600 font-light text-sm sm:text-base">
              Identifica la categoría que mejor describe tu requerimiento para garantizar un trámite ágil y el término de respuesta legal que corresponda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {pqrTypes.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-gray-100 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                        {item.badge}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Términos Máximos de Respuesta Legales */}
      <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-[#F4F9FB] border-b border-primary/10">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-light text-[#1a202c] mb-2">
              Términos Máximos de Respuesta
            </h2>
            <p className="text-gray-600 font-light text-sm">
              Nuestros plazos de respuesta se rigen estrictamente por la normativa colombiana de protección al consumidor y derecho de petición.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Reclamaciones de Consumidor</span>
              <p className="text-3xl font-bold text-gray-900">15</p>
              <p className="text-xs font-medium text-gray-700">Días hábiles máximos</p>
              <p className="text-xs text-gray-500 leading-snug">De conformidad con el artículo 58 de la Ley 1480 de 2011 (Estatuto del Consumidor).</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Derecho de Petición General</span>
              <p className="text-3xl font-bold text-gray-900">15</p>
              <p className="text-xs font-medium text-gray-700">Días hábiles siguientes</p>
              <p className="text-xs text-gray-500 leading-snug">De conformidad con el artículo 14 de la Ley 1755 de 2015.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Petición de Información</span>
              <p className="text-3xl font-bold text-gray-900">10</p>
              <p className="text-xs font-medium text-gray-700">Días hábiles siguientes</p>
              <p className="text-xs text-gray-500 leading-snug">Para solicitud de copias o documentos bajo el artículo 14 de la Ley 1755 de 2015.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sugerencias y Felicitaciones</span>
              <p className="text-3xl font-bold text-gray-900">Oportuno</p>
              <p className="text-xs font-medium text-gray-700">Atención interna ágil</p>
              <p className="text-xs text-gray-500 leading-snug">Gestionadas por la coordinación de servicio de Telas Real dentro de las primeras 24 a 48 horas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Formulario Oficial PQRS */}
      <section id="formulario" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 md:py-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#E8F4F8] to-white px-6 sm:px-10 py-8 border-b border-gray-100 relative overflow-hidden">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a202c] relative z-10">
              Formulario de Solicitud PQRS
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base relative z-10 leading-relaxed font-light">
              Diligencia todos los campos solicitados para radicar tu caso. Al presionar &ldquo;Enviar Solicitud&rdquo;, el sistema generará de forma automática tu número de radicado consecutivo oficial para seguimiento y enviará copia de respaldo a tu correo electrónico.
            </p>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <PqrForm />
          </div>
        </div>

        {/* Canales alternativos */}
        <div className="mt-8 text-center text-xs sm:text-sm text-gray-500 font-light space-y-2">
          <p>
            ¿Prefieres recibir orientación previa? Puedes escribir a nuestro WhatsApp oficial:{" "}
            <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
              +57 315 902 1516
            </a>{" "}
            o al correo de Servicio al Cliente:{" "}
            <a href="mailto:sac@telasreal.com" className="text-primary font-medium hover:underline">
              sac@telasreal.com
            </a>
          </p>
          <p>
            Los datos suministrados serán tratados bajo nuestra{" "}
            <Link href="/politica-de-privacidad" className="text-primary underline">
              Política de Privacidad y Manejo de Datos Personales
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
