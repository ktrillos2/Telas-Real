/**
 * Cliente de WhatsApp basado en Baileys (conexión directa por WebSocket, sin navegador).
 *
 * Reemplaza a whatsapp-web.js, que dependía de Chromium + Puppeteer y de una versión de
 * WhatsApp Web fijada a mano. En Railway eso producía mensajes "enviados" que nunca salían:
 * el envío se daba por bueno tras 3,5 s sin confirmación del servidor.
 *
 * Aquí un envío solo se reporta como exitoso cuando WhatsApp confirma la recepción (SERVER_ACK).
 */
import fs from 'fs';
import pino from 'pino';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WAMessageStatus,
} from '@whiskeysockets/baileys';

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'warn' });

// Estados expuestos al panel de administración (mismo contrato que el bot anterior)
// 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED'
const state = {
  status: 'INITIALIZING',
  lastRawQr: null,
  lastQrDataUrl: null,
  lastQrAt: null,
  connectedInfo: null,
  lastDisconnectReason: null,
};

let sock = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isStopping = false;
let messageHandler = null;
let ownMessageHandler = null;

// Mensajes enviados recientemente: Baileys los necesita (getMessage) para reenviarlos cuando
// el teléfono del destinatario pide un reintento de cifrado. Sin esto, algunos mensajes
// quedan "esperando este mensaje" en el celular del cliente.
const recentMessages = new Map();
const MAX_RECENT_MESSAGES = 500;

// Estado de entrega por id de mensaje (PENDING → SERVER_ACK → DELIVERY_ACK → READ)
const messageStatus = new Map();
const messageErrors = new Map();
const statusWaiters = new Map();

// Códigos de rechazo del servidor más comunes
const ACK_ERROR_TEXT = {
  '463': 'WhatsApp restringió temporalmente a esta cuenta para iniciar chats nuevos (error 463). Suele pasar con números nuevos o que envían muchos mensajes a contactos que no les han escrito antes.',
  '479': 'WhatsApp rechazó el mensaje por una sesión de dispositivo desactualizada (error 479). Vuelve a vincular el bot.',
};

const STATUS_NAMES = {
  [WAMessageStatus.ERROR]: 'ERROR',
  [WAMessageStatus.PENDING]: 'PENDING',
  [WAMessageStatus.SERVER_ACK]: 'SERVER_ACK',
  [WAMessageStatus.DELIVERY_ACK]: 'DELIVERY_ACK',
  [WAMessageStatus.READ]: 'READ',
  [WAMessageStatus.PLAYED]: 'PLAYED',
};

function rememberMessage(msg) {
  if (!msg?.key?.id || !msg.message) return;
  recentMessages.set(msg.key.id, msg.message);
  if (recentMessages.size > MAX_RECENT_MESSAGES) {
    recentMessages.delete(recentMessages.keys().next().value);
  }
}

function setMessageStatus(id, status) {
  if (!id || status === undefined || status === null) return;
  const previous = messageStatus.get(id) ?? -1;
  if (status <= previous && status !== WAMessageStatus.ERROR) return;
  messageStatus.set(id, status);
  if (messageStatus.size > MAX_RECENT_MESSAGES) {
    messageStatus.delete(messageStatus.keys().next().value);
  }
  const waiters = statusWaiters.get(id);
  if (waiters) {
    for (const waiter of waiters) waiter(status);
  }
}

/** Espera hasta que el mensaje alcance al menos `minStatus` o se agote el tiempo. */
function waitForStatus(id, minStatus, timeoutMs) {
  return new Promise((resolve) => {
    const current = messageStatus.get(id);
    if (current !== undefined && (current >= minStatus || current === WAMessageStatus.ERROR)) {
      resolve(current);
      return;
    }
    const waiter = (status) => {
      if (status >= minStatus || status === WAMessageStatus.ERROR) {
        cleanup();
        resolve(status);
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve(messageStatus.get(id) ?? null);
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      const list = statusWaiters.get(id) || [];
      const next = list.filter((w) => w !== waiter);
      if (next.length > 0) statusWaiters.set(id, next);
      else statusWaiters.delete(id);
    }
    statusWaiters.set(id, [...(statusWaiters.get(id) || []), waiter]);
  });
}

function getAuthPath() {
  return process.env.WHATSAPP_AUTH_PATH || './.baileys_auth';
}

function scheduleReconnect(delayMs) {
  if (isStopping) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connect().catch((err) => {
      console.error('[WhatsApp] Error reconectando:', err?.message || err);
      scheduleReconnect(Math.min(60000, 5000 * (reconnectAttempts + 1)));
    });
  }, delayMs);
}

