/**
 * Lógica de auto-respuestas y validación de seguridad de remitentes para Telas Real.
 */

/**
 * Normaliza un número telefónico extrayendo solo dígitos.
 */
export function normalizePhone(rawPhone = '') {
  return String(rawPhone || '').replace(/\D/g, '');
}

import fs from 'fs';
import path from 'path';

const dynamicAllowedPhones = new Set();
const surveyPendingPhones = new Map(); // clean 10-digit phone -> timestamp
const menuActivePhones = new Map();    // clean 10-digit phone -> timestamp
const lastMenuReply = new Map();       // clean 10-digit phone -> timestamp del último menú automático
const humanActivePhones = new Map();   // clean 10-digit phone -> timestamp del último mensaje de un asesor

const SURVEY_WINDOW_MS = 1000 * 60 * 60 * 24 * 7; // la encuesta se puede responder durante 7 días
const MENU_COOLDOWN_MS = 1000 * 60 * 60 * 6;     // el menú automático se repite como máximo cada 6 h
const HUMAN_PAUSE_MS = 1000 * 60 * 60 * 12;      // si un asesor escribió, el bot no interrumpe por 12 h

// Encuestas pendientes en disco (Volume /data en Railway): sobreviven a reinicios y despliegues
const STATE_FILE = process.env.WHATSAPP_STATE_FILE
  || path.join(path.dirname(path.resolve(process.env.WHATSAPP_AUTH_PATH || './.baileys_auth')), 'bot-state.json');

function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    for (const [phone, ts] of Object.entries(data.surveyPending || {})) {
      if (Date.now() - Number(ts) < SURVEY_WINDOW_MS) surveyPendingPhones.set(phone, Number(ts));
    }
  } catch {
    // Primer arranque: no hay archivo todavía
  }
}

function saveState() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ surveyPending: Object.fromEntries(surveyPendingPhones) }));
  } catch (err) {
    console.warn('[Bot] No se pudo guardar el estado de encuestas:', err?.message || err);
  }
}

loadState();

/** Un asesor respondió desde el celular: el bot deja de enviar menús en ese chat por un tiempo. */
export function registerHumanReply(jidOrPhone) {
  const clean = normalizePhone(String(jidOrPhone || '').split('@')[0]).slice(-10);
  if (clean.length >= 7) humanActivePhones.set(clean, Date.now());
}

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
    saveState();
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
 * @returns {number|null}
 */
function extractRating(text, isSurveyPending) {
  // Calificación explícita en cualquier momento: "5 estrellas", "4/5", "3 de 5"
  const explicitMatch = text.match(/^([1-5])\s*(estrellas?|\/\s*5|de\s*5)\b/i);
  if (explicitMatch) return Number(explicitMatch[1]);

  // El resto solo cuenta como calificación si hay una encuesta pendiente: así un "2" para elegir
  // una opción del menú o un "bien, gracias" no se toman como nota
  if (!isSurveyPending) return null;

  const starMatches = text.match(/⭐/g);
  if (starMatches && starMatches.length >= 1 && starMatches.length <= 5) return starMatches.length;

  const singleDigit = text.match(/^([1-5])(\s|$|[.,!-])/);
  if (singleDigit) return Number(singleDigit[1]);

  if (/\b(excelente|maravillos[ao]|perfect[ao]|impecable|magn[ií]fico)\b/i.test(text)) return 5;
  if (/\b(muy buen[ao]|muy bien|s[uú]per bien)\b/i.test(text)) return 4;
  if (/\b(muy mal[ao]?|p[eé]sim[ao]|horrible|terrible)\b/i.test(text)) return 1;
  if (/\b(regular|m[aá]s o menos|maso)\b/i.test(text)) return 2;
  if (/\b(mal[ao]?)\b/i.test(text)) return 1;
  if (/\b(buen[ao]|bien)\b/i.test(text) && !/\b(buen d[ií]a|buenas|buenos d[ií]as|buenas tardes|buenas noches)\b/i.test(text)) return 3;

  return null;
}

