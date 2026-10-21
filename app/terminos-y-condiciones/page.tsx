import { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { Shield, FileCheck, Phone, Mail, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/terminos-y-condiciones" },
  title: { absolute: "Términos y Condiciones Generales de Uso y Compra | Telas Real" },
  description:
    "Revisa los términos, condiciones comerciales, políticas de pago en Wompi, garantía legal y uso de la plataforma de comercio electrónico de Telas Real S.A.S. en Colombia.",
};

export default function TerminosCondicionesPage() {
  const sections: LegalSection[] = [
    {
      id: "identificacion-del-proveedor",
      title: "Identificación del proveedor",
      content: (
        <div className="space-y-3">
          <p>
            El sitio web oficial <strong>www.telasreal.com</strong> es de propiedad y se encuentra operado por la sociedad comercial <strong>Telas Real S.A.S.</strong>, identificada tributariamente con el <strong>NIT 901232650-1</strong>, con domicilio principal en la ciudad de <strong>Bogotá D.C., Colombia, en la Calle 12 # 38-65</strong>.
          </p>
          <p className="text-sm">
            Para cualquier comunicación, orientación o requerimiento relacionado con compras en el canal e-commerce, disponemos de los siguientes canales oficiales:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Línea y WhatsApp de atención: <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">+57 315 902 1516</a></li>
            <li>Correo electrónico de soporte: <a href="mailto:tiendavirtual@telasreal.com" className="text-primary font-medium hover:underline">tiendavirtual@telasreal.com</a></li>
          </ul>
        </div>
      ),
    },
    {
      id: "aceptacion-y-uso-del-sitio",
      title: "Aceptación y uso del sitio",
      content: (
        <div className="space-y-3">
          <p>
            Al acceder, navegar, registrarse o realizar compras en este sitio web, el usuario declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones, así como la <Link href="/politica-de-privacidad" className="text-primary underline">Política de Privacidad y Tratamiento de Datos</Link> y la <Link href="/politica-de-envios" className="text-primary underline">Política de Envíos</Link>.
          </p>
          <p>
            El usuario se compromete a hacer un uso lícito, diligente y de buena fe de la plataforma, suministrando datos personales e información verídica, y absteniéndose de ejecutar actos que puedan vulnerar la seguridad informática, deshabilitar funciones, dañar el software o infringir derechos de terceros.
          </p>
        </div>
      ),
    },
    {
      id: "registro-y-cuenta",
      title: "Registro y cuenta de usuario",
      content: (
        <div className="space-y-3">
          <p>
            Para realizar compras o gestionar pedidos en la plataforma, el usuario puede crear una cuenta personal proporcionando información veraz y actualizada. El usuario es el único responsable de custodiar la confidencialidad de su contraseña y de todas las transacciones realizadas bajo sus credenciales de acceso.
          </p>
          <p>
            Telas Real se reserva la facultad de verificar la autenticidad de las cuentas, solicitar confirmaciones razonables en caso de sospecha de suplantación o fraude, y suspender o cancelar cuentas que infrinjan la ley o estos términos.
          </p>
        </div>
      ),
    },
    {
      id: "informacion-de-productos",
      title: "Información de productos y características textiles",
      content: (
        <div className="space-y-3">
          <p>
            Telas Real procura que las fotografías, nombres, especificaciones técnicas (ancho, gramaje, composición y rendimiento aproximado) y recomendaciones de uso de cada tela sean lo más precisas y fieles posible a la realidad textil.
          </p>
          <p>
            No obstante, el comprador reconoce que pueden presentarse variaciones perceptibles de tono o brillo debido a la calibración de color de cada pantalla, la iluminación de la fotografía y los lotes industriales de tintura de fábrica. Las sugerencias de uso (prendas, pijamas, forros, etc.) son estrictamente orientativas; corresponde al cliente constatar que la referencia cumpla los requerimientos específicos de su proyecto de confección.
          </p>
        </div>
      ),
    },
    {
      id: "precios-unidad-y-facturacion",
      title: "Precios, unidad de selección y facturación",
      content: (
        <div className="space-y-4">
          <p>
            Todos los precios publicados en el sitio web están expresados en pesos colombianos (COP) e incluyen los impuestos de ley que resulten aplicables conforme a la normativa tributaria nacional.
          </p>
          <div className="bg-[#E8F4F8]/70 border border-primary/20 rounded-2xl p-5 space-y-2">
            <h4 className="font-semibold text-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Unidad de Venta y Margen de Compensación Textil (5%)</span>
            </h4>
            <p className="text-xs sm:text-sm text-foreground/90 font-light leading-relaxed">
              En el sitio web, las telas se seleccionan y cotizan por metros lineales para mayor facilidad de planeación del cliente. Para el canal e-commerce, Telas Real cuenta con una lista de precios específica que incorpora un margen del 5 %, definido para gestionar las variaciones que puedan presentarse entre la cantidad seleccionada en metros y el peso real de la tela cortada y alistada. Por esta razón, <strong>para las compras realizadas directamente a través del sitio web no se realizará al cliente un cobro adicional posterior derivado de estas diferencias</strong>.
            </p>
          </div>
          <p className="text-sm">
            Los precios, promociones y descuentos pueden ser modificados en cualquier momento para compras futuras sin previo aviso. El precio aplicable a cada orden será el formalmente informado y aceptado en la pantalla de liquidación al momento de completar la transacción.
          </p>
        </div>
      ),
    },
    {
      id: "disponibilidad-e-inventario",
      title: "Disponibilidad e inventario",
      content: (
        <div className="space-y-3">
          <p>
            La exhibición de un producto en el catálogo digital no constituye una garantía de disponibilidad indefinida. El inventario publicado corresponde al asignado para el canal de venta en línea y es administrado centralizadamente desde la bodega en Bogotá.
          </p>
          <p>
            Si con posterioridad a la compra se detectase una ruptura imprevista de inventario, defecto en el rollo final o imposibilidad técnica de corte para una referencia, Telas Real contactará al comprador de manera inmediata para proponer alternativas de cambio de tono o referencia similar, o proceder a la devolución del dinero pagado por dicho producto.
          </p>
        </div>
      ),
    },
    {
      id: "formacion-del-pedido",
      title: "Formación y perfeccionamiento del pedido",
      content: (
        <div className="space-y-3">
          <p>
            El mero hecho de añadir productos al carrito de compras no representa una reserva de inventario ni obliga contractualmente a Telas Real. La orden de compra se considera recibida una vez la plataforma emita la confirmación electrónica correspondiente.
          </p>
          <p>
            La aceptación definitiva del pedido queda sujeta a la validación exitosa del pago a través de la pasarela, verificación de datos de entrega, disponibilidad del rollo en bodega y filtros preventivos de seguridad contra fraudes. Telas Real se reserva el derecho de rechazar o cancelar transacciones en caso de inconsistencias evidentes, informando al cliente y gestionando el reintegro de fondos a que hubiere lugar.
          </p>
        </div>
      ),
    },
    {
      id: "pagos-y-facturacion",
      title: "Pagos y facturación electrónica",
      content: (
        <div className="space-y-3">
          <p>
            Los pagos electrónicos se procesan a través de la pasarela de pagos <strong>Wompi (Bancolombia)</strong>. Los medios habilitados pueden incluir PSE, tarjetas de crédito y débito, Nequi y Daviplata. La aprobación de la transacción depende exclusivamente de los controles de la respectiva entidad bancaria.
          </p>
          <p>
            Telas Real no almacena números de tarjetas de crédito ni códigos de seguridad bancarios. Al momento de la compra, el cliente debe suministrar los datos fiscales requeridos para la expedición de la factura electrónica de venta de acuerdo con los requisitos exigidos por la Dirección de Impuestos y Aduanas Nacionales (DIAN).
          </p>
        </div>
      ),
    },
    {
      id: "corte-sublimacion-y-personalizacion",
      title: "Corte, sublimación y personalización de telas",
      content: (
        <div className="space-y-4">
          <p>
            Para pedidos de sublimación personalizada, programación o desarrollos textiles por encargo realizados por clientes nuevos, se requerirá un <strong>abono inicial obligatorio equivalente al 20 % del valor total cotizado</strong>, previo al inicio del proceso de diseño, montaje y producción.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2 text-amber-950">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Condición de Retiro y Liquidación de Trabajos Personalizados</span>
            </h4>
            <p className="text-xs sm:text-sm leading-relaxed font-light">
              Una vez el CEDI/Bodega confirme que el pedido se encuentra completamente terminado y listo para entrega, Telas Real notificará al cliente a través de los canales de contacto registrados. A partir de dicha confirmación comenzará a contarse un plazo de <strong>quince (15) días hábiles</strong> para que el cliente realice el pago del saldo pendiente y retire o autorice el despacho de su pedido.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed font-light">
              <strong>Transcurrido el plazo informado de 15 días hábiles sin que el cliente haya realizado el pago del saldo pendiente y retirado su pedido, no procederá la devolución del abono inicial entregado.</strong>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Estas condiciones se informan al cliente de manera previa y clara antes de recibir el abono y autorizar la producción.
          </p>
        </div>
      ),
    },
    {
      id: "envios",
      title: "Envíos y transporte nacional",
      content: (
        <div className="space-y-3">
          <p>
            Los envíos de telas se despachan desde Bogotá a toda Colombia y se rigen íntegramente por las disposiciones estipuladas en nuestra <Link href="/politica-de-envios" className="text-primary underline">Política de Envíos</Link>.
          </p>
          <p>
            Los plazos de transporte informados son estimaciones y comienzan a computarse tras el despacho físico del paquete a la transportadora aliada.
          </p>
        </div>
      ),
    },
    {
      id: "retracto-garantia-y-reversion",
      title: "Derecho de retracto, garantía legal y reversión del pago",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-sm">1. Derecho de Retracto (Art. 47 Ley 1480 de 2011)</h4>
            <p className="text-sm">
              En las ventas a distancia mediante comercio electrónico, el consumidor podrá ejercer el derecho de retracto dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la entrega de la mercancía, siempre que no resulte aplicable ninguna excepción legal. El producto debe devolverse en el mismo estado en que fue recibido, asumiendo el consumidor los gastos de transporte correspondientes.
            </p>
            <p className="text-sm">
              De acuerdo con el numeral 3 del artículo 47 del Estatuto del Consumidor, <strong>se exceptúan del derecho de retracto los bienes confeccionados conforme a las especificaciones del consumidor o claramente personalizados</strong>. Por tanto, en el caso de telas cortadas o fraccionadas en metrajes específicos a petición del comprador, o telas sublimadas bajo diseño particular, Telas Real evaluará el caso y podrá determinar la improcedencia del retracto por encajar en la citada excepción legal.
            </p>
            <p className="text-sm">
              Cuando el retracto sea procedente, Telas Real reintegrará el dinero pagado en un plazo no mayor a <strong>quince (15) días calendario</strong> tras recibir la devolución del producto.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <h4 className="font-semibold text-foreground text-sm">2. Término de Garantía Legal</h4>
            <p className="text-sm">
              Para las telas comercializadas por Telas Real se establece un término de garantía legal de <strong>cinco (5) días contados a partir de la entrega</strong> para reportar novedades de calidad, idoneidad o defectos de fabricación. Cuando la reclamación resulte procedente, Telas Real asumirá los costos de transporte de conformidad con la ley. La tela debe conservarse sin lavar, cortar ni transformar.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50">
            <h4 className="font-semibold text-foreground text-sm">3. Reversión del Pago (Art. 51 Ley 1480 de 2011)</h4>
            <p className="text-sm">
              En compras electrónicas, el consumidor puede solicitar la reversión ante Telas Real y la entidad financiera emisora del medio de pago cuando exista fraude, operación no solicitada, producto no recibido, o producto defectuoso/diferente, dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la ocurrencia del hecho.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "propiedad-intelectual",
      title: "Propiedad intelectual y marcas",
      content: (
        <div className="space-y-3">
          <p>
            Todos los textos, logotipos, diseños gráficos, marcas comerciales, fotografías de catálogo, código fuente y contenidos publicados en este portal son propiedad exclusiva de <strong>Telas Real S.A.S.</strong> o se usan bajo licencia legítima. Está estrictamente prohibida su copia, reproducción, comercialización o distribución sin previa autorización expresa y escrita.
          </p>
          <p>
            El cliente que suministre archivos de imagen o artes para sublimación personalizada manifiesta y garantiza que es el titular de los derechos de autor o cuenta con la debida licencia de uso, asumiendo cualquier responsabilidad legal frente a reclamos de terceros.
          </p>
        </div>
      ),
    },
    {
      id: "enlaces-y-servicios-de-terceros",
      title: "Enlaces y servicios de terceros",
      content: (
        <div className="space-y-3">
          <p>
            El sitio web puede integrar enlaces, APIs o servicios prestados por terceros independientes, como pasarelas de pago (Wompi) o empresas transportadoras (Coordinadora). Dichas entidades operan bajo sus propios términos de servicio y políticas de tratamiento, sobre las cuales Telas Real no ejerce control directo, sin perjuicio de las garantías legales que no puedan excluirse por mandato de ley.
          </p>
        </div>
      ),
    },
    {
      id: "responsabilidad",
      title: "Límite de responsabilidad",
      content: (
        <div className="space-y-3">
          <p>
            Telas Real desplegará sus mejores esfuerzos técnicos para garantizar la continuidad, disponibilidad y seguridad del sitio web. No obstante, no se hace responsable por interrupciones temporales causadas por fallas en las redes de telecomunicaciones, servidores ajenos, ciberataques o labores de mantenimiento programado.
          </p>
          <p>
            Ninguna cláusula de estos términos pretende limitar ni excluir los derechos irrenunciables que asisten a los consumidores conforme al Estatuto del Consumidor en Colombia.
          </p>
        </div>
      ),
    },
    {
      id: "datos-personales",
      title: "Protección de datos personales",
      content: (
        <div className="space-y-3">
          <p>
            El tratamiento de los datos personales suministrados a través de la plataforma se rige íntegramente por lo dispuesto en nuestra <Link href="/politica-de-privacidad" className="text-primary underline">Política de Privacidad y Manejo de Datos Personales</Link>, en cabal cumplimiento de la Ley 1581 de 2012 y el Decreto 1074 de 2015.
          </p>
        </div>
      ),
    },
    {
      id: "pqrs-y-atencion-al-cliente",
      title: "Centro de Ayuda, PQRS y atención al cliente",
      content: (
        <div className="space-y-3">
          <p>
            Cualquier petición, queja, reclamo, sugerencia o felicitación puede radicarse formalmente en nuestro canal oficial del{" "}
            <Link href="/pqr" className="text-primary font-semibold underline">
              Centro de Ayuda y PQRS
            </Link>
            , lo que permite asignar un número de radicado para su seguimiento y trazabilidad legal.
          </p>
          <p>
            También puedes comunicarte con nuestro equipo vía WhatsApp al <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">+57 315 902 1516</a> o al correo electrónico <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a>.
          </p>
        </div>
      ),
    },
    {
      id: "modificaciones",
      title: "Modificaciones a los términos",
      content: (
        <div className="space-y-3">
          <p>
            Telas Real se reserva la potestad de modificar estos Términos y Condiciones en cualquier momento. Las actualizaciones entrarán a regir desde su publicación en el sitio web y no afectarán transacciones u órdenes perfeccionadas con anterioridad a la modificación.
          </p>
        </div>
      ),
    },
    {
      id: "legislacion-aplicable",
      title: "Legislación aplicable y jurisdicción",
      content: (
        <div className="space-y-3">
          <p>
            Estos Términos y Condiciones se rigen e interpretan en su totalidad por las leyes de la República de Colombia. Cualquier diferencia o controversia jurídica que no pueda resolverse de forma directa será sometida al conocimiento de las autoridades administrativas de protección al consumidor (Superintendencia de Industria y Comercio) o a la jurisdicción ordinaria de los jueces de la República de Colombia.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main>
      <LegalPageLayout
        badge="Marco Legal y Condiciones de Contratación"
        title="Términos y Condiciones Generales"
        description="Conoce las normas, condiciones comerciales, derechos del consumidor, métodos de pago y garantías que regulan la compra y uso de los servicios en www.telasreal.com."
        lastUpdated="Octubre 2026"
        sections={sections}
        relatedLinks={[
          { title: "Política de Privacidad", href: "/politica-de-privacidad" },
          { title: "Política de Envíos", href: "/politica-de-envios" },
          { title: "Centro de Ayuda y PQRS", href: "/pqr" },
          { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes" },
        ]}
      />
    </main>
  );
}