async function connect() {
  const authPath = getAuthPath();
  const { state: authState, saveCreds } = await useMultiFileAuthState(authPath);

  // Versión vigente del protocolo de WhatsApp Web (en vez de una versión fijada a mano)
  let version;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
    console.log(`[WhatsApp] Versión de WhatsApp Web: ${version.join('.')}${latest.isLatest ? '' : ' (por defecto)'}`);
  } catch (err) {
    console.warn('[WhatsApp] No se pudo consultar la versión más reciente; se usa la de la librería.', err?.message);
  }

  state.status = 'INITIALIZING';

  sock = makeWASocket({
    ...(version ? { version } : {}),
    auth: authState,
    logger,
    browser: Browsers.ubuntu('Chrome'),
    // No marcar "en línea": así el celular principal sigue recibiendo notificaciones
    markOnlineOnConnect: false,
    // No descargar el historial completo. Se mantiene la sincronización inicial por defecto
    // porque Baileys la necesita para resolver los identificadores LID de los contactos.
    syncFullHistory: false,
    getMessage: async (key) => recentMessages.get(key.id) || undefined,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.status = 'QR_READY';
      state.lastRawQr = qr;
      state.lastQrAt = Date.now();
      try {
        state.lastQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
      } catch (err) {
        console.error('[WhatsApp] Error al convertir QR a DataURL:', err.message);
      }
      console.log('\n📲 Escanea este código QR en WhatsApp > Dispositivos vinculados (también disponible en GET / del servicio):');
      qrcodeTerminal.generate(qr, { small: true });
    }

    if (connection === 'connecting' && state.status !== 'QR_READY') {
      state.status = sock?.authState?.creds?.registered ? 'AUTHENTICATED' : 'INITIALIZING';
    }

    if (connection === 'open') {
      reconnectAttempts = 0;
      state.status = 'CONNECTED';
      state.lastRawQr = null;
      state.lastQrDataUrl = null;
      state.lastQrAt = null;
      state.lastDisconnectReason = null;
      const user = sock.user?.id?.split(':')[0]?.split('@')[0] || 'Desconocido';
      state.connectedInfo = { user, name: sock.user?.name || 'Telas Real' };
      console.log(`✅ [WhatsApp] Conectado como +${user} (${state.connectedInfo.name})`);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      state.connectedInfo = null;
      state.lastDisconnectReason = statusCode || lastDisconnect?.error?.message || 'unknown';
      // El QR anterior ya no sirve al cerrarse la conexión: no seguir mostrándolo
      const hadQr = Boolean(state.lastRawQr);
      state.lastRawQr = null;
      state.lastQrDataUrl = null;
      state.lastQrAt = null;
      if (isStopping) return;

      if (statusCode === DisconnectReason.timedOut && hadQr && !sock?.authState?.creds?.registered) {
        // Nadie escaneó a tiempo (WhatsApp agota los QR en ~1 min): pedir uno nuevo de inmediato
        console.log('[WhatsApp] El código QR venció sin escanearse. Generando uno nuevo...');
        state.status = 'INITIALIZING';
        reconnectAttempts = 0;
        scheduleReconnect(1000);
        return;
      }

      if (statusCode === DisconnectReason.loggedOut) {
        // La sesión se cerró desde el celular: borrar credenciales y pedir un QR nuevo
        console.warn('[WhatsApp] Sesión cerrada desde el teléfono. Se generará un QR nuevo.');
        state.status = 'DISCONNECTED';
        fs.rmSync(authPath, { recursive: true, force: true });
        scheduleReconnect(1000);
        return;
      }

      if (statusCode === DisconnectReason.restartRequired) {
        // Normal justo después de escanear el QR
        console.log('[WhatsApp] Reinicio requerido tras vincular. Reconectando...');
        state.status = 'AUTHENTICATED';
        scheduleReconnect(0);
        return;
      }

      if (statusCode === DisconnectReason.connectionReplaced) {
        // Otro proceso abrió la misma sesión (p. ej. el bot corriendo también en local)
        console.error('[WhatsApp] ⚠️ La sesión se abrió en otro lugar (connectionReplaced). ¿Hay otra instancia del bot corriendo con la misma cuenta?');
      }

      reconnectAttempts++;
      const delay = Math.min(60000, 2000 * reconnectAttempts);
      state.status = 'DISCONNECTED';
      console.warn(`[WhatsApp] Conexión cerrada (${state.lastDisconnectReason}). Reintentando en ${delay / 1000}s...`);
      scheduleReconnect(delay);
    }
  });

  // Confirmación del servidor (✓): llega como "ack" del WebSocket. Si trae error, Baileys
  // además emite messages.update con status ERROR (p. ej. 463 = cuenta restringida).
  sock.ws.on('CB:ack,class:message', (node) => {
    const { id, error } = node?.attrs || {};
    if (!id) return;
    if (error) {
      messageErrors.set(id, String(error));
      setMessageStatus(id, WAMessageStatus.ERROR);
    } else {
      setMessageStatus(id, WAMessageStatus.SERVER_ACK);
    }
  });

  // Confirmaciones de entrega (✓✓ entregado, azul leído) y errores
  sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
      if (!key?.fromMe || update?.status === undefined || update?.status === null) continue;
      if (update.status === WAMessageStatus.ERROR && update.messageStubParameters?.[0]) {
        messageErrors.set(key.id, String(update.messageStubParameters[0]));
      }
      setMessageStatus(key.id, update.status);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      if (msg.key?.fromMe) {
        // Los mensajes que envía el bot (Baileys) tienen id "3EB0…"; los demás los escribió
        // una persona desde el celular o WhatsApp Web: el bot no debe interrumpir ese chat
        const id = msg.key.id || '';
        if (type === 'notify' && !id.startsWith('3EB0') && ownMessageHandler) {
          try { ownMessageHandler(msg); } catch {}
        }
        rememberMessage(msg);
        if (msg.status !== undefined && msg.status !== null) setMessageStatus(msg.key.id, msg.status);
        continue;
      }
      if (type !== 'notify' || !messageHandler) continue;
      try {
        await messageHandler(msg);
      } catch (err) {
        console.error('[WhatsApp] Error procesando mensaje entrante:', err?.message || err);
      }
    }
  });
}

