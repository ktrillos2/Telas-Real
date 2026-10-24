/**
 * Términos y condiciones de eventos: contenido inicial del "I Gran Concurso de Disfraces".
 *
 * Se usa para precargar el documento nuevo en el admin (plantilla "Términos de evento") y como
 * respaldo de la página /terminos-eventos/<slug> mientras el documento no esté publicado en Sanity.
 * Una vez publicado, manda lo que esté en el admin.
 */

export type PortableBlock = {
  _type: "block"
  _key: string
  style: "normal"
  markDefs: never[]
  listItem?: "bullet"
  level?: number
  children: Array<{ _type: "span"; _key: string; text: string; marks: string[] }>
}

export type EventTermsSection = { _key: string; _type: "termsSection"; title: string; content: PortableBlock[] }

export type EventTermsDoc = {
  title: string
  slug: string
  isActive: boolean
  intro?: string
  lastUpdated?: string
  sections: EventTermsSection[]
}

let keyCounter = 0
const key = () => `k${(++keyCounter).toString(36)}`

/** Párrafo; `bold` va al inicio en negrita (ej. "Toma de la fotografía:"). */
function block(text: string, opts: { bold?: string; bullet?: boolean } = {}): PortableBlock {
  const children = [
    ...(opts.bold ? [{ _type: "span" as const, _key: key(), text: `${opts.bold} `, marks: ["strong"] }] : []),
    { _type: "span" as const, _key: key(), text, marks: [] },
  ]
  return {
    _type: "block",
    _key: key(),
    style: "normal",
    markDefs: [],
    ...(opts.bullet ? { listItem: "bullet" as const, level: 1 } : {}),
    children,
  }
}

const p = (text: string) => block(text)
const li = (text: string, bold?: string) => block(text, { bullet: true, bold })
const section = (title: string, content: PortableBlock[]): EventTermsSection => ({ _key: key(), _type: "termsSection", title, content })

export const DEFAULT_EVENT_TERMS_SLUG = "gran-concurso-de-disfraces-telas-real"

export const DEFAULT_EVENT_TERMS: EventTermsDoc = {
  title: "I Gran Concurso de Disfraces Telas Real",
  slug: DEFAULT_EVENT_TERMS_SLUG,
  isActive: true,
  intro: "Términos y condiciones del I Gran Concurso de Disfraces Telas Real.",
  lastUpdated: "Octubre 2026",
  sections: [
    section("Organizador", [p("Telas Real.")]),
    section("Vigencia", [
      p("Inscripciones y participación del 23 al 31 de octubre de 2026. Votación y selección el 3 de noviembre. Premiación el 4 de noviembre de 2026 en cada punto de venta."),
    ]),
    section("Quiénes pueden participar", [
      p("Personas naturales residentes en Colombia, mayores y menores de edad. Quedan excluidos los empleados de Telas Real y familiares."),
      p("Los menores de 18 años deberán contar con la autorización de su padre, madre o acudiente para participar. La inscripción del menor la realiza el adulto responsable, quien acepta estos términos y condiciones en su nombre."),
    ]),
    section("Mecánica", [
      li("El cliente deberá tomarse una foto con su disfraz junto al backing oficial de la campaña en la tienda. Si la tienda no cuenta con backing, podrá tomarse la foto dentro de sus instalaciones.", "Toma de la fotografía:"),
      li("Deberán tomarse una foto con su disfraz utilizando como fondo la imagen oficial de la página web.", "Clientes de la página web:"),
      li("Las fotografías y los videos participantes no podrán tener retoques digitales ni modificaciones realizadas con inteligencia artificial (IA).", "Autenticidad de las imágenes:"),
      li("Para participar, el cliente deberá enviar por mensaje directo a las redes sociales oficiales de Telas Real (Instagram, TikTok o Facebook) una fotografía o un video de su disfraz e indicar el número de recibo o factura de una compra realizada entre el 15 y el 31 de octubre.", "Inscripción:"),
      li("Cada cliente podrá inscribir un (1) disfraz y una (1) factura durante la campaña.", "Límite de participación:"),
      li("Se elegirá un (1) ganador por tienda participante, de acuerdo con los criterios de selección establecidos para la campaña.", "Ganadores por tienda:"),
      li("Para que una tienda pueda tener un ganador propio, deberá contar con un mínimo de cinco (5) participantes inscritos. Si no alcanza esta cantidad, los participantes de dicha tienda seguirán concursando únicamente por el premio de Gran Campeón Nacional.", "Mínimo de participantes por tienda:"),
    ]),
    section("Criterios de evaluación", [
      p("Creatividad, uso de textiles y presentación, evaluados por el jurado designado por Telas Real, conformado por los coordinadores comerciales, mercadeo y visual. La decisión del jurado es final."),
    ]),
    section("Premios", [
      li("Bono de compra por $150.000 COP en otras telas, no incluido Brush, programación u otros artículos complementarios.", "Primer lugar por punto de venta:"),
      li("$1.500.000 COP en otras telas, no incluido Brush, programación u otros artículos complementarios.", "Gran Campeón Nacional, elegido entre los ganadores de tienda:"),
      li("Los bonos son personales, intransferibles, no canjeables por dinero y válidos hasta el 30 de noviembre en puntos de venta físicos y e-commerce. En una sola compra y redimible por el titular de la compra participante y ganadora."),
    ]),
    section("Entrega de premios", [
      p("Los ganadores serán contactados por WhatsApp y deberán presentar documento de identidad. Si no se reclama el premio en un plazo de 1 mes, Telas Real podrá declararlo desierto o asignarlo al siguiente puntaje."),
    ]),
    section("Autorización de uso de imagen y contenido", [
      p("Al participar, el concursante autoriza a Telas Real a reproducir, publicar y difundir las fotos y videos enviados, con fines promocionales, sin remuneración, por tiempo indefinido y en los medios de la marca. Quien participe con menores declara contar con la autorización del padre, madre o acudiente."),
      p("Las fotografías y videos en los que aparezcan niños, niñas o adolescentes solo serán válidos para participar en la actividad cuando se cuente con la autorización previa, expresa e informada de su padre, madre o representante legal para el uso y difusión de su imagen con fines promocionales por parte de Telas Real."),
    ]),
    section("Tratamiento de datos personales", [
      p("Los datos recolectados se tratarán conforme a la Ley 1581 de 2012 y a la política de tratamiento de datos de Telas Real, solo para la gestión del concurso y la comunicación de resultados."),
    ]),
    section("Causales de descalificación", [
      p("Contenido ajeno o plagiado, ofensivo, discriminatorio o que infrinja derechos de terceros; información falsa; incumplimiento de la mecánica. Telas Real puede retirar participaciones que incumplan estas condiciones."),
    ]),
    section("Modificaciones", [
      p("Telas Real puede ajustar fechas, mecánica o premios por causas justificadas, avisando por sus canales oficiales."),
    ]),
    section("Aceptación", [p("Participar implica aceptar estos términos y condiciones.")]),
  ],
}