/**
 * Procesa el mensaje entrante y genera la respuesta automática inteligente.
 * @param {string} incomingText - Texto enviado por el usuario
 * @param {string} senderName - Nombre del contacto si está disponible
 * @param {string} senderJid - JID del remitente (para control de contexto)
 * @returns {{ reply: string|null, rating?: number }} Respuesta (null = no responder) y la calificación si la hubo
 */
export function getAutoReply(incomingText = '', senderName = 'Cliente', senderJid = '') {
  const text = incomingText.trim().toLowerCase();
  const cleanPhone = normalizePhone(senderJid).slice(-10);

  const surveyAt = cleanPhone ? surveyPendingPhones.get(cleanPhone) : undefined;
  const menuAt = cleanPhone ? menuActivePhones.get(cleanPhone) : undefined;
  // Si después de la encuesta se le mostró el menú (y sigue vigente), los números son opciones del menú
  const menuAfterSurvey = Boolean(menuAt && surveyAt && menuAt > surveyAt && Date.now() - menuAt < 1000 * 60 * 30);
  const isSurveyPending = Boolean(surveyAt && Date.now() - surveyAt < SURVEY_WINDOW_MS && !menuAfterSurvey);
  const humanActive = cleanPhone
    ? humanActivePhones.has(cleanPhone) && (Date.now() - humanActivePhones.get(cleanPhone) < HUMAN_PAUSE_MS)
    : false;

  // 1. Detección de saludos explícitos o solicitud de menú
  const isGreeting = /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|menu|menú|ayuda|info|inicio)/i.test(text);

  if (isGreeting && !humanActive) {
    if (cleanPhone) {
      menuActivePhones.set(cleanPhone, Date.now());
      lastMenuReply.set(cleanPhone, Date.now());
    }

    return reply(null, (
      `👋 *¡Hola! Te damos la bienvenida a Telas Real.*\n\n` +
      `Soy tu asistente virtual 🧵. ¿En qué podemos colaborarte hoy?\n\n` +
      `*1* 📦 Consultar estado de mi pedido\n` +
      `*2* 🚚 Envíos y transportadoras (Coordinadora)\n` +
      `*3* 📍 Ubicación, horarios y contacto\n` +
      `*4* 🌐 Ver catálogo de telas y precios por metro\n` +
      `*5* 💬 Hablar con un asesor comercial humano\n\n` +
      `_Por favor responde con el número de la opción que necesitas._`
    ));
  }

  // Un asesor está atendiendo este chat: el bot no interrumpe (salvo calificaciones de encuesta)
  // 2. Detección de respuestas a encuesta de satisfacción (número del 1 al 5, estrellas o palabras)
  const ratingNum = extractRating(text, isSurveyPending);
  if (ratingNum !== null) {
    if (cleanPhone) {
      surveyPendingPhones.delete(cleanPhone);
      saveState();
    }
    const stars = '⭐'.repeat(ratingNum);
    if (ratingNum >= 4) {
      return reply(ratingNum, (
        `${stars} *¡Muchísimas gracias por tu calificación de ${ratingNum}/5!*\n\n` +
        `Nos alegra enormemente saber que tuviste una gran experiencia con Telas Real. ` +
        `Trabajamos día a día para brindarte los mejores textiles de Colombia y un servicio impecable.\n\n` +
        `Si necesitas algo adicional para tus proyectos de confección, ¡aquí estamos siempre a tu orden! 🧵✨`
      ));
    } else {
      return reply(ratingNum, (
        `${stars} *Apreciamos sinceramente tu retroalimentación de ${ratingNum}/5.*\n\n` +
        `Lamentamos si algún aspecto de tu experiencia no cumplió todas tus expectativas. Tu opinión es fundamental para nosotros. ` +
        `Cuéntanos en este chat qué pasó y un asesor revisará tu caso para ofrecerte una solución. ¡Gracias por ayudarnos a crecer!`
      ));
    }
  }

  if (humanActive) return { reply: null };

  // 3. Opciones del menú principal
  if (text === '1' || text.includes('estado de mi pedido') || text.includes('mi pedido')) {
    return reply(null, (
      `📦 *Consulta de Pedido - Telas Real*\n\n` +
      `Para verificar el avance de tu orden, por favor indícanos:\n` +
      `• Tu número de pedido (ej: *#10332*)\n` +
      `• O el documento de identidad / correo con el que realizaste la compra.\n\n` +
      `Un asesor verificará el estado y te responderá en este chat.`
    ));
  }

  if (text === '2' || text.includes('envio') || text.includes('envío') || text.includes('coordinadora') || text.includes('guia') || text.includes('guía')) {
    return reply(null, (
      `🚚 *Envíos Nacionales con Coordinadora*\n\n` +
      `• *Despachos:* Enviamos a toda Colombia con *Coordinadora Mercantil*; el valor se calcula en el checkout.\n` +
      `• *Tiempos de entrega:* 1 a 3 días hábiles según la ciudad de destino.\n` +
      `• *Seguimiento:* Cuando despachemos tu paquete te enviaremos por este medio el número de guía.\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    ));
  }

  if (text === '3' || text.includes('horario') || text.includes('ubicacion') || text.includes('ubicación') || text.includes('donde estan') || text.includes('dónde están') || text.includes('direccion') || text.includes('dirección')) {
    return reply(null, (
      `📍 *Información y Horarios - Telas Real*\n\n` +
      `• *Sede:* Calle 12 # 38-65, Bogotá D.C.\n` +
      `• *Horario:* Lunes a viernes, 8:30 a. m. a 5:30 p. m.\n` +
      `• *Puntos de venta:* https://www.telasreal.com/puntos-atencion\n` +
      `• *Tienda virtual 24/7:* https://www.telasreal.com\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    ));
  }

  if (text === '4' || text.includes('catalogo') || text.includes('catálogo')) {
    return reply(null, (
      `🌐 *Catálogo Virtual de Telas Real*\n\n` +
      `Descubre toda nuestra variedad con disponibilidad en tiempo real, colores y precios por metro:\n\n` +
      `👉 *https://www.telasreal.com/tienda*\n\n` +
      `_Escribe *menu* para volver al menú principal._`
    ));
  }

  if (text === '5' || text.includes('asesor') || text.includes('humano')) {
    return reply(null, (
      `💬 *Hablar con un Asesor*\n\n` +
      `¡Entendido! Un asesor comercial te responderá en este chat lo antes posible ` +
      `(lunes a viernes, 8:30 a. m. a 5:30 p. m.).\n\n` +
      `Cuéntanos en tu siguiente mensaje qué telas o metraje estás buscando para atenderte más rápido. ¡Gracias por tu paciencia!`
    ));
  }

  // Respuesta por defecto con el menú: como máximo una vez cada 6 horas por chat, para no
  // repetirlo en cada mensaje de una conversación
  const lastMenu = cleanPhone ? lastMenuReply.get(cleanPhone) : undefined;
  if (lastMenu && Date.now() - lastMenu < MENU_COOLDOWN_MS) return { reply: null };
  if (cleanPhone) {
    lastMenuReply.set(cleanPhone, Date.now());
    menuActivePhones.set(cleanPhone, Date.now());
  }

  return reply(null, (
    `👋 Hola, hemos recibido tu mensaje en *Telas Real*.\n\n` +
    `Para brindarte una atención ágil, por favor escribe el número de la opción que buscas:\n\n` +
    `*1* 📦 Consultar estado de pedido\n` +
    `*2* 🚚 Información de envíos Coordinadora\n` +
    `*3* 📍 Horarios y ubicación\n` +
    `*4* 🌐 Ver catálogo de telas online\n` +
    `*5* 💬 Hablar con un asesor comercial\n\n` +
    `_O escribe detalladamente tu consulta y un asesor te responderá a la brevedad._`
  ));
}

function reply(rating, text) {
  return rating ? { reply: text, rating } : { reply: text };
}