/** Inicia la conexión. `onMessage(msg)` recibe los mensajes entrantes de chats individuales. */
export async function startWhatsApp({ onMessage, onOwnMessage } = {}) {
  messageHandler = onMessage || null;
  ownMessageHandler = onOwnMessage || null;
  isStopping = false;
  await connect();
}

export function getState() {
  return { ...state };
}

export function isConnected() {
  return state.status === 'CONNECTED' && Boolean(sock?.user);
}

/** Texto plano del mensaje entrante (conversación, texto extendido o pie de foto). */
export function getMessageText(msg) {
  const m = msg?.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    ''
  );
}

/**
 * JID del remitente para responder y su número de teléfono (cuando WhatsApp lo comparte).
 * Con las cuentas "LID", remoteJid llega como xxx@lid y el número real viene en remoteJidAlt.
 */
export function getSender(msg) {
  const jid = msg?.key?.remoteJid || '';
  const alt = msg?.key?.remoteJidAlt || msg?.key?.participantAlt || '';
  const phoneJid = jid.endsWith('@s.whatsapp.net') ? jid : alt.endsWith('@s.whatsapp.net') ? alt : '';
  return { jid, phone: phoneJid ? phoneJid.split('@')[0].split(':')[0] : '' };
}

export function isIndividualChat(jid = '') {
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid');
}

