import { cachedClient } from "@/sanity/lib/client"

/**
 * Textos de los mensajes automáticos de WhatsApp, editables en Sanity
 * ("Whatsapp → Mensajes automáticos", documento `whatsappMessages`).
 *
 * Cada texto admite variables entre llaves, por ejemplo {nombre} o {pedido}. Si un campo se deja
 * vacío en Sanity se usa el texto por defecto de este archivo. Las líneas que quedan vacías porque
 * su variable no tiene valor (ej. {guia} sin número de guía) se eliminan.
 */

export type WhatsAppMessageKey =
  | "confirmacionEnvio"
  | "confirmacionRecoger"
  | "despacho"
  | "listoParaRecoger"
  | "encuesta"
  | "botBienvenida"
  | "botMenuPorDefecto"
  | "botOpcionPedido"
  | "botOpcionEnvios"
  | "botOpcionUbicacion"
  | "botOpcionCatalogo"
  | "botOpcionAsesor"
  | "botGraciasCalificacionAlta"
  | "botGraciasCalificacionBaja"
  | "botGraciasComentario"

export const DEFAULT_WHATSAPP_MESSAGES: Record<WhatsAppMessageKey, string> = {
  confirmacionEnvio:
    "🎉 *¡Tu compra en Telas Real ha sido confirmada!*\n\n" +
    "Hola *{nombre}*, recibimos tu pedido con éxito.\n\n" +
    "📄 *Pedido:* #{pedido}\n" +
    "💰 {total}\n\n" +
    "📦 *Detalle:*\n{productos}\n\n" +
    "📍 *Dirección de entrega:* {direccion}\n" +
    "🚚 *Envío:* {transportadora}\n\n" +
    "Estamos preparando tus cortes con el mayor cuidado. Puedes ver tu pedido aquí:\n{enlacePedido}\n\n" +
    "{enlacesResena}\n\n" +
    "_¡Gracias por confiar en Telas Real!_",
  confirmacionRecoger:
    "🎉 *¡Tu compra en Telas Real ha sido confirmada!*\n\n" +
    "Hola *{nombre}*, recibimos tu pedido con éxito.\n\n" +
    "📄 *Pedido:* #{pedido}\n" +
    "💰 {total}\n\n" +
    "📦 *Detalle:*\n{productos}\n\n" +
    "🏬 *Recoges en:* Calle 12 # 38-65, Bogotá (lunes a viernes, 8:30 a. m. a 5:30 p. m.)\n" +
    "⏱️ Tu pedido estará listo en un plazo de 2 horas después del pago. Si compras después de las 4:00 p. m., podrás recogerlo al día siguiente. Te avisaremos por este medio.\n\n" +
    "Puedes ver tu pedido aquí:\n{enlacePedido}\n\n" +
    "{enlacesResena}\n\n" +
    "_¡Gracias por confiar en Telas Real!_",
  despacho:
    "🚚 *¡Tu pedido de Telas Real va en camino!*\n\n" +
    "Hola *{nombre}*, tu pedido *#{pedido}* ya fue despachado.\n\n" +
    "🏢 *Transportadora:* {transportadora}\n" +
    "🔖 *Número de guía:* {guia}\n" +
    "⏱️ *Tiempo estimado:* 1 a 3 días hábiles\n\n" +
    "🔍 Sigue tu paquete aquí: {enlaceRastreo}\n\n" +
    "Si tienes alguna duda con la entrega, escríbenos por este medio.",
  listoParaRecoger:
    "🛍️ *¡Tu pedido de Telas Real está listo para recoger!*\n\n" +
    "Hola *{nombre}*, tu pedido *#{pedido}* ya está listo.\n\n" +
    "📍 *Dirección:* Calle 12 # 38-65, Bogotá\n" +
    "🕗 *Horario:* lunes a viernes, 8:30 a. m. a 5:30 p. m.\n\n" +
    "Presenta tu número de pedido y tu documento de identidad al recogerlo. Si tienes alguna duda, escríbenos por este medio.",
  encuesta:
    "⭐ *¿Cómo fue tu experiencia con Telas Real?*\n\n" +
    "Hola *{nombre}*, tu pedido *#{pedido}* fue entregado. ¡Esperamos que disfrutes tus telas!\n\n" +
    "¿Cómo calificarías nuestro servicio y la calidad de las telas? Responde con un número del *1 al 5*:\n\n" +
    "*5* ⭐⭐⭐⭐⭐ Excelente\n" +
    "*4* ⭐⭐⭐⭐ Muy buena\n" +
    "*3* ⭐⭐⭐ Buena\n" +
    "*2* ⭐⭐ Regular\n" +
    "*1* ⭐ Mala\n\n" +
    "{enlacesResena}\n\n" +
    "¡Gracias por tu confianza! 🧵🇨🇴",
  botBienvenida:
    "👋 *¡Hola! Te damos la bienvenida a Telas Real.*\n\n" +
    "Soy tu asistente virtual 🧵. ¿En qué podemos ayudarte?\n\n" +
    "*1* 📦 Consultar el estado de mi pedido\n" +
    "*2* 🚚 Envíos y transportadora\n" +
    "*3* 📍 Ubicación, horarios y contacto\n" +
    "*4* 🌐 Ver catálogo de telas y precios\n" +
    "*5* 💬 Hablar con un asesor\n\n" +
    "_Responde con el número de la opción._",
  botMenuPorDefecto:
    "👋 Hola, recibimos tu mensaje en *Telas Real*.\n\n" +
    "Para atenderte más rápido, escribe el número de la opción que buscas:\n\n" +
    "*1* 📦 Estado de mi pedido\n" +
    "*2* 🚚 Envíos\n" +
    "*3* 📍 Horarios y ubicación\n" +
    "*4* 🌐 Catálogo de telas\n" +
    "*5* 💬 Hablar con un asesor\n\n" +
    "_O escribe tu consulta y un asesor te responderá._",
  botOpcionPedido:
    "📦 *Consulta de pedido*\n\n" +
    "Indícanos tu número de pedido (ej. *#10332*) o el documento / correo con el que compraste.\n\n" +
    "Un asesor revisará el estado y te responderá en este chat.",
  botOpcionEnvios:
    "🚚 *Envíos a toda Colombia*\n\n" +
    "• Enviamos con *Coordinadora*; el valor se calcula en el checkout.\n" +
    "• Tiempo de entrega: 1 a 3 días hábiles según la ciudad.\n" +
    "• Cuando despachemos tu pedido te enviaremos el número de guía por este medio.\n\n" +
    "_Escribe *menu* para volver al menú._",
  botOpcionUbicacion:
    "📍 *Ubicación y horarios*\n\n" +
    "• *Sede:* Calle 12 # 38-65, Bogotá D.C.\n" +
    "• *Horario:* lunes a viernes, 8:30 a. m. a 5:30 p. m.\n" +
    "• *Puntos de venta:* https://www.telasreal.com/puntos-atencion\n" +
    "• *Tienda virtual 24/7:* https://www.telasreal.com\n\n" +
    "_Escribe *menu* para volver al menú._",
  botOpcionCatalogo:
    "🌐 *Catálogo de Telas Real*\n\n" +
    "Mira todas nuestras telas, colores y precios por metro:\n👉 https://www.telasreal.com/tienda\n\n" +
    "_Escribe *menu* para volver al menú._",
  botOpcionAsesor:
    "💬 *Hablar con un asesor*\n\n" +
    "Un asesor te responderá en este chat lo antes posible (lunes a viernes, 8:30 a. m. a 5:30 p. m.).\n\n" +
    "Cuéntanos qué telas o cuántos metros buscas para atenderte más rápido.",
  botGraciasCalificacionAlta:
    "{estrellas} *¡Muchas gracias por tu calificación de {nota}/5!*\n\n" +
    "Nos alegra que hayas tenido una gran experiencia con Telas Real. Si necesitas algo más para tus proyectos, aquí estamos. 🧵✨",
  botGraciasCalificacionBaja:
    "{estrellas} *Gracias por tu calificación de {nota}/5.*\n\n" +
    "Lamentamos que tu experiencia no haya sido la mejor. Cuéntanos en este chat qué pasó y un asesor revisará tu caso para ofrecerte una solución.",
  botGraciasComentario: "🙏 Gracias por contarnos. Un asesor revisará tu caso y te contactará por este medio.",
}

