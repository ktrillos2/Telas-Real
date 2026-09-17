/**
 * Lógica de auto-respuestas y validación de seguridad de remitentes para Telas Real.
 */

/**
 * Normaliza un número telefónico extrayendo solo dígitos.
 */
export function normalizePhone(rawPhone = '') {
  return String(rawPhone || '').replace(/\D/g, '');
}

const dynamicAllowedPhones = new Set();
const surveyPendingPhones = new Map(); // clean 10-digit phone -> timestamp
const menuActivePhones = new Map();    // clean 10-digit phone -> timestamp

/**
 * Registra un número al que se le ha enviado una notificación para permitirle interactuar con el bot.
 */
export function registerAllowedRecipient(phone) {
  const clean = normalizePhone(phone);
  if (clean && clean.length >= 7) {
    dynamicAllowedPhones.add(clean.slice(-10));
  }
}

/**
 * Registra que se envió una encuesta de satisfacción a este número.
 */
export function registerSurveySent(phone) {
  const clean = normalizePhone(phone);
  if (clean && clean.length >= 7) {
    surveyPendingPhones.set(clean.slice(-10), Date.now());
  }
}

/**
 * Verifica si el remitente está autorizado en modo de pruebas.
 * En modo pruebas, el bot responde al número configurado o a cualquier número al que se le haya enviado un pedido/notificación.
 */
export function isAllowedSender(fromJid = '', allowedPhone = '3133087069', isTestMode = true) {
  if (!isTestMode) return true; // En producción responde a todos

  const cleanJid = normalizePhone(fromJid.replace('@c.us', '').replace('@s.whatsapp.net', ''));
  const cleanAllowed = normalizePhone(allowedPhone);

  if (cleanAllowed && cleanJid.endsWith(cleanAllowed)) return true;

  for (const phone of dynamicAllowedPhones) {
    if (cleanJid.endsWith(phone)) return true;
  }

  return false;
}

/**
 * Extrae la calificación del mensaje recibido (1 a 5).
 * @param {string} text 
 * @param {boolean} isSurveyPending 
 * @param {boolean} isMenuActive 
 * @returns {number|null}
 */
function extractRating(text, isSurveyPending, isMenuActive) {
  // 1. Contador de estrellas emoji (⭐⭐⭐⭐⭐ -> 5)
  const starMatches = text.match(/⭐/g);
  if (starMatches && starMatches.length >= 1 && starMatches.length <= 5) {
    return starMatches.length;
  }

  // 2. Coincidencia con palabras de satisfacción
  if (/\b(excelente|maravilloso|maravillosa|perfecto|perfecta|impecable|magnifico|magnífico)\b/i.test(text)) {
    return 5;
  }
  if (/\b(muy buen[ao]|muy bien|super bien|súper bien)\b/i.test(text)) {
    return 4;
  }
  if (/\b(buen[ao]|bien)\b/i.test(text) && !/\b(buen dia|buenas|buenos dias|buenas tardes|buenas noches)\b/i.test(text)) {
    return 3;
  }
  if (/\b(regular|normal|mas o menos|más o menos|maso)\b/i.test(text)) {
    return 2;
  }
  if (/\b(muy mal[ao]|p[eé]sim[ao]|horrible|terrible)\b/i.test(text)) {
    return 1;
  }
  if (/\b(mal[ao])\b/i.test(text)) {
    return 1;
  }

  // 3. Patrones explícitos con sufijos (ej: "5 estrellas", "5/5", "5 de 5", "5 pts", "5 - excelente")
  const explicitMatch = text.match(/^([1-5])(\s*[-/:]|\s*estrellas|\s*de\s*5|\s*pts|\s*puntos|\s*calificaci[oó]n)/i);
  if (explicitMatch) {
    return Number(explicitMatch[1]);
  }

  // 4. Si tiene encuesta de satisfacción pendiente, cualquier número simple del 1 al 5 es una calificación
  if (isSurveyPending) {
    const singleDigit = text.match(/^([1-5])\b/);
    if (singleDigit) {
      return Number(singleDigit[1]);
    }
  }

  // 5. Si el usuario NO tiene menú activo y envía solo 5, 4 o 3
  if (!isMenuActive) {
    const directRating = text.match(/^([2-5])$/);
    if (directRating) {
      return Number(directRating[1]);
    }
  }

  return null;
}

/**
 * Procesa el mensaje entrante y genera la respuesta automática inteligente.
 * @param {string} incomingText - Texto enviado por el usuario
 * @param {string} senderName - Nombre del contacto si está disponible
 * @param {string} senderJid - JID del remitente (para control de contexto)
 * @returns {string|null} Texto a responder (o null si no se debe responder)
 */
