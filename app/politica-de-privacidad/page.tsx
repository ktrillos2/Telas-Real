import { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/politica-de-privacidad" },
  title: { absolute: "Política de Privacidad y Manejo de Datos Personales | Telas Real" },
  description:
    "Conoce cómo Telas Real S.A.S. recopila, utiliza, protege y garantiza los derechos sobre tus datos personales conforme a la Ley 1581 de 2012 y el Decreto 1074 de 2015 en Colombia.",
};

export default function PoliticaPrivacidadPage() {
  const sections: LegalSection[] = [
    {
      id: "responsable-del-tratamiento",
      title: "Responsable del tratamiento",
      content: (
        <div className="space-y-3">
          <p>
            <strong>Telas Real S.A.S.</strong>, sociedad comercial legalmente constituida bajo las leyes de la República de Colombia, identificada con el <strong>NIT 901232650-1</strong> y con domicilio principal en la ciudad de Bogotá D.C., en la <strong>Calle 12 # 38-65</strong>, es la persona jurídica responsable del tratamiento de los datos personales recopilados a través de su sitio web www.telasreal.com, formularios digitales, canales de atención al cliente, procesos comerciales, actividades promocionales, establecimientos físicos de comercio y demás medios autorizados.
          </p>
          <div className="bg-[#E8F4F8]/50 border border-primary/20 rounded-xl p-4 text-xs sm:text-sm space-y-1.5 text-foreground/90">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Correo oficial para protección de datos:</strong> <a href="mailto:sac@telasreal.com" className="text-primary hover:underline">sac@telasreal.com</a></span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Canal general de atención e-commerce:</strong> <a href="mailto:tiendavirtual@telasreal.com" className="text-primary hover:underline">tiendavirtual@telasreal.com</a></span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Línea y WhatsApp de atención:</strong> <a href="https://wa.me/573159021516" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">+57 315 902 1516</a></span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Dirección física:</strong> Calle 12 # 38-65, Bogotá D.C., Colombia</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "alcance-y-marco-normativo",
      title: "Alcance y marco normativo",
      content: (
        <div className="space-y-3">
          <p>
            Esta política se aplica a todas las bases de datos y archivos que contengan datos personales objeto de tratamiento por parte de <strong>Telas Real S.A.S.</strong>, sus empleados, contratistas y terceros encargados.
          </p>
          <p>
            Su contenido se rige e interpreta de conformidad con el artículo 15 de la Constitución Política de Colombia, la <strong>Ley Estatutaria 1581 de 2012</strong> (Régimen General de Protección de Datos Personales), el <strong>Decreto Reglamentario 1074 de 2015</strong> (Capítulo 25), la Circular Externa 002 de 2015 expedida por la Superintendencia de Industria y Comercio (SIC), y las demás normas que las modifiquen, adicionen, sustituyan o reglamenten.
          </p>
        </div>
      ),
    },
    {
      id: "datos-que-podemos-recopilar",
      title: "Datos que podemos recopilar",
      content: (
        <div className="space-y-3">
          <p>
            En el desarrollo de sus actividades comerciales y de servicio, Telas Real podrá recopilar las siguientes categorías de datos personales:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Datos de identificación y contacto:</strong> Nombres y apellidos, tipo y número de documento de identidad, ciudad y municipio de residencia, dirección de entrega física, número de teléfono móvil o fijo y dirección de correo electrónico.</li>
            <li><strong>Información transaccional:</strong> Datos requeridos para la confirmación de compras, liquidación de órdenes, pasarelas de pago, facturación electrónica legal (DIAN), corte, alistamiento, despacho y servicio posventa.</li>
            <li><strong>Datos de navegación y del dispositivo:</strong> Dirección IP, identificadores únicos de dispositivo, tipo de navegador, sistema operativo, cookies, páginas visitadas, tiempo de permanencia y patrones de interacción en nuestro sitio web.</li>
            <li><strong>Información comercial y de relacionamiento:</strong> Historial de compras, preferencias textiles, referencias de interés, cotizaciones corporativas, solicitudes de asesoría técnica y registros de comunicación sostenidos con nuestros canales de WhatsApp o correo electrónico.</li>
            <li><strong>Información de postulaciones laborales:</strong> Datos incluidos en hojas de vida, perfiles profesionales, experiencia previa, formación académica y soportes aportados en convocatorias de empleo.</li>
            <li><strong>Archivos y soportes multimedia:</strong> Fotografías, videos, archivos PDF de diseño suministrados para sublimación y personalización de telas, así como evidencias aportadas en trámites de garantías o PQRS.</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1 italic">
            * Telas Real no solicita ni recopila datos sensibles salvo que sean estrictamente indispensables y exista una base legal o autorización expresa. En caso de tratar datos de niños, niñas y adolescentes, se garantizará siempre el respeto a sus derechos prevalentes y el consentimiento de sus representantes legales cuando aplique.
          </p>
        </div>
      ),
    },
    {
      id: "finalidades-del-tratamiento",
      title: "Finalidades del tratamiento",
      content: (
        <div className="space-y-3">
          <p>
            Los datos personales recopilados por Telas Real serán tratados para las siguientes finalidades legítimas y necesarias:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Crear, administrar, autenticar y dar soporte a las cuentas de usuario registradas en la tienda en línea.</li>
            <li>Procesar, liquidar, facturar, cortar, empacar, despachar y realizar el seguimiento logístico de los pedidos efectuados en el canal e-commerce.</li>
            <li>Prestar asesoría textil personalizada, responder dudas, cotizar proyectos de confección y gestionar solicitudes de garantías, retractos, cambios, devoluciones y PQRS.</li>
            <li>Enviar información sobre nuevos lanzamientos textiles, disponibilidad de referencias, eventos promocionales, contenidos educativos del blog y encuestas de satisfacción, siempre que exista autorización previa o una base legítima.</li>
            <li>Realizar análisis estadísticos de navegación, métricas de conversión, auditoría de seguridad, prevención de fraude electrónico y optimización continua de la experiencia en el sitio web.</li>
            <li>Gestionar relaciones comerciales con proveedores, confeccionistas, aliados logísticos y clientes corporativos B2B.</li>
            <li>Recibir, clasificar y evaluar hojas de vida y postulaciones laborales, conservando la información durante el tiempo que dure el respectivo proceso de selección.</li>
            <li>Cumplir con mandatos y obligaciones legales, contables, tributarias (facturación electrónica ante la DIAN), contractuales y requerimientos formulados por autoridades judiciales o administrativas competentes.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "autorizacion-y-bases-para-el-tratamiento",
      title: "Autorización y bases para el tratamiento",
      content: (
        <div className="space-y-3">
          <p>
            El tratamiento de datos personales por parte de Telas Real requiere la autorización libre, previa, expresa e informada del titular, la cual se obtiene mediante casillas de verificación (checkboxes), formularios web, mensajes de aceptación o conductas inequívocas en el momento de registrarse, postularse o efectuar una compra.
          </p>
          <p>
            Asimismo, de acuerdo con el artículo 10 de la Ley 1581 de 2012, no será necesaria la autorización cuando los datos sean requeridos por una entidad pública en ejercicio de sus funciones, se trate de datos de naturaleza pública, casos de urgencia médica o cuando el tratamiento sea necesario para la ejecución de una relación contractual en la que el titular sea parte.
          </p>
          <p>
            El titular tiene derecho a revocar su autorización o solicitar la supresión de sus datos en cualquier momento, siempre que no medie un deber legal o contractual que imponga conservarlos.
          </p>
        </div>
      ),
    },
    {
      id: "encargados-transmision-y-transferencia",
      title: "Encargados, transmisión y transferencia",
      content: (
        <div className="space-y-3">
          <p>
            Para cumplir con las finalidades informadas, Telas Real podrá compartir datos personales con terceros que actúen en calidad de <strong>Encargados del Tratamiento</strong>, tales como:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Pasarelas de pago aliadas:</strong> Wompi (Bancolombia) y redes financieras para el procesamiento seguro de transacciones.</li>
            <li><strong>Empresas de transporte y mensajería:</strong> Coordinadora Mercantil, Interrapidísimo, Movipack y transportadoras aliadas para la entrega de telas a nivel nacional.</li>
            <li><strong>Proveedores tecnológicos:</strong> Servicios de alojamiento web en la nube, bases de datos (Sanity), plataformas de correo transaccional (Resend), herramientas de analítica y soporte informático.</li>
            <li><strong>Asesores externos:</strong> Servicios contables, jurídicos, de nómina y auditoría externa.</li>
          </ul>
          <p>
            Telas Real suscribe acuerdos de transmisión de datos que obligan a dichos terceros a cumplir estrictos estándares de confidencialidad y seguridad. En caso de requerirse una transferencia o transmisión internacional de datos, se garantizará que el país receptor cuente con niveles adecuados de protección conforme a las directrices de la Superintendencia de Industria y Comercio.
          </p>
        </div>
      ),
    },
    {
      id: "derechos-de-los-titulares",
      title: "Derechos de los titulares",
      content: (
        <div className="space-y-3">
          <p>
            De conformidad con el artículo 8 de la Ley 1581 de 2012, el titular de los datos personales tiene los siguientes derechos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales frente a Telas Real o a los encargados del tratamiento, en caso de datos parciales, inexactos, incompletos, fraccionados o que induzcan a error.</li>
            <li><strong>Solicitar prueba</strong> de la autorización otorgada a Telas Real, salvo cuando la ley la exceptúe expresamente.</li>
            <li><strong>Ser informado</strong> por Telas Real o el encargado, previa solicitud, respecto del uso que se le ha dado a sus datos personales.</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a lo dispuesto en la normativa vigente, previo agotamiento del trámite de consulta o reclamo ante Telas Real.</li>
            <li><strong>Revocar la autorización</strong> y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</li>
            <li><strong>Acceder de forma gratuita</strong> a sus datos personales que hayan sido objeto de tratamiento.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "consultas-y-reclamos",
      title: "Consultas y reclamos sobre datos personales",
      content: (
        <div className="space-y-4">
          <p>
            Para ejercer sus derechos de hábeas data, el titular o sus causahabientes deberán enviar una solicitud formal por escrito al correo electrónico: <a href="mailto:sac@telasreal.com" className="text-primary font-medium hover:underline">sac@telasreal.com</a>.
          </p>
          <p className="text-sm">
            La solicitud debe incluir: nombre completo del titular, número de documento de identificación, datos de contacto para recibir respuesta (correo electrónico y teléfono), descripción clara de los hechos o datos objeto de la consulta o reclamo y los documentos que soporten la solicitud.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#E8F4F8]/60 border border-primary/20 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-primary text-base">Trámite de Consultas</h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                Las consultas serán atendidas en un término máximo de <strong>diez (10) días hábiles</strong> contados a partir de la fecha de recibo. Si no fuere posible atenderla dentro de dicho término, se informará al interesado antes de su vencimiento, indicando los motivos de la demora y la fecha en que será resuelta, la cual no podrá superar los <strong>cinco (5) días hábiles</strong> siguientes al vencimiento del primer plazo.
              </p>
            </div>

            <div className="bg-[#E8F4F8]/60 border border-primary/20 rounded-xl p-5 space-y-2">
              <h3 className="font-semibold text-primary text-base">Trámite de Reclamos</h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                Los reclamos serán atendidos en un término máximo de <strong>quince (15) días hábiles</strong> contados a partir del día siguiente a su recepción. Si no fuere posible responder dentro de dicho plazo, se informará al interesado antes de su vencimiento, indicando los motivos y la fecha de resolución, la cual no podrá superar los <strong>ocho (8) días hábiles</strong> siguientes.
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed pt-2">
            Si el reclamo resulta incompleto, se requerirá al interesado dentro de los cinco (5) días siguientes a su recepción para que subsane las faltas. Transcurridos dos (2) meses desde la fecha del requerimiento sin que el solicitante presente la información requerida, se entenderá que ha desistido del reclamo. Una vez recibido el reclamo completo, se incluirá en la base de datos la leyenda &ldquo;reclamo en trámite&rdquo; en un término no mayor a dos (2) días hábiles.
          </p>
        </div>
      ),
    },
    {
      id: "cookies-y-tecnologias-similares",
      title: "Cookies y tecnologías similares",
      content: (
        <div className="space-y-3">
          <p>
            Nuestro sitio web utiliza cookies, balizas web y tecnologías similares para garantizar el correcto funcionamiento técnico de la tienda (sesión, carrito de compras, persistencia de preferencias), mejorar la seguridad, recopilar datos estadísticos de navegación y personalizar contenidos.
          </p>
          <p>
            El usuario tiene la potestad de configurar su navegador en cualquier momento para bloquear, restringir o eliminar las cookies instaladas. No obstante, ten presente que deshabilitar cookies técnicas esenciales puede limitar o impedir el uso adecuado de ciertas funcionalidades del carrito de compras y del proceso de pago.
          </p>
        </div>
      ),
    },
    {
      id: "seguridad-conservacion-y-eliminacion",
      title: "Seguridad, conservación y eliminación",
      content: (
        <div className="space-y-3">
          <p>
            Telas Real adopta medidas técnicas, físicas, humanas y organizacionales razonables orientadas a resguardar la seguridad de la información personal contra accesos no autorizados, pérdida, adulteración, uso indebido, interceptación o divulgación no permitida. Las transacciones financieras están encriptadas bajo protocolos HTTPS/SSL y gestionadas por pasarelas certificadas con estándares PCI-DSS.
          </p>
          <p>
            Los datos personales serán conservados durante el tiempo estrictamente necesario para cumplir las finalidades descritas, mientras subsista la relación comercial o contractual y durante los plazos legalmente exigidos por las normas contables, tributarias y comerciales colombianas. Una vez cumplidas las finalidades, la información será eliminada, suprimida o anonimizada de forma segura.
          </p>
        </div>
      ),
    },
    {
      id: "actualizaciones-de-la-politica",
      title: "Actualizaciones de la política",
      content: (
        <div className="space-y-3">
          <p>
            Telas Real podrá modificar o actualizar en cualquier momento esta Política de Privacidad para adecuarla a reformas legislativas, jurisprudenciales, requerimientos regulatorios de la Superintendencia de Industria y Comercio o nuevas prácticas comerciales internas.
          </p>
          <p>
            Cualquier cambio sustancial será informado a los titulares a través del sitio web oficial o mediante comunicación enviada a los canales de contacto registrados. La versión publicada en este portal web será siempre la versión vigente y aplicable.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main>
      <LegalPageLayout
        badge="Protección de Datos Personales"
        title="Política de Privacidad y Tratamiento de Datos"
        description="En Telas Real S.A.S. protegemos y respetamos tu privacidad. Conoce las directrices que rigen el tratamiento y salvaguarda de tu información personal de acuerdo con el marco legal colombiano."
        lastUpdated="Octubre 2026"
        sections={sections}
        relatedLinks={[
          { title: "Términos y Condiciones", href: "/terminos-y-condiciones" },
          { title: "Política de Envíos", href: "/politica-de-envios" },
          { title: "Centro de Ayuda y PQRS", href: "/pqr" },
          { title: "Preguntas Frecuentes", href: "/preguntas-frecuentes" },
        ]}
      />
    </main>
  );
}