/** Reemplaza {variable}; las líneas que quedan vacías por una variable sin valor se eliminan. */
export function renderWhatsAppMessage(template: string, vars: Record<string, string | number | undefined | null>): string {
  const lines = String(template || "").split("\n")
  const out: string[] = []
  for (const line of lines) {
    let hadEmptyVar = false
    const rendered = line.replace(/\{(\w+)\}/g, (match, key: string) => {
      if (!(key in vars)) return match
      const value = vars[key]
      if (value === undefined || value === null || String(value).trim() === "") {
        hadEmptyVar = true
        return ""
      }
      return String(value)
    })
    // Línea que solo tenía una variable vacía (ej. "🔖 *Número de guía:* {guia}" sin guía): se quita
    if (hadEmptyVar) {
      const plain = rendered.replace(/[*_~]/g, "").replace(/[^\p{L}\p{N}:]/gu, " ").trim()
      if (!plain || plain.endsWith(":")) continue
    }
    out.push(rendered)
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** Textos vigentes: los de Sanity y, donde estén vacíos, los por defecto. */
export async function getWhatsAppMessages(): Promise<Record<WhatsAppMessageKey, string>> {
  try {
    const doc = await cachedClient.fetch<Partial<Record<WhatsAppMessageKey, string>> | null>(
      `*[_id == "whatsappMessages"][0]`,
      {},
      { next: { revalidate: 60 } }
    )
    const merged = { ...DEFAULT_WHATSAPP_MESSAGES }
    for (const key of Object.keys(DEFAULT_WHATSAPP_MESSAGES) as WhatsAppMessageKey[]) {
      const value = doc?.[key]
      if (typeof value === "string" && value.trim()) merged[key] = value
    }
    return merged
  } catch (err) {
    console.warn("[WhatsApp] No se pudieron leer los mensajes de Sanity; se usan los por defecto:", err)
    return { ...DEFAULT_WHATSAPP_MESSAGES }
  }
}
