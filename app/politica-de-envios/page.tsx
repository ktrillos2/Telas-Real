import { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { Truck, Clock, MapPin, AlertCircle, Phone, MessageCircle, Mail, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/politica-de-envios" },
  title: { absolute: "Política de Envíos y Tiempos de Entrega | Telas Real Colombia" },
  description:
    "Conoce las condiciones, cobertura nacional, transportadoras aliadas (Coordinadora, Interrapidísimo, Movipack) y tiempos de despacho para tus pedidos textiles en Telas Real.",
};

export default function PoliticaEnviosPage() {
  const sections: LegalSection[] = [
    {
      id: "origen-y-cobertura",
      title: "Origen y cobertura",
      content: (
        <div className="space-y-3">
          <p>
            Todos los pedidos realizados a través del sitio web oficial de <strong>Telas Real S.A.S.</strong> se preparan, cortan, empacan y despachan desde nuestro Centro de Distribución principal ubicado en la ciudad de <strong>Bogotá D.C.</strong>, donde se administra el inventario exclusivo destinado al canal e-commerce.
          </p>
          <p>
            Realizamos envíos a todo el territorio colombiano a través de nuestras transportadoras aliadas: <strong>Coordinadora Mercantil</strong>, <strong>Interrapidísimo</strong> y <strong>Movipack</strong>.
          </p>
          <p className="text-xs text-muted-foreground italic">
            * Para algunos destinos rurales, corregimientos, veredas o municipios apartados de difícil acceso, las transportadoras pueden requerir días adicionales de entrega, aplicación de reexpedición o entrega en oficina principal de cabecera municipal.
          </p>
        </div>
      ),
    },
    {
      id: "procesamiento-del-pedido",
      title: "Procesamiento del pedido",
      content: (
        <div className="space-y-4">
          <p>
            El proceso de corte y alistamiento comienza formalmente una vez se confirme la aprobación del pago por parte de la pasarela y se verifique la exactitud de los datos de entrega suministrados por el comprador.
          </p>
          
          <div className="bg-[#E8F4F8]/70 border border-primary/20 rounded-2xl p-5 space-y-2">
            <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Garantía de Precio Transparente en Telas por Metro</span>
            </h4>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-light">
              Para las compras realizadas directamente a través del sitio web, <strong>no se gestionarán cobros adicionales posteriores</strong> derivados de variaciones entre los metros seleccionados y el peso real de la tela al momento del corte, teniendo en cuenta la lista de precios específica establecida para el canal e-commerce, la cual incorpora un margen del 5 % diseñado para respaldar al cliente frente a estas fluctuaciones textiles.
            </p>
          </div>

          <p>
            El tiempo habitual de alistamiento y empaque en bodega es de <strong>24 a 48 horas hábiles</strong>. Este lapso no incluye sábados, domingos ni días festivos, ni aplica para pedidos con datos incompletos, verificaciones antifraude de la entidad bancaria, pedidos de sublimación personalizada ni situaciones que requieran validación previa con el cliente.
          </p>
        </div>
      ),
    },
    {
      id: "tiempos-estimados-de-transporte",
      title: "Tiempos estimados de transporte",
      content: (
        <div className="space-y-4">
          <p>
            Una vez el paquete es entregado físicamente a la empresa transportadora y se genera el número de guía, los tiempos de transporte estimados son los siguientes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1.5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Ciudades Principales</span>
              <p className="text-2xl font-bold text-foreground">1 a 3</p>
              <p className="text-xs text-muted-foreground">Días hábiles tras despacho (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, etc.)</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1.5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Municipios Intermedios</span>
              <p className="text-2xl font-bold text-foreground">3 a 5</p>
              <p className="text-xs text-muted-foreground">Días hábiles tras entrega a la transportadora</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center space-y-1.5 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Regiones Lejanas</span>
              <p className="text-2xl font-bold text-foreground">Hasta 7</p>
              <p className="text-xs text-muted-foreground">Días hábiles o según plazo especial informado por la transportadora</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed italic">
            * Los plazos de transporte son estimaciones operativas y pueden presentar variaciones por factores ajenos a Telas Real, tales como condiciones climáticas adversas, novedades en la malla vial, contingencias de orden público, temporadas de alta demanda comercial (Black Friday, CyberLunes, festividades decembrinas), caso fortuito o fuerza mayor.
          </p>
        </div>
      ),
    },
    {
      id: "costo-del-envio",
      title: "Costo del envío",
      content: (
        <div className="space-y-3">
          <p>
            El costo del flete de transporte se calcula en función de la ciudad de destino, el peso físico en kilogramos, el volumen cúbico del paquete y las tarifas oficiales vigentes de la empresa transportadora asignada.
          </p>
          <p>
            Cuando el valor no pueda determinarse automáticamente en la pantalla de pago o desees conocer una cotización previa a la compra, nuestro equipo de atención e-commerce te suministrará una estimación a través de WhatsApp:
          </p>
          <div>
            <a
              href="https://wa.me/573159021516?text=Hola,%20quisiera%20solicitar%20una%20cotización%20aproximada%20del%20envío%20de%20mi%20pedido%20de%20telas."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Cotizar flete de envío por WhatsApp: +57 315 902 1516</span>
            </a>
          </div>
        </div>
      ),
    },
    {
      id: "direccion-y-datos-de-entrega",
      title: "Dirección y datos de entrega",
      content: (
        <div className="space-y-3">
          <p>
            Es responsabilidad exclusiva del cliente suministrar de forma completa, veraz y exacta los datos de entrega: nombre y apellido de quien recibe, número de documento de identidad, número de teléfono celular activo, departamento, ciudad/municipio, dirección exacta con nomenclatura y referencias adicionales (barrio, torre, apartamento, local).
          </p>
          <p>
            Telas Real no se hace responsable por retrasos, reprogramaciones, costos de reenvío o devoluciones ocasionados por inconsistencias o errores en la información suministrada por el comprador.
          </p>
          <p className="text-sm">
            Si notas un error en los datos antes de que el pedido sea despachado, puedes solicitar la corrección inmediata a través de:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>WhatsApp E-commerce: <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">+57 315 902 1516</a></li>
            <li>Correo electrónico: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary font-medium hover:underline">tiendavirtual@telasreal.com</a></li>
          </ul>
        </div>
      ),
    },
    {
      id: "seguimiento-y-recepcion",
      title: "Seguimiento y recepción",
      content: (
        <div className="space-y-3">
          <p>
            Una vez el pedido sea entregado a la empresa de mensajería, recibirás una notificación con el número de guía de transporte para realizar el seguimiento en tiempo real en el portal web de la transportadora.
          </p>
          <p>
            El cliente debe hacer seguimiento activo al despacho y garantizar que una persona mayor de edad y debidamente autorizada se encuentre en el domicilio para recibir el paquete. En caso de que la transportadora no logre la entrega tras sus intentos reglamentarios, el paquete podrá quedar en custodia en una sede u oficina principal para retiro personal o ser retornado al origen con los costos asociados que correspondan según sus políticas.
          </p>
        </div>
      ),
    },
    {
      id: "novedades-faltantes-o-danos",
      title: "Novedades, faltantes, daños o errores",
      content: (
        <div className="space-y-4">
          <p>
            Al momento de recibir el paquete, el cliente debe examinar el estado del empaque exterior, verificar que el rótulo corresponda a sus datos y contrastar la referencia, color, metraje y condiciones de la tela <strong>antes de lavarla, cortarla, confeccionarla, sublimarla o transformarla</strong>.
          </p>
          <p>
            Cualquier novedad relacionada con faltantes, daños aparentes en el empaque o recepción de una referencia errónea debe ser reportada idealmente dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la entrega, a través de:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Canal oficial de PQRS: <Link href="/pqr" className="text-primary font-semibold underline">www.telasreal.com/pqr</Link></li>
            <li>WhatsApp de atención: <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">+57 315 902 1516</a></li>
            <li>Correo electrónico: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a></li>
          </ul>
          <p className="text-sm">
            Debes adjuntar el número de orden o factura, copia de la guía de envío y fotografías/videos claros del producto y su empaque original sin alterar. Este plazo operativo facilita la investigación logística con la transportadora y no restringe los derechos de garantía legal del consumidor.
          </p>
        </div>
      ),
    },
    {
      id: "demoras-perdida-o-devolucion",
      title: "Demoras, pérdida o devolución al origen",
      content: (
        <div className="space-y-3">
          <p>
            En caso de una demora extraordinaria o reporte de extravío por parte de la transportadora, Telas Real iniciará de inmediato el reclamo formal ante la empresa de logística y mantendrá al cliente informado del avance de la investigación.
          </p>
          <p>
            Si el paquete es devuelto a nuestro Centro de Distribución por causas imputables al comprador (dirección inexistente, errores en la nomenclatura, ausencia reiterada de personas para recibir), el costo del reenvío será asumido por el cliente. Si la devolución o novedad es atribuible a Telas Real o a la transportadora aliada, nuestra empresa gestionará la solución sin trasladar costos indebidos al consumidor.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main>
      <LegalPageLayout
        badge="Información y Despacho Logístico"
        title="Política de Envíos Nacionales"
        description="Conoce cómo preparamos, alistamos y enviamos tus telas desde Bogotá a toda Colombia, nuestros plazos habituales de entrega y las directrices para el seguimiento y recepción de pedidos."
        lastUpdated="Octubre 2026"
        sections={sections}
        relatedLinks={[
          { title: "Términos y Condiciones", href: "/terminos-y-condiciones" },
          { title: "Política de Privacidad", href: "/politica-de-privacidad" },
          { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes" },
          { title: "Centro de Ayuda y PQRS", href: "/pqr" },
        ]}
      />
    </main>
  );
}
