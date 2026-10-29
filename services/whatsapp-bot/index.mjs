/**
 * Microservicio de WhatsApp de Telas Real.
 *
 * Expone el mismo contrato HTTP que consume Next.js (lib/whatsapp/service.ts):
 *   GET  /             Panel HTML de estado/QR (o JSON con ?json)
 *   GET  /status       Estado, número conectado e historial reciente   [token]
 *   GET  /qr           QR en texto y DataURL                           [token]
 *   POST /send         Envía una plantilla o mensaje a un número        [token]
 *   POST /test         Envía una plantilla de ejemplo al número de prueba [token]
 *   POST /logout | /refresh-qr   Cierra la sesión y genera un QR nuevo  [token]
 *   POST /pairing-code { phone }  Código de vinculación sin QR          [token]
 *
 * La conexión con WhatsApp usa Baileys (WebSocket directo, sin Chromium). Ver whatsapp-client.mjs.
 */
import http from 'http';
import crypto from 'crypto';

import { buildMessage, TEMPLATES } from './templates.mjs';
import { getSurveyRating, normalizePhone, registerAllowedRecipient, registerSurveySent, registerHumanReply } from './bot-replies.mjs';
import {
  startWhatsApp,
  stopWhatsApp,
  getState,
  isConnected,
  sendText,
  getMessageText,
  getSender,
  isIndividualChat,
  requestPairingCode,
  resetSession,
} from './whatsapp-client.mjs';

// Configuración de entorno
const PORT = Number(process.env.WHATSAPP_BOT_PORT || process.env.PORT) || 3005;
const TEST_MODE = process.env.WHATSAPP_TEST_MODE !== 'false';
const TEST_PHONE = normalizePhone(process.env.WHATSAPP_TEST_PHONE || '3133087069');
// Secreto compartido con Next.js. Sin valor por defecto: si falta, las rutas protegidas se rechazan.
const API_SECRET = (process.env.WHATSAPP_API_SECRET || '').trim();

console.log('---------------------------------------------------------');
console.log('🤖 INICIANDO SERVICIO WHATSAPP BOT - TELAS REAL (Baileys)');
console.log(`• Puerto HTTP: ${PORT}`);
console.log(`• Modo de Pruebas: ${TEST_MODE ? 'ACTIVO' : 'DESACTIVADO (Producción)'}`);
console.log(`• Número de prueba: ${TEST_PHONE}`);
console.log(`• Sesión guardada en: ${process.env.WHATSAPP_AUTH_PATH || './.baileys_auth'}`);
if (!API_SECRET) {
  console.error('❌ WHATSAPP_API_SECRET no está definido: todas las rutas protegidas (/status, /qr, /send...) responderán 503. Configúralo en Railway y en Next.js con el mismo valor.');
}
console.log('---------------------------------------------------------');

const messageHistory = [];

function addHistory(direction, phone, template, snippet, status) {
  messageHistory.unshift({
    timestamp: new Date().toISOString(),
    direction, // 'IN' | 'OUT'
    phone,
    template: template || 'TEXT',
    snippet: String(snippet || '').slice(0, 120),
    ...(status ? { status } : {}),
  });
  if (messageHistory.length > 50) messageHistory.pop();
}

function toInternational(phone) {
  let digits = normalizePhone(phone);
  if (!digits.startsWith('57')) digits = `57${digits}`;
  return digits;
}

