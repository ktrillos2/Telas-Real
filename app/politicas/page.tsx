import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Truck,
  HelpCircle,
  MessageSquare,
  ArrowRight,
  Building2,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/politicas" },
  title: { absolute: "Políticas Legales y Centro de Transparencia | Telas Real" },
  description:
    "Portal oficial de políticas, términos de servicio, política de envíos y tratamiento de datos personales de Telas Real S.A.S.",
};

export default function PoliticasHubPage() {
  const policies = [
    {
      title: "Términos y Condiciones Generales",
      slug: "/terminos-y-condiciones",
      desc: "Condiciones de compra, margen del 5% e-commerce sin sobrecostos, garantía legal, proceso de pago en Wompi y reglas de contratación.",
      icon: FileText,
      badge: "Uso y Contratación",
    },
    {
      title: "Política de Privacidad y Manejo de Datos",
      slug: "/politica-de-privacidad",
      desc: "Tratamiento de datos personales, finalidades, derechos de hábeas data y canales de atención de conformidad con la Ley 1581 de 2012.",
      icon: Lock,
      badge: "Hábeas Data",
    },
    {
      title: "Política de Envíos Nacionales",
      slug: "/politica-de-envios",
      desc: "Despachos desde Bogotá a toda Colombia con Coordinadora, Interrapidísimo y Movipack, plazos de 1 a 3 días y directrices de entrega.",
      icon: Truck,
      badge: "Logística y Tiempos",
    },
    {
      title: "Preguntas Frecuentes (FAQ)",
      slug: "/preguntas-frecuentes",
      desc: "Respuestas inmediatas a dudas sobre compras mínimas, catálogo textil, sublimación personalizada, medios de pago y garantías.",
      icon: HelpCircle,
      badge: "Guía Rápida",
    },
    {
      title: "Centro de Ayuda y PQRS",
      slug: "/pqr",
      desc: "Radica peticiones, quejas, reclamos, sugerencias o felicitaciones con número de radicado consecutivo y seguimiento en línea.",
      icon: MessageSquare,
      badge: "Atención al Cliente",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-background py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-primary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Transparencia y Seguridad Jurídica</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-tight">
            Nuestras <span className="font-semibold text-primary">Políticas</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            En Telas Real nos comprometemos con la claridad comercial, la protección de tus datos personales y el cumplimiento integral de la normativa de protección al consumidor en Colombia.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Telas Real S.A.S. • NIT 901232650-1 • Bogotá D.C., Colombia</span>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((p, idx) => {
              const Icon = p.icon;
              return (
                <Link
                  key={idx}
                  href={p.slug}
                  className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 flex flex-col justify-between hover:border-primary/40 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F4F8] text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
                        {p.badge}
                      </span>
                      <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mt-1">
                        {p.title}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-border/50 flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:underline">
                    <span>Consultar documento</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
