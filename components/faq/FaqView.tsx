"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Truck,
  Layers,
  Palette,
  CreditCard,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  FileQuestion,
  Info,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string | React.ReactNode;
  tags?: string[];
}

export function FaqView() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "compras-1": true, // Primer acordeón abierto por defecto
  });

  const categories = [
    { id: "all", label: "Todas", icon: HelpCircle },
    { id: "compras", label: "Compras", icon: ShoppingCart },
    { id: "envios", label: "Envíos", icon: Truck },
    { id: "productos", label: "Productos", icon: Layers },
    { id: "sublimacion", label: "Sublimación", icon: Palette },
    { id: "pagos", label: "Pagos", icon: CreditCard },
    { id: "cambios", label: "Cambios y Garantías", icon: RotateCcw },
  ];

  const faqs: FaqItem[] = [
    // 1. COMPRAS
    {
      id: "compras-1",
      category: "compras",
      question: "¿Cuál es la compra mínima?",
      answer:
        "Puedes comprar desde la cantidad mínima indicada en la ficha de cada producto. La disponibilidad y la unidad de venta pueden variar según la referencia.",
      tags: ["mínimo", "metros", "compra"],
    },
    {
      id: "compras-2",
      category: "compras",
      question: "¿Las telas se venden por metro o por kilogramo?",
      answer:
        "En el sitio web las telas se seleccionan y se muestran por metros para facilitar la planeación de cada proyecto. Para el canal e-commerce, Telas Real cuenta con una lista de precios específica que incorpora un margen del 5 %, definido para gestionar las variaciones que pueden presentarse entre la cantidad seleccionada en metros y el peso real de la tela al momento del corte y alistamiento.",
      tags: ["metros", "kilos", "precios", "margen"],
    },
    {
      id: "compras-3",
      category: "compras",
      question: "¿El valor de mi pedido puede cambiar después de pagarlo?",
      answer:
        "No. Para las compras realizadas directamente a través del sitio web, el precio pagado por el cliente corresponde al valor de su pedido conforme a la lista de precios vigente establecida para el canal e-commerce. Esta lista incorpora un margen del 5 % para gestionar las variaciones que puedan presentarse entre los metros seleccionados y el peso real de la tela cortada y alistada. Por esta razón, no se realizará al cliente un cobro adicional posterior derivado de estas diferencias.",
      tags: ["precio", "cobro", "pago final"],
    },
    {
      id: "compras-4",
      category: "compras",
      question: "¿Puedo comprar al por mayor?",
      answer: (
        <div className="space-y-3">
          <p>
            Sí. Contamos con precios por volumen y atención para clientes corporativos, confeccionistas y negocios. Las condiciones dependen de la referencia y la cantidad solicitada.
          </p>
          <div>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm"
            >
              <span>Diligenciar formulario de ventas al por mayor</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ),
      tags: ["mayorista", "b2b", "empresas", "volumen"],
    },

    // 2. ENVÍOS
    {
      id: "envios-1",
      category: "envios",
      question: "¿Desde dónde se despachan los pedidos del sitio web?",
      answer:
        "Todos los pedidos realizados en el sitio web se alistan y despachan desde Bogotá, donde se administra el inventario disponible para el canal e-commerce.",
      tags: ["origen", "bogota", "despacho"],
    },
    {
      id: "envios-2",
      category: "envios",
      question: "¿A qué lugares realizan envíos?",
      answer:
        "Realizamos envíos a ciudades y municipios de Colombia con cobertura de las transportadoras aliadas (Coordinadora, Interrapidísimo y Movipack). Para zonas de difícil acceso pueden aplicar condiciones, tiempos o costos adicionales.",
      tags: ["cobertura", "ciudades", "municipios", "colombia"],
    },
    {
      id: "envios-3",
      category: "envios",
      question: "¿Cuánto tarda en llegar mi pedido?",
      answer: (
        <div className="space-y-3">
          <p>
            El alistamiento toma normalmente entre 24 y 48 horas hábiles después de confirmarse el pago y la información del pedido. Una vez entregado a la transportadora, los tiempos de entrega estimados son:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Ciudades principales:</strong> de 1 a 3 días hábiles.</li>
            <li><strong>Municipios intermedios:</strong> de 3 a 5 días hábiles.</li>
            <li><strong>Regiones lejanas o de difícil acceso:</strong> hasta 7 días hábiles.</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            * Estos tiempos son estimados y pueden variar según novedades de la transportadora, clima u orden público.
          </p>
        </div>
      ),
      tags: ["tiempos", "demora", "plazos", "dias"],
    },
    {
      id: "envios-4",
      category: "envios",
      question: "¿Cómo hago seguimiento a mi pedido?",
      answer:
        "Cuando el pedido sea despachado recibirás el número de guía para consultar el estado directamente con la transportadora encargada.",
      tags: ["guía", "rastreo", "seguimiento"],
    },
    {
      id: "envios-5",
      category: "envios",
      question: "¿Cuánto cuesta el envío?",
      answer: (
        <div className="space-y-3">
          <p>
            El costo depende del destino, el peso, el volumen y las características del pedido, y es determinado por la transportadora.
          </p>
          <p>
            Puedes solicitar una cotización aproximada antes de comprar a través de nuestro canal de WhatsApp:
          </p>
          <a
            href="https://wa.me/573159021516?text=Hola,%20deseo%20solicitar%20una%20cotización%20aproximada%20del%20envío%20de%20mi%20pedido."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Consultar costo de envío por WhatsApp (315 902 1516)</span>
          </a>
        </div>
      ),
      tags: ["costo", "flete", "precio envio"],
    },

    // 3. PRODUCTOS
    {
      id: "prod-1",
      category: "productos",
      question: "¿El color de la tela puede variar?",
      answer:
        "Sí. El color puede verse diferente según la configuración de la pantalla, la iluminación de la fotografía y el lote de producción. Las imágenes son una referencia visual; si el tono es determinante para tu proyecto, solicita asesoría antes de comprar.",
      tags: ["color", "tono", "pantalla", "variacion"],
    },
    {
      id: "prod-2",
      category: "productos",
      question: "¿La tela se entrega en una sola pieza?",
      answer:
        "Procuramos enviar la cantidad solicitada en una sola pieza, siempre que la disponibilidad del rollo lo permita. Si es necesario despachar la cantidad en más de un corte, nuestro equipo podrá contactarte antes del envío.",
      tags: ["corte", "pieza", "rollo"],
    },
    {
      id: "prod-3",
      category: "productos",
      question: "¿Dónde consulto el ancho y las características de una tela?",
      answer:
        "En la ficha de cada producto puedes consultar el ancho, la composición, el gramaje, los usos sugeridos y otras características disponibles. También puedes utilizar los filtros de la tienda para encontrar referencias según tus necesidades.",
      tags: ["ancho", "gramaje", "composicion", "especificaciones"],
    },
    {
      id: "prod-4",
      category: "productos",
      question: "¿Qué tipo de telas venden?",
      answer:
        "Nuestro portafolio se concentra principalmente en telas a base de poliéster, con opciones unicolor, sublimadas, elásticas, livianas, deportivas y de diferentes texturas para prendas, accesorios y otros proyectos textiles.",
      tags: ["catalogo", "poliester", "tipos de tela"],
    },
    {
      id: "prod-5",
      category: "productos",
      question: "¿Venden telas de fibras naturales o para tapicería?",
      answer:
        "Actualmente nuestro portafolio se concentra en telas a base de poliéster y no contamos con una línea especializada de tapicería. Algunas referencias pueden servir para forros u otros proyectos; recomendamos validar el uso con un asesor antes de comprar.",
      tags: ["tapiceria", "fibras naturales", "algodon"],
    },

    // 4. SUBLIMACIÓN
    {
      id: "sub-1",
      category: "sublimacion",
      question: "¿Ofrecen servicio de sublimación?",
      answer:
        "Sí. Podemos imprimir diseños sobre referencias de poliéster aptas para sublimación. Puedes elegir diseños disponibles o solicitar un desarrollo personalizado, sujeto a revisión técnica, cantidades mínimas y condiciones del servicio.",
      tags: ["sublimacion", "estampado", "impresion"],
    },
    {
      id: "sub-2",
      category: "sublimacion",
      question: "¿Cómo solicito una sublimación personalizada?",
      answer: (
        <div className="space-y-4">
          <p>
            Debes enviar un diseño replicable en formato PDF y adaptado a las dimensiones de la tela seleccionada. El pedido mínimo es de 10 metros. Después de revisar el archivo se realiza una muestra para aprobación; la producción comienza únicamente cuando el cliente confirma la muestra.
          </p>

          <div className="bg-[#E8F4F8]/60 border border-primary/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-foreground/90 font-light space-y-1.5 leading-relaxed">
                <p>
                  <strong>Requisitos importantes para sublimar:</strong>
                </p>
                <p>
                  Si el link redirecciona a tela Brush y esta no es la tela que deseas sublimar, debes elegir la correcta (del catálogo de Telas Real) en las opciones; si no encuentras la tela, debes marcar &ldquo;Otro&rdquo; y en observaciones indicarnos qué tela es, ya que en este caso se prestaría solo el servicio de sublimación.
                </p>
                <p>
                  La tela debe ser a base de poliéster y tener 1.50 m de ancho. Debes enviarnos una muestra física de la misma de 20x20 cm para hacer prueba antes de sublimar el pedido completo. Para este caso en especial, esta sección sirve como cotizador y se concretará el pedido directamente vía WhatsApp con el área de E-commerce.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/personalizado">
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium">
                  Ver requisitos y subir mi diseño
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <a
                href="https://wa.me/573159021516?text=Hola,%20tengo%20preguntas%20sobre%20el%20servicio%20de%20sublimación%20personalizada."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Asesoría Sublimación WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      ),
      tags: ["personalizado", "diseño", "requisitos", "brush"],
    },
    {
      id: "sub-3",
      category: "sublimacion",
      question: "¿Qué ocurre si apruebo la muestra de sublimación y después cancelo el pedido?",
      answer:
        "Los trabajos personalizados requieren un abono inicial del 20%, según la condición informada en la cotización. Una vez aprobada la muestra y autorizado el inicio de la producción, si el cliente desiste por cambio de opinión no se devuelve el abono y debe pagar el saldo pendiente del producto elaborado. Si existe un defecto, una diferencia frente a la muestra aprobada o un error atribuible a Telas Real, el caso será revisado con las evidencias correspondientes.",
      tags: ["abono", "cancelacion", "20%", "muestra"],
    },

    // 5. PAGOS
    {
      id: "pag-1",
      category: "pagos",
      question: "¿Qué medios de pago aceptan?",
      answer: (
        <div className="space-y-3">
          <p>
            Los pagos del sitio web se procesan con total seguridad mediante la pasarela de pagos <strong>Wompi (Bancolombia)</strong>.
          </p>
          <p>
            Los medios disponibles incluyen:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>PSE</strong> (Cuentas de ahorro y corrientes de todos los bancos en Colombia).</li>
            <li><strong>Nequi</strong> y <strong>Daviplata</strong>.</li>
            <li><strong>Tarjetas de Crédito y Débito</strong> (Visa, Mastercard, American Express).</li>
            <li><strong>Botón Bancolombia</strong>.</li>
          </ul>
        </div>
      ),
      tags: ["wompi", "pse", "nequi", "tarjetas", "daviplata"],
    },

    // 6. CAMBIOS, GARANTÍAS Y RETRACTO
    {
      id: "cam-1",
      category: "cambios",
      question: "¿Puedo devolver una tela porque cambié de opinión?",
      answer:
        "Las solicitudes de retracto de compras realizadas a distancia se analizan conforme al artículo 47 de la Ley 1480 de 2011. El término general para ejercerlo es de cinco (5) días hábiles desde la entrega. Sin embargo, la ley contempla excepciones para bienes confeccionados según las especificaciones del consumidor o claramente personalizados. Por ello, el retracto puede no proceder cuando la tela ya fue cortada en la cantidad solicitada, sublimada o personalizada, siempre que el caso encaje legalmente en dicha excepción.",
      tags: ["retracto", "devolucion", "corte a medida", "ley 1480"],
    },
    {
      id: "cam-2",
      category: "cambios",
      question: "¿Qué hago si la tela tiene un defecto, llega incompleta o recibo una referencia diferente?",
      answer: (
        <div className="space-y-3">
          <p>
            Repórtalo idealmente dentro de los cinco (5) días hábiles siguientes a través de nuestro canal oficial de{" "}
            <Link href="/pqr" className="text-primary font-semibold underline hover:text-primary/80">
              Centro de Ayuda y PQRS
            </Link>
            .
          </p>
          <p>
            Indica el número de pedido o factura y adjunta fotografías o videos del producto, el empaque y la guía de Coordinadora. Conserva la tela sin lavar, usar, cortar, confeccionar ni transformar mientras se realiza la validación técnica. Este plazo operativo no limita los derechos de garantía legal del consumidor.
          </p>
          <div>
            <Link href="/pqr">
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                Radicar Solicitud en PQRS
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      ),
      tags: ["defecto", "garantia", "incompleta", "pqr", "reclamo"],
    },
    {
      id: "cam-3",
      category: "cambios",
      question: "¿Cuánto dura la garantía legal?",
      answer: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            De conformidad con los artículos 8 y siguientes de la Ley 1480 de 2011 – Estatuto del Consumidor, la garantía legal protege al consumidor frente a situaciones relacionadas con la calidad, idoneidad, seguridad y buen estado del producto, en los términos establecidos por la normativa aplicable.
          </p>
          <p>
            Para las telas comercializadas por Telas Real se establece un término de garantía de <strong>cinco (5) días</strong>, contados a partir de la entrega del producto. Este término será informado al consumidor de manera clara, previa y verificable.
          </p>
          <p>
            Para solicitar la garantía, el cliente deberá comunicarse con Telas Real dentro del término establecido e informar la novedad presentada. Cada solicitud será evaluada con el fin de determinar la procedencia de la garantía de acuerdo con las condiciones del producto y la normativa vigente.
          </p>
          <p>
            Cuando la garantía resulte procedente y sea necesario el transporte del producto para hacerla efectiva, Telas Real asumirá los costos correspondientes, de conformidad con lo establecido en el artículo 11 de la Ley 1480 de 2011 y su reglamentación.
          </p>
          <p>
            Cuando, después de la evaluación del caso, se determine de manera sustentada que la garantía no resulta procedente o que se configura alguna de las causales legales de exoneración, se informará al consumidor la decisión y sus razones.
          </p>
        </div>
      ),
      tags: ["garantia legal", "5 dias", "estatuto consumidor"],
    },
    {
      id: "cam-4",
      category: "cambios",
      question: "¿Qué es la reversión del pago?",
      answer:
        "En compras pagadas electrónicamente, el consumidor puede solicitar la reversión cuando exista fraude, una operación no solicitada, el producto no sea recibido, llegue defectuoso o no corresponda a lo pedido. Para ejercer este mecanismo debe presentar la reclamación a Telas Real y notificar al emisor del medio de pago dentro de los cinco días hábiles establecidos por la ley.",
      tags: ["reversion de pago", "fraude", "banco"],
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesText =
        item.question.toLowerCase().includes(q) ||
        (typeof item.answer === "string" && item.answer.toLowerCase().includes(q)) ||
        item.tags?.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesText;
    });
  }, [activeCategory, search]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="bg-background min-h-screen">
      {/* 1. HERO & SEARCH */}
      <section className="relative bg-gradient-to-b from-[#E8F4F8] via-[#F4F9FB] to-background py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-primary/10">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-primary shadow-sm backdrop-blur-sm">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span>Centro de Ayuda Telas Real</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-tight">
            Preguntas <span className="font-semibold text-primary">Frecuentes</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
            Encuentra respuestas claras y detalladas sobre compras, envíos, características textiles, sublimación, pagos y garantías.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-muted-foreground absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca por palabra clave (ej: envíos, corte, Wompi, garantía, 10 metros)..."
                className="w-full rounded-full border border-input bg-card py-3.5 pl-12 pr-4 text-sm sm:text-base text-foreground shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TABS */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-background border-b border-border/40 sticky top-16 md:top-20 z-20 backdrop-blur-md bg-background/90">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar justify-start sm:justify-center">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium shrink-0 transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FAQ ACCORDION LIST */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto max-w-4xl">
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = !!openItems[faq.id];
                return (
                  <div
                    key={faq.id}
                    className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? "bg-card border-primary/40 shadow-md shadow-primary/5"
                        : "bg-card border-border hover:border-border/80"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none"
                    >
                      <span className="font-medium text-base sm:text-lg text-foreground leading-snug">
                        {faq.question}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                          isOpen
                            ? "bg-primary text-primary-foreground rotate-180"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-6 pt-0 text-sm sm:text-base text-muted-foreground font-light leading-relaxed border-t border-border/30 animate-in fade-in-50 duration-200">
                        <div className="pt-4">{faq.answer}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4 max-w-md mx-auto">
              <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto stroke-1" />
              <h3 className="text-xl font-medium text-foreground">
                No encontramos resultados para tu búsqueda
              </h3>
              <p className="text-sm text-muted-foreground font-light">
                Intenta con otros términos o contáctanos directamente para ayudarte con tu consulta.
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
              >
                Ver todas las preguntas
              </Button>
            </div>
          )}

          {/* Banner de Contacto adicional */}
          <div className="mt-16 bg-[#E8F4F8] border border-primary/20 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-primary">
                ¿No encontraste lo que buscabas?
              </h3>
              <p className="text-sm text-muted-foreground font-light max-w-xl">
                Nuestro equipo de asesores está listo para resolver tus inquietudes sobre telas, metrajes, cotizaciones y pedidos.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-end shrink-0">
              <a
                href="https://wa.me/573159021516?text=Hola,%20tengo%20una%20consulta%20sobre%20los%20productos%20y%20servicios%20de%20Telas%20Real."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hablar por WhatsApp</span>
              </a>
              <Link href="/pqr">
                <Button variant="outline" className="rounded-full px-6 py-3 text-sm border-primary/30">
                  Radicar PQR
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