function isAuthorized(req, url) {
  if (!API_SECRET) return false;
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim() || url.searchParams.get('token') || '';
  const a = Buffer.from(token);
  const b = Buffer.from(API_SECRET);
  // Comparación en tiempo constante para no filtrar el secreto por tiempos de respuesta
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('BODY_TOO_LARGE'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const HTTP_STATUS_BY_CODE = {
  NOT_CONNECTED: 503,
  NOT_ON_WHATSAPP: 422,
  ACCOUNT_RESTRICTED: 429,
  ACK_TIMEOUT: 504,
  SEND_ERROR: 502,
};

// Mensajes entrantes: el bot NO responde nada a lo que escriben los clientes (los atiende el equipo
// desde el celular). Solo envía las automatizaciones por cambio de estado del pedido (POST /send).
// Si el mensaje es la respuesta a la encuesta (1 a 5), la calificación se guarda en silencio en el
// pedido; tras una nota de 3 o menos, el siguiente mensaje se guarda como comentario.
async function handleIncomingMessage(msg) {
  const { jid, phone } = getSender(msg);
  if (!isIndividualChat(jid)) return; // grupos, estados, canales

  const text = getMessageText(msg);
  if (!text) return;

  const senderId = phone || jid;
  addHistory('IN', senderId, 'USER_MESSAGE', text);

  const cleanSender = normalizePhone(senderId).slice(-10);
  const pendingComment = awaitingComment.get(cleanSender);
  if (pendingComment && Date.now() - pendingComment < COMMENT_WINDOW_MS) {
    awaitingComment.delete(cleanSender);
    reportSurvey({ phone: senderId, comment: text });
    return;
  }

  const rating = getSurveyRating(text, senderId);
  if (rating) {
    console.log(`⭐ [Encuesta] Calificación ${rating}/5 de ${senderId} (guardada, sin respuesta automática)`);
    reportSurvey({ phone: senderId, rating, text });
    if (rating <= 3) awaitingComment.set(cleanSender, Date.now());
  }
}

// Calificaciones de la encuesta → la web las guarda en el pedido (y avisa si son bajas)
const WEB_URL = (process.env.WHATSAPP_WEB_URL || 'https://www.telasreal.com').replace(/\/+$/, '');
const COMMENT_WINDOW_MS = 1000 * 60 * 60 * 2;
const awaitingComment = new Map(); // teléfono (10 dígitos) -> momento de la calificación baja

async function reportSurvey(payload) {
  if (!API_SECRET) return;
  try {
    const res = await fetch(`${WEB_URL}/api/whatsapp/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_SECRET}` },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn(`[Encuesta] La web respondió ${res.status} al guardar la calificación`);
  } catch (err) {
    console.warn('[Encuesta] No se pudo enviar la calificación a la web:', err?.message || err);
  }
}

startWhatsApp({
  onMessage: handleIncomingMessage,
  onOwnMessage: (msg) => {
    const { jid, phone } = getSender(msg);
    if (isIndividualChat(jid)) registerHumanReply(phone || jid);
  },
}).catch((err) => {
  console.error('[WhatsApp] Error al iniciar el cliente:', err);
});

const server = http.createServer(async (req, res) => {
  // 1. CORS y orígenes permitidos
  const origin = req.headers['origin'];
  const allowedOrigins = [
    'https://telasreal.com',
    'https://www.telasreal.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const isVercelOrigin = origin && (origin.endsWith('.vercel.app') || origin.includes('telasreal'));
  const isOriginAuthorized = !origin || allowedOrigins.includes(origin) || isVercelOrigin;

  if (origin && isOriginAuthorized) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.telasreal.com');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, Origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (origin && !isOriginAuthorized) {
    console.warn(`🔒 [Seguridad Bot] Bloqueada petición desde origen no autorizado: ${origin}`);
    sendJson(res, 403, { error: 'FORBIDDEN', message: 'Origen no autorizado para comunicarse con el bot de Telas Real.' });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Healthcheck para Railway
  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, { ok: true, status: getState().status });
    return;
  }

  // Endpoint público: GET / (HTML interactivo para navegador, o JSON para APIs)
  if (req.method === 'GET' && (pathname === '/' || pathname === '/qr-view')) {
    const st = getState();
    // El QR permite vincular CUALQUIER celular a la cuenta del bot: solo se muestra con el token
    const canSeeQr = isAuthorized(req, url);
    const isBrowser = (req.headers['accept'] || '').includes('text/html') && !url.searchParams.has('json');
    if (isBrowser) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      let statusHtml = '';
      if (st.status === 'CONNECTED') {
        statusHtml = `
          <div class="badge badge-ok"><span class="pulse"></span> WhatsApp Conectado y Operativo</div>
          <div style="font-size: 48px; margin: 16px 0;">🟢</div>
          <h2 style="font-size: 16px; margin: 0 0 6px;">+${st.connectedInfo?.user || 'Dispositivo Vinculado'}</h2>
          <p style="margin-bottom: 24px;">${st.connectedInfo?.name || 'Telas Real'} está listo para enviar mensajes automáticos.</p>
          <p style="font-size: 11px; color: #94a3b8;">La sesión está activa. Este panel se actualizará si se pierde la conexión.</p>
        `;
      } else if (st.status === 'AUTHENTICATED') {
        statusHtml = `
          <div class="badge badge-sync"><span class="pulse"></span> Dispositivo Vinculado</div>
          <div style="font-size: 48px; margin: 16px 0;">⏳</div>
          <h2 style="font-size: 16px; margin: 0 0 6px;">Completando la vinculación...</h2>
          <p>Espera unos segundos mientras se establece la conexión.</p>
        `;
      } else if (st.lastQrDataUrl && !canSeeQr) {
        statusHtml = `
          <div class="badge badge-wait"><span class="pulse" style="background:#f59e0b"></span> Esperando vinculación</div>
          <div style="font-size: 48px; margin: 16px 0;">🔒</div>
          <h2 style="font-size: 16px; margin: 0 0 6px;">Código QR protegido</h2>
          <p>Escanéalo desde el panel de administración (/admin/whatsapp) o abre esta página con <code>?token=</code> y el secreto del servicio.</p>
        `;
      } else if (st.lastQrDataUrl) {
        statusHtml = `
          <div class="badge badge-wait"><span class="pulse" style="background:#f59e0b"></span> Esperando escaneo con tu celular</div>
          <div class="qr-container">
            <img class="qr-img" src="${st.lastQrDataUrl}" alt="Código QR WhatsApp" />
          </div>
          <div class="steps">
            <strong>Cómo vincular:</strong>
            <ol>
              <li>Abre <strong>WhatsApp</strong> en tu celular.</li>
              <li>Toca <strong>Ajustes</strong> (o ⋮) &gt; <strong>Dispositivos vinculados</strong>.</li>
              <li>Toca <strong>Vincular un dispositivo</strong> y apunta tu cámara al código.</li>
            </ol>
          </div>
          <p style="font-size: 11px; color: #94a3b8;">Código generado hace ${st.lastQrAt ? Math.max(0, Math.round((Date.now() - st.lastQrAt) / 1000)) : 0} s. WhatsApp lo cambia cada ~20 s y esta pantalla se recarga sola cada 4 s.</p>
        `;
      } else {
        statusHtml = `
          <div class="badge badge-wait"><span class="pulse" style="background:#64748b"></span> ${st.status === 'DISCONNECTED' ? 'Reconectando...' : 'Iniciando cliente...'}</div>
          <div style="font-size: 48px; margin: 16px 0;">🔄</div>
          <h2 style="font-size: 16px; margin: 0 0 6px;">${st.status === 'DISCONNECTED' ? 'Generando un código nuevo...' : 'Conectando con WhatsApp...'}</h2>
          <p>En unos segundos aparecerá el código QR aquí.</p>
          ${st.lastDisconnectReason ? `<p style="font-size: 11px; color: #94a3b8;">Último cierre: ${String(st.lastDisconnectReason).replace(/[<>&]/g, '')}</p>` : ''}
        `;
      }

      res.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telas Real - WhatsApp Bot</title>
  <meta http-equiv="refresh" content="${st.status === 'CONNECTED' ? '15' : '4'}">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .card { background: white; border-radius: 24px; padding: 32px; max-width: 420px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 8px; color: #0f172a; }
    p { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
    .qr-container { background: #ffffff; border: 2px solid #10b981; border-radius: 16px; padding: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .qr-img { width: 240px; height: 240px; display: block; border-radius: 8px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    .badge-wait { background: #fef3c7; color: #92400e; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    .badge-sync { background: #dbeafe; color: #1e40af; }
    .steps { text-align: left; background: #f1f5f9; padding: 14px 18px; border-radius: 14px; font-size: 12px; color: #334155; line-height: 1.6; margin-bottom: 16px; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 4px; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
  </style>
</head>
<body>
  <div class="card">
    <h1>WhatsApp Bot - Telas Real</h1>
    <p>Servicio de mensajería automática y confirmación de pedidos</p>
    ${statusHtml}
  </div>
</body>
</html>`);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'Telas Real WhatsApp Bot',
        status: st.status,
        isTestMode: TEST_MODE,
        hasQr: Boolean(st.lastRawQr),
        security: 'ENABLED (Exclusivo telasreal.com)'
      })
    );
    return;
  }

  // 2. A partir de aquí todas las rutas requieren el token secreto
  if (!API_SECRET) {
    sendJson(res, 503, { error: 'SECRET_NOT_CONFIGURED', message: 'WHATSAPP_API_SECRET no está configurado en el servicio del bot.' });
    return;
  }
  if (!isAuthorized(req, url)) {
    console.warn(`🔒 [Seguridad Bot] Intento no autorizado hacia ${pathname} desde IP: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`);
    sendJson(res, 403, {
      error: 'FORBIDDEN',
      message: 'Acceso denegado. Este servicio está restringido a peticiones autenticadas desde telasreal.com.'
    });
    return;
  }

  // GET /status
  if (req.method === 'GET' && pathname === '/status') {
    const st = getState();
    sendJson(res, 200, {
      status: st.status,
      isTestMode: TEST_MODE,
      testPhone: TEST_PHONE,
      connectedInfo: st.connectedInfo,
      hasQr: Boolean(st.lastRawQr),
      lastDisconnectReason: st.lastDisconnectReason,
      recentHistory: messageHistory.slice(0, 10)
    });
    return;
  }

  // GET /qr
  if (req.method === 'GET' && pathname === '/qr') {
    const st = getState();
    sendJson(res, 200, {
      status: st.status,
      hasQr: Boolean(st.lastRawQr),
      qr: st.lastRawQr,
      dataUrl: st.lastQrDataUrl
    });
    return;
  }

  // POST /logout o /refresh-qr: cerrar sesión y generar un QR nuevo
  if (req.method === 'POST' && (pathname === '/logout' || pathname === '/refresh-qr')) {
    console.log('🔄 [WhatsApp] Solicitud de cierre de sesión / QR nuevo recibida.');
    sendJson(res, 200, { success: true, message: 'Generando nuevo código QR...' });
    resetSession().catch((err) => console.warn('[WhatsApp] Error reiniciando la sesión:', err?.message || err));
    return;
  }

  // POST /pairing-code { phone }: vincular sin escanear QR
  if (req.method === 'POST' && pathname === '/pairing-code') {
    try {
      const payload = await readJsonBody(req);
      const phone = toInternational(payload.phone || '');
      const code = await requestPairingCode(phone);
      sendJson(res, 200, { success: true, code, phone });
    } catch (err) {
      sendJson(res, 400, { success: false, error: err?.message || String(err) });
    }
    return;
  }

  // POST /send: envía una plantilla o mensaje personalizado
  if (req.method === 'POST' && pathname === '/send') {
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { success: false, error: 'INVALID_JSON' });
      return;
    }

    const { template, data = {}, customMessage } = payload;
    const targetPhone = normalizePhone(payload.phone || '') || TEST_PHONE;
    console.log(`[WhatsApp] Destinatario: ${targetPhone} ${payload.phone ? '(del pedido)' : '(número de prueba)'}`);

    let messageText = '';
    if (customMessage) {
      messageText = customMessage;
    } else if (template) {
      messageText = buildMessage(template, data);
    } else {
      sendJson(res, 400, { success: false, error: 'MISSING_TEMPLATE_OR_MESSAGE' });
      return;
    }

    if (TEST_MODE && !payload.phone) {
      messageText = `🧪 *[MODO PRUEBA]*\n\n${messageText}`;
    }

    const international = toInternational(targetPhone);
    try {
      const result = await sendText(international, messageText);
      registerAllowedRecipient(targetPhone);
      if (template === TEMPLATES.SATISFACTION_SURVEY || template === 'SATISFACTION_SURVEY') {
        registerSurveySent(targetPhone);
      }
      addHistory('OUT', targetPhone, template || 'CUSTOM', messageText, result.status);
      console.log(`✅ [WhatsApp] Mensaje ${result.id} aceptado por WhatsApp (${result.status}) → ${result.jid}`);
      sendJson(res, 200, {
        success: true,
        messageId: result.id,
        deliveryStatus: result.status,
        to: targetPhone,
        template,
        preview: messageText.slice(0, 150)
      });
    } catch (err) {
      const code = err?.code || 'SEND_ERROR';
      console.error(`❌ [WhatsApp] No se pudo enviar a +${international} [${code}]: ${err?.message}`);
      addHistory('OUT', targetPhone, template || 'CUSTOM', messageText, `FAILED:${code}`);
      sendJson(res, HTTP_STATUS_BY_CODE[code] || 500, {
        success: false,
        error: code,
        message: err?.message,
        to: targetPhone,
        ...(err?.messageId ? { messageId: err.messageId } : {})
      });
    }
    return;
  }

  // POST /test: plantilla de ejemplo al número de prueba
  if (req.method === 'POST' && pathname === '/test') {
    let payload;
    try {
      payload = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { success: false, error: 'INVALID_JSON' });
      return;
    }
    const templateType = payload.template || TEMPLATES.ORDER_CONFIRMATION;

    const sampleData = {
      customerName: payload.customerName || 'Keyner Trillos',
      orderNumber: payload.orderNumber || 'TR-7821',
      total: payload.total || 89500,
      shippingAddress: payload.shippingAddress || 'Cra. 53 # 12-40, Medellín, Antioquia',
      items: payload.items || [
        { title: 'Rib Pitillo Azul Cielo', quantity: 3, price: 12400 },
        { title: 'Lino Suizo Blanco Óptico', quantity: 2, price: 26150 }
      ],
      carrier: 'Coordinadora Mercantil',
      trackingNumber: payload.trackingNumber || '75892104523',
      trackingUrl: 'https://www.coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo/?guia=75892104523',
      itemSummary: '3 metros de Rib Pitillo Azul Cielo y 2 metros de Lino Suizo',
      promoTitle: '¡Nuevas Telas Rib y Scuba con 15% OFF!',
      promoDetails: 'Recibimos los nuevos rollos de Rib 2x2 en tonos pastel y Scuba Crepe ideales para confección de vestidos y prendas deportivas.',
      siteUrl: 'https://telasreal.com'
    };

    const messageText = buildMessage(templateType, { ...sampleData, ...(payload.data || {}) });
    const targetPhone = normalizePhone(payload.phone || '') || TEST_PHONE;

    if (!isConnected()) {
      sendJson(res, 503, {
        success: false,
        error: 'BOT_NOT_CONNECTED',
        message: `El cliente de WhatsApp no está conectado (estado: ${getState().status}). Escanea el código QR primero.`,
        generatedMessagePreview: messageText
      });
      return;
    }

    try {
      const result = await sendText(toInternational(targetPhone), messageText);
      registerAllowedRecipient(targetPhone);
      if (templateType === TEMPLATES.SATISFACTION_SURVEY || templateType === 'SATISFACTION_SURVEY') {
        registerSurveySent(targetPhone);
      }
      addHistory('OUT', targetPhone, templateType, messageText, result.status);
      sendJson(res, 200, {
        success: true,
        to: targetPhone,
        template: templateType,
        messageId: result.id,
        deliveryStatus: result.status,
        preview: messageText
      });
    } catch (err) {
      const code = err?.code || 'SEND_ERROR';
      console.error(`❌ [WhatsApp Test] No se pudo enviar [${code}]: ${err?.message}`);
      addHistory('OUT', targetPhone, templateType, messageText, `FAILED:${code}`);
      sendJson(res, HTTP_STATUS_BY_CODE[code] || 500, { success: false, error: code, message: err?.message, preview: messageText });
    }
    return;
  }

  sendJson(res, 404, { error: 'NOT_FOUND', message: 'Ruta no encontrada en el servicio de WhatsApp' });
});

server.listen(PORT, () => {
  console.log(`🚀 Microservicio WhatsApp Bot escuchando en el puerto ${PORT}`);
});

// Cierre limpio (Railway envía SIGTERM en cada despliegue)
let isShuttingDown = false;
const handleShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[WhatsApp] Señal ${signal} recibida. Cerrando conexión...`);
  await stopWhatsApp().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[WhatsApp Bot] Promesa rechazada sin manejar:', reason?.message || reason);
});