export function getAutoReply(incomingText = '', senderName = 'Cliente', senderJid = '') {
  const text = incomingText.trim().toLowerCase();
  const cleanPhone = normalizePhone(senderJid).slice(-10);

  const isSurveyPending = cleanPhone
    ? surveyPendingPhones.has(cleanPhone) && (Date.now() - surveyPendingPhones.get(cleanPhone) < 1000 * 60 * 60 * 48)
    : false;

  const isMenuActive = cleanPhone
    ? menuActivePhones.has(cleanPhone) && (Date.now() - menuActivePhones.get(cleanPhone) < 1000 * 60 * 30)
    : false;

  // 1. Detección de saludos explícitos o solicitud de menú
  const isGreeting = /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|menu|menú|ayuda|info|inicio)/i.test(text);

  if (isGreeting) {
    if (cleanPhone) {
      menuActivePhones.set(cleanPhone, Date.now());
      surveyPendingPhones.delete(cleanPhone);
    }

    return (
      `👋 *¡Hola! Te damos la bienvenida a Telas Real.*\n\n` +
      `Soy tu asistente virtual 🧵. ¿En qué podemos colaborarte hoy?\n\n` +
      `*1* 📦 Consultar estado de mi pedido\n` +
      `*2* 🚚 Envíos y transportadoras (Coordinadora)\n` +
      `*3* 📍 Ubicación, horarios y contacto\n` +
      `*4* 🌐 Ver catálogo de telas y precios por metro\n` +
      `*5* 💬 Hablar con un asesor comercial humano\n\n` +
      `_Por favor responde con el número de la opción que necesitas._`
    );
  }

  // 2. Detección de respuestas a encuesta de satisfacción (número del 1 al 5, estrellas o palabras)
  const ratingNum = extractRating(text, isSurveyPending, isMenuActive);
  if (ratingNum !== null) {
    if (cleanPhone) {
      surveyPendingPhones.delete(cleanPhone);
    }
    const stars = '⭐'.repeat(ratingNum);
    if (ratingNum >= 4) {
      return (
        `${stars} *¡Muchísimas gracias por tu calificación de ${ratingNum}/5!*\n\n` +
        `Nos alegra enormemente saber que tuviste una gran experiencia con Telas Real. ` +
        `Trabajamos día a día para brindarte los mejores textiles de Colombia y un servicio impecable.\n\n` +
        `Si necesitas algo adicional para tus proyectos de confección, ¡aquí estamos siempre a tu orden! 🧵✨`
      );
    } else {
      return (
        `${stars} *Apreciamos sinceramente tu retroalimentación de ${ratingNum}/5.*\n\n` +
        `Lamentamos si algún aspecto de tu experiencia no cumplió todas tus expectativas. Tu opinión es fundamental para nosotros. ` +
        `Un asesor de control de calidad revisará tu caso para contactarte y ofrecerte una solución. ¡Gracias por ayudarnos a crecer!`
      );
    }
  }

  // 3. Opciones del menú principal
  if (text === '1' || text.includes('estado') || text.includes('mi pedido')) {
    return (
      `📦 *Consulta de Pedido - Telas Real*\n\n` +
      `Para verificar el avance de tu orden, por favor indícanos:\n` +
      `• Tu número de pedido (ej: *#TR-1234*)\n` +
      `• O el documento de identidad / correo con el que realizaste la compra.\n\n` +
      `Un asesor verificará el estado de inmediato.`
    );
  }

  if (text === '2' || text.includes('envio') || text.includes('envío') || text.includes('coordinadora') || text.includes('guia') || text.includes('guía')) {
    return (
      `🚚 *Envíos Nacionales con Coordinadora*\n\n` +
      `• *Despachos:* Realizamos envíos diarios a toda Colombia a través de *Coordinadora Mercantil* con tarifa preferencial calculada en el checkout.\n` +
      `• *Tiempos de entrega:* 1 a 3 días hábiles según la ciudad de destino.\n` +
      `• *Seguimiento:* Una vez despachado tu paquete, recibirás automáticamente por este medio tu número de guía para rastreo en tiempo real.\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    );
  }

  if (text === '3' || text.includes('horario') || text.includes('ubicacion') || text.includes('donde estan') || text.includes('direccion')) {
    return (
      `📍 *Información y Horarios - Telas Real*\n\n` +
      `• *Sede:* Bogotá D.C., Colombia (Sector Textil Alquería / Restrepo).\n` +
      `• *Horarios:* Lunes a Viernes de 8:00 AM a 6:00 PM | Sábados de 8:00 AM a 4:00 PM.\n` +
      `• *Canal Digital:* Tienda virtual activa 24/7 en https://telasreal.com\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    );
  }

  if (text === '4' || text.includes('catalogo') || text.includes('catálogo') || text.includes('precios') || text.includes('telas')) {
    return (
      `🌐 *Catálogo Virtual de Telas Real*\n\n` +
      `Descubre toda nuestra variedad con disponibilidad en tiempo real, colores y precios por metro:\n\n` +
      `👉 *https://telasreal.com/tienda*\n\n` +
      `Contamos con Rib, Lino, Scuba, Rústico, Franela, Popelina y muchas más referencias de confección premium.\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    );
  }

  if (text === '5' || text.includes('asesor') || text.includes('humano')) {
    return (
      `💬 *Conectando con un Asesor Humano*\n\n` +
      `¡Entendido! Hemos notificado a uno de nuestros asesores comerciales. En breve te responderá directamente en este chat para ayudarte de forma personalizada.\n\n` +
      `Por favor déjanos saber en tu siguiente mensaje qué telas o metraje estás buscando para atenderte más rápido. ¡Gracias por tu paciencia!`
    );
  }

  // Respuesta por defecto con el menú amigable
  return (
    `👋 Hola, hemos recibido tu mensaje en *Telas Real*.\n\n` +
    `Para brindarte una atención ágil, por favor escribe el número de la opción que buscas:\n\n` +
    `*1* 📦 Consultar estado de pedido\n` +
    `*2* 🚚 Información de envíos Coordinadora\n` +
    `*3* 📍 Horarios y ubicación\n` +
    `*4* 🌐 Ver catálogo de telas online\n` +
    `*5* 💬 Hablar con un asesor comercial\n\n` +
    `_O escribe detalladamente tu consulta y un asesor te responderá a la brevedad._`
  );
}
