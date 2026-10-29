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

// Textos de las respuestas: por defecto los de abajo; la web (Sanity → Whatsapp → Mensajes automáticos)
// los reemplaza con setBotTexts() cada pocos minutos (ver index.mjs)
const DEFAULT_TEXTS = {
  botBienvenida:
    '👋 *¡Hola! Te damos la bienvenida a Telas Real.*\n\nSoy tu asistente virtual 🧵. ¿En qué podemos ayudarte?\n\n' +
    '*1* 📦 Consultar el estado de mi pedido\n*2* 🚚 Envíos y transportadora\n*3* 📍 Ubicación, horarios y contacto\n' +
    '*4* 🌐 Ver catálogo de telas y precios\n*5* 💬 Hablar con un asesor\n\n_Responde con el número de la opción._',
  botMenuPorDefecto:
    '👋 Hola, recibimos tu mensaje en *Telas Real*.\n\nPara atenderte más rápido, escribe el número de la opción que buscas:\n\n' +
    '*1* 📦 Estado de mi pedido\n*2* 🚚 Envíos\n*3* 📍 Horarios y ubicación\n*4* 🌐 Catálogo de telas\n*5* 💬 Hablar con un asesor\n\n' +
    '_O escribe tu consulta y un asesor te responderá._',
  botOpcionPedido:
    '📦 *Consulta de pedido*\n\nIndícanos tu número de pedido (ej. *#10332*) o el documento / correo con el que compraste.\n\n' +
    'Un asesor revisará el estado y te responderá en este chat.',
  botOpcionEnvios:
    '🚚 *Envíos a toda Colombia*\n\n• Enviamos con *Coordinadora*; el valor se calcula en el checkout.\n' +
    '• Tiempo de entrega: 1 a 3 días hábiles según la ciudad.\n• Cuando despachemos tu pedido te enviaremos el número de guía por este medio.\n\n' +
    '_Escribe *menu* para volver al menú._',
  botOpcionUbicacion:
    '📍 *Ubicación y horarios*\n\n• *Sede:* Calle 12 # 38-65, Bogotá D.C.\n• *Horario:* lunes a viernes, 8:30 a. m. a 5:30 p. m.\n' +
    '• *Puntos de venta:* https://www.telasreal.com/puntos-atencion\n• *Tienda virtual 24/7:* https://www.telasreal.com\n\n' +
    '_Escribe *menu* para volver al menú._',
  botOpcionCatalogo:
    '🌐 *Catálogo de Telas Real*\n\nMira todas nuestras telas, colores y precios por metro:\n👉 https://www.telasreal.com/tienda\n\n' +
    '_Escribe *menu* para volver al menú._',
  botOpcionAsesor:
    '💬 *Hablar con un asesor*\n\nUn asesor te responderá en este chat lo antes posible (lunes a viernes, 8:30 a. m. a 5:30 p. m.).\n\n' +
    'Cuéntanos qué telas o cuántos metros buscas para atenderte más rápido.',
  botGraciasCalificacionAlta:
    '{estrellas} *¡Muchas gracias por tu calificación de {nota}/5!*\n\n' +
    'Nos alegra que hayas tenido una gran experiencia con Telas Real. Si necesitas algo más para tus proyectos, aquí estamos. 🧵✨',
  botGraciasCalificacionBaja:
    '{estrellas} *Gracias por tu calificación de {nota}/5.*\n\n' +
    'Lamentamos que tu experiencia no haya sido la mejor. Cuéntanos en este chat qué pasó y un asesor revisará tu caso para ofrecerte una solución.',
  botGraciasComentario: '🙏 Gracias por contarnos. Un asesor revisará tu caso y te contactará por este medio.',
};

let texts = { ...DEFAULT_TEXTS };