/**
 * Envía un texto y espera la confirmación del servidor de WhatsApp.
 * @returns {{ id: string, jid: string, status: string }}
 * @throws Error con code NOT_CONNECTED | NOT_ON_WHATSAPP | ACK_TIMEOUT | ACCOUNT_RESTRICTED | SEND_ERROR
 */
export async function sendText(phoneDigits, text, { ackTimeoutMs = 20000 } = {}) {
  if (!isConnected()) {
    const err = new Error(`El cliente de WhatsApp no está conectado (estado: ${state.status}).`);
    err.code = 'NOT_CONNECTED';
    throw err;
  }

  // Verificar que el número tenga WhatsApp y obtener su JID real
  const [result] = (await sock.onWhatsApp(phoneDigits)) || [];
  if (!result?.exists) {
    const err = new Error(`El número +${phoneDigits} no tiene una cuenta de WhatsApp.`);
    err.code = 'NOT_ON_WHATSAPP';
    throw err;
  }
  const jid = result.jid;

  let sent;
  try {
    sent = await sock.sendMessage(jid, { text });
  } catch (error) {
    const err = new Error(error?.message || 'Error al enviar el mensaje');
    err.code = 'SEND_ERROR';
    throw err;
  }

  rememberMessage(sent);
  const id = sent?.key?.id;
  const status = await waitForStatus(id, WAMessageStatus.SERVER_ACK, ackTimeoutMs);

  if (status === WAMessageStatus.ERROR) {
    const code = messageErrors.get(id);
    const err = new Error(ACK_ERROR_TEXT[code] || `WhatsApp rechazó el mensaje${code ? ` (error ${code})` : ''}.`);
    err.code = code === '463' ? 'ACCOUNT_RESTRICTED' : 'SEND_ERROR';
    err.messageId = id;
    throw err;
  }
  if (status === null || status < WAMessageStatus.SERVER_ACK) {
    const err = new Error(`WhatsApp no confirmó la recepción del mensaje en ${ackTimeoutMs / 1000}s.`);
    err.code = 'ACK_TIMEOUT';
    err.messageId = id;
    throw err;
  }

  return { id, jid, status: STATUS_NAMES[status] || String(status) };
}

/** Responde a un mensaje entrante citándolo. */
export async function replyTo(msg, text) {
  const sent = await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
  rememberMessage(sent);
  return sent;
}

/** Estado de entrega conocido de un mensaje enviado. */
export function getMessageStatus(id) {
  const status = messageStatus.get(id);
  return status === undefined ? null : STATUS_NAMES[status] || String(status);
}

/**
 * Código de vinculación de 8 caracteres como alternativa al QR
 * (WhatsApp > Dispositivos vinculados > Vincular con número de teléfono).
 */
export async function requestPairingCode(phoneDigits) {
  if (!sock) throw new Error('El cliente aún no se ha iniciado.');
  if (sock.authState?.creds?.registered) throw new Error('Ya hay una sesión vinculada.');
  return sock.requestPairingCode(phoneDigits);
}

/** Cierra la sesión, borra las credenciales y genera un QR nuevo. */
export async function resetSession() {
  isStopping = true;
  clearTimeout(reconnectTimer);
  try {
    if (state.status === 'CONNECTED') await sock?.logout().catch(() => {});
  } finally {
    try { sock?.end?.(undefined); } catch {}
    fs.rmSync(getAuthPath(), { recursive: true, force: true });
    state.status = 'INITIALIZING';
    state.connectedInfo = null;
    state.lastRawQr = null;
    state.lastQrDataUrl = null;
    isStopping = false;
    await connect();
  }
}

export async function stopWhatsApp() {
  isStopping = true;
  clearTimeout(reconnectTimer);
  try { sock?.end?.(undefined); } catch {}
}