/** Reemplaza los textos con los de la web; los vacíos o desconocidos se ignoran. */
export function setBotTexts(remote = {}) {
  const next = { ...DEFAULT_TEXTS };
  for (const key of Object.keys(DEFAULT_TEXTS)) {
    if (typeof remote[key] === 'string' && remote[key].trim()) next[key] = remote[key];
  }
  texts = next;
}

export function botText(key, vars = {}) {
  return String(texts[key] || DEFAULT_TEXTS[key] || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

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
 * Calificación de la encuesta (1 a 5) si el mensaje es la respuesta a una encuesta pendiente; si no, null.
 * El bot ya no responde a los clientes: esto solo sirve para guardar la nota en el pedido.
 */
export function getSurveyRating(incomingText = '', senderJid = '') {
  const text = String(incomingText).trim().toLowerCase();
  const cleanPhone = normalizePhone(senderJid).slice(-10);
  const surveyAt = cleanPhone ? surveyPendingPhones.get(cleanPhone) : undefined;
  const isSurveyPending = Boolean(surveyAt && Date.now() - surveyAt < SURVEY_WINDOW_MS);
  const rating = extractRating(text, isSurveyPending);
  if (rating !== null && cleanPhone) {
    surveyPendingPhones.delete(cleanPhone);
    saveState();
  }
  return rating;
}

/**
 * (Sin uso: el bot no responde mensajes de clientes.) Genera la respuesta automática del menú.
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

    return reply(null, botText('botBienvenida', {}));
  }

  // Un asesor está atendiendo este chat: el bot no interrumpe (salvo calificaciones de encuesta)
  // 2. Detección de respuestas a encuesta de satisfacción (número del 1 al 5, estrellas o palabras)
  const ratingNum = extractRating(text, isSurveyPending);
  if (ratingNum !== null) {
    if (cleanPhone) {
      surveyPendingPhones.delete(cleanPhone);
      saveState();
    }
    if (ratingNum >= 4) {
      return reply(ratingNum, botText('botGraciasCalificacionAlta', { nota: ratingNum, estrellas: '⭐'.repeat(ratingNum) }));
    } else {
      return reply(ratingNum, botText('botGraciasCalificacionBaja', { nota: ratingNum, estrellas: '⭐'.repeat(ratingNum) }));
    }
  }

  if (humanActive) return { reply: null };

  // 3. Opciones del menú principal
  if (text === '1' || text.includes('estado de mi pedido') || text.includes('mi pedido')) {
    return reply(null, botText('botOpcionPedido', {}));
  }

  if (text === '2' || text.includes('envio') || text.includes('envío') || text.includes('coordinadora') || text.includes('guia') || text.includes('guía')) {
    return reply(null, botText('botOpcionEnvios', {}));
  }

  if (text === '3' || text.includes('horario') || text.includes('ubicacion') || text.includes('ubicación') || text.includes('donde estan') || text.includes('dónde están') || text.includes('direccion') || text.includes('dirección')) {
    return reply(null, botText('botOpcionUbicacion', {}));
  }

  if (text === '4' || text.includes('catalogo') || text.includes('catálogo')) {
    return reply(null, botText('botOpcionCatalogo', {}));
  }

  if (text === '5' || text.includes('asesor') || text.includes('humano')) {
    return reply(null, botText('botOpcionAsesor', {}));
  }

  // Respuesta por defecto con el menú: como máximo una vez cada 6 horas por chat, para no
  // repetirlo en cada mensaje de una conversación
  const lastMenu = cleanPhone ? lastMenuReply.get(cleanPhone) : undefined;
  if (lastMenu && Date.now() - lastMenu < MENU_COOLDOWN_MS) return { reply: null };
  if (cleanPhone) {
    lastMenuReply.set(cleanPhone, Date.now());
    menuActivePhones.set(cleanPhone, Date.now());
  }

  return reply(null, botText('botMenuPorDefecto', {}));
}

function reply(rating, text) {
  return rating ? { reply: text, rating } : { reply: text };
}
