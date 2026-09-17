import http from 'http';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';

import { buildMessage, TEMPLATES } from './templates.mjs';
import { isAllowedSender, getAutoReply, normalizePhone } from './bot-replies.mjs';

// Configuración de entorno
const PORT = Number(process.env.WHATSAPP_BOT_PORT) || 3005;
const TEST_MODE = process.env.WHATSAPP_TEST_MODE !== 'false';
const TEST_PHONE = normalizePhone(process.env.WHATSAPP_TEST_PHONE || '3133087069');

console.log('---------------------------------------------------------');
console.log('🤖 INICIANDO SERVICIO WHATSAPP BOT - TELAS REAL');
console.log(`• Puerto HTTP: ${PORT}`);
console.log(`• Modo de Pruebas: ${TEST_MODE ? 'ACTIVO (Seguro)' : 'DESACTIVADO (Producción)'}`);
console.log(`• Número Exclusivo de Prueba: ${TEST_PHONE}`);
console.log('---------------------------------------------------------');

// Variables de estado del cliente
let botStatus = 'INITIALIZING'; // 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'CONNECTED' | 'DISCONNECTED'
let lastRawQr = null;
let lastQrDataUrl = null;
let connectedInfo = null;
const messageHistory = [];

function addHistory(direction, phone, template, snippet) {
  messageHistory.unshift({
    timestamp: new Date().toISOString(),
    direction, // 'IN' | 'OUT'
    phone,
    template: template || 'TEXT',
    snippet: snippet.slice(0, 120)
  });
  if (messageHistory.length > 50) messageHistory.pop();
}

import fs from 'fs';
import path from 'path';

// Detección automática del ejecutable de Google Chrome en macOS y Linux
function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidatePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const detectedChrome = getChromeExecutablePath();
if (detectedChrome) {
  console.log(`• Navegador Chrome del sistema: ${detectedChrome}`);
}

/**
 * Elimina bloqueos residuales de Chromium en .wwebjs_auth para evitar
 * que pida escanear el código QR de nuevo si el proceso anterior no cerró limpiamente.
 */
function cleanResidualSessionLocks(authPath = './.wwebjs_auth') {
  if (!fs.existsSync(authPath)) return;
  const lockNames = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort'];

  function walkAndClean(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkAndClean(fullPath);
        } else if (lockNames.includes(entry.name) || entry.isSymbolicLink()) {
          if (lockNames.includes(entry.name)) {
            try {
              fs.unlinkSync(fullPath);
              console.log(`🧹 [Sesión WhatsApp] Bloqueo residual de Chrome liberado: ${entry.name}`);
            } catch (err) {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  try {
    walkAndClean(authPath);
  } catch (e) {
    console.warn('[Sesión WhatsApp] Advertencia limpiando bloqueos:', e.message);
  }
}

// Limpiar bloqueos de sesión antes de inicializar cliente
cleanResidualSessionLocks('./.wwebjs_auth');

// Inicialización del cliente WhatsApp con persistencia LocalAuth estable
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth',
    clientId: 'session'
  }),
  puppeteer: {
    headless: true,
    executablePath: detectedChrome,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync'
    ]
  }
});


// Evento: Generación de Código QR
client.on('qr', async (qr) => {
  botStatus = 'QR_READY';
  lastRawQr = qr;

  try {
    lastQrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
  } catch (err) {
    console.error('[WhatsApp] Error al convertir QR a DataURL:', err.message);
  }

  console.log('\n========================================================================');
  console.log('📲 CÓDIGO QR DE VINCULACIÓN DE WHATSAPP WEB - TELAS REAL');
  console.log('========================================================================');
  console.log('1. Abre WhatsApp en tu celular.');
  console.log('2. Ve a Ajustes / Configuración -> Dispositivos vinculados -> Vincular dispositivo.');
  console.log('3. Escanea el código que aparece aquí abajo:');
  console.log('------------------------------------------------------------------------');

  qrcodeTerminal.generate(qr, { small: true });

  console.log('------------------------------------------------------------------------');
  console.log(`💡 O si prefieres escanearlo desde la web, abre: http://localhost:3000/admin/whatsapp`);
  console.log('========================================================================\n');
});

// Evento: Autenticado
client.on('authenticated', () => {
  botStatus = 'AUTHENTICATED';
  lastRawQr = null;
  lastQrDataUrl = null;
  console.log('[WhatsApp] 🔐 Sesión autenticada correctamente.');
});

// Evento: Cliente Listo
client.on('ready', () => {
  botStatus = 'CONNECTED';
  lastRawQr = null;
  lastQrDataUrl = null;
  connectedInfo = {
    user: client.info?.wid?.user || 'Desconocido',
    name: client.info?.pushname || 'Telas Real'
  };

  console.log('\n========================================================================');
  console.log('✅ ¡WHATSAPP CONECTADO Y OPERATIVO EN TELAS REAL!');
  console.log(`• Conectado como: +${connectedInfo.user} (${connectedInfo.name})`);
  console.log(`• Modo de pruebas: ${TEST_MODE ? `RESTRINGIDO AL NÚMERO: ${TEST_PHONE}` : 'PRODUCCIÓN'}`);
  console.log(`• Escucha activa de mensajes lista.`);
  console.log('========================================================================\n');
});

// Evento: Falla de Autenticación
client.on('auth_failure', (msg) => {
  botStatus = 'DISCONNECTED';
  console.error('[WhatsApp] ❌ Error de autenticación:', msg);
});

// Manejo de excepciones y rechazos para evitar que el bot se caiga
process.on('uncaughtException', (err) => {
  console.warn('[WhatsApp Bot Warning] Excepción no capturada (manejada):', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[WhatsApp Bot Warning] Rechazo no controlado (manejado):', reason?.message || reason);
});

// Evento: Desconexión
client.on('disconnected', async (reason) => {
  botStatus = 'DISCONNECTED';
  connectedInfo = null;
  console.warn('[WhatsApp] ⚠️ Cliente desconectado. Motivo:', reason);
  console.log('[WhatsApp] Esperando 5s para reiniciar cliente de forma segura...');
  try {
    await client.destroy().catch(() => {});
  } catch {}
  setTimeout(() => {
    client.initialize().catch((err) => {
      console.warn('[WhatsApp] Error al re-inicializar cliente:', err.message);
    });
  }, 5000);
});

// Evento: Recepción de Mensajes con Filtro Estricto de Seguridad
client.on('message', async (msg) => {
  // Ignorar mensajes de grupos, estados o transmisiones
  if (msg.from.includes('@g.us') || msg.from.includes('status@broadcast')) {
    return;
  }

  const senderJid = msg.from;
  const isAllowed = isAllowedSender(senderJid, TEST_PHONE, TEST_MODE);

  if (!isAllowed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Filtro Seguridad] Mensaje de ${senderJid} ignorado (modo pruebas restringido a ${TEST_PHONE}).`);
    }
    return;
  }

  console.log(`\n📩 [WhatsApp Mensaje Recibido de ${senderJid}]: "${msg.body}"`);
  addHistory('IN', senderJid, 'USER_MESSAGE', msg.body);

  const autoReply = getAutoReply(msg.body, msg._data?.notifyName || 'Cliente');

  if (autoReply) {
    try {
      // Simular delay natural de respuesta (600ms)
      await new Promise((r) => setTimeout(r, 600));
      await msg.reply(autoReply);
      console.log(`🤖 [WhatsApp Auto-Respuesta Enviada a ${senderJid}]`);
      addHistory('OUT', senderJid, 'AUTO_REPLY', autoReply);
    } catch (sendErr) {
      console.error(`[WhatsApp] Error al enviar auto-respuesta:`, sendErr.message);
    }
  }
});

// Iniciar cliente WhatsApp
client.initialize().catch((err) => {
  console.error('[WhatsApp] Error al inicializar cliente:', err);
});

/**
 * Servidor HTTP para integración con Next.js y panel de control
 */
const server = http.createServer(async (req, res) => {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Endpoint: GET /status
  if (req.method === 'GET' && pathname === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: botStatus,
        isTestMode: TEST_MODE,
        testPhone: TEST_PHONE,
        connectedInfo,
        hasQr: Boolean(lastRawQr),
        recentHistory: messageHistory.slice(0, 10)
      })
    );
    return;
  }

  // Endpoint: GET /qr
  if (req.method === 'GET' && pathname === '/qr') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: botStatus,
        hasQr: Boolean(lastRawQr),
        qr: lastRawQr,
        dataUrl: lastQrDataUrl
      })
    );
    return;
  }

  // Endpoint: POST /send (Envía mensaje a través de plantillas)
  if (req.method === 'POST' && pathname === '/send') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { template, data = {}, customMessage } = payload;

        let targetPhone = normalizePhone(payload.phone || TEST_PHONE);

        // En modo de pruebas, forzar envío estricto al número de prueba
        if (TEST_MODE) {
          if (targetPhone !== TEST_PHONE) {
            console.log(`[Modo Pruebas] Redirigiendo envío destinado a ${targetPhone} hacia el número seguro ${TEST_PHONE}`);
          }
          targetPhone = TEST_PHONE;
        }

        if (botStatus !== 'CONNECTED') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'BOT_NOT_CONNECTED',
              message: `El cliente de WhatsApp no está conectado actualmente (Estado: ${botStatus}). Escanea el código QR primero.`
            })
          );
          return;
        }

        // Construir mensaje
        let messageText = '';
        if (customMessage) {
          messageText = customMessage;
        } else if (template) {
          messageText = buildMessage(template, data);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'MISSING_TEMPLATE_OR_MESSAGE' }));
          return;
        }

        // En modo de pruebas seguro, anteponer encabezado indicando el destinatario original
        if (TEST_MODE) {
          const rawDest = payload.phone ? `+57 ${normalizePhone(payload.phone)}` : `Prueba Interna`;
          const clientName = data?.customerName || 'Cliente';
          messageText = `🧪 *[MODO PRUEBA LOCAL - Destino Original: ${rawDest} (${clientName})]*\n\n${messageText}`;
        }

        // Formato internacional para Colombia (código 57)
        const formattedTarget = targetPhone.startsWith('57') ? targetPhone : `57${targetPhone}`;
        const chatId = `${formattedTarget}@c.us`;

        console.log(`📤 [WhatsApp Enviando Mensaje] Hacia: ${chatId} | Plantilla: ${template || 'CUSTOM'}`);
        const sent = await client.sendMessage(chatId, messageText);

        addHistory('OUT', targetPhone, template || 'CUSTOM', messageText);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            messageId: sent.id?.id,
            to: targetPhone,
            template,
            preview: messageText.slice(0, 150)
          })
        );
      } catch (err) {
        console.error('[WhatsApp] Error al procesar /send:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Endpoint: POST /test (Pruebas rápidas de las 5 plantillas hacia el número 3133087069)
  if (req.method === 'POST' && pathname === '/test') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const templateType = payload.template || TEMPLATES.ORDER_CONFIRMATION;

        // Datos de ejemplo representativos para Telas Real
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

        if (botStatus !== 'CONNECTED') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: 'BOT_NOT_CONNECTED',
              message: `El cliente de WhatsApp no está conectado (Estado actual: ${botStatus}). Escanea el código QR primero.`,
              generatedMessagePreview: messageText
            })
          );
          return;
        }

        const formattedTarget = TEST_PHONE.startsWith('57') ? TEST_PHONE : `57${TEST_PHONE}`;
        const chatId = `${formattedTarget}@c.us`;

        console.log(`📤 [Test Template] Disparando ${templateType} hacia ${chatId}...`);
        const sent = await client.sendMessage(chatId, messageText);
        addHistory('OUT', TEST_PHONE, templateType, messageText);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            to: TEST_PHONE,
            template: templateType,
            messageId: sent.id?.id,
            preview: messageText
          })
        );
      } catch (err) {
        console.error('[WhatsApp Test] Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Ruta 404 por defecto
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'NOT_FOUND', message: 'Ruta no encontrada en el servicio de WhatsApp' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Microservicio WhatsApp Bot escuchando en http://localhost:${PORT}`);
  console.log(`• Ver estado: http://localhost:${PORT}/status`);
  console.log(`• Ver QR: http://localhost:${PORT}/qr`);
});

// Manejo limpio de señales de terminación para asegurar persistencia de cookies
let isShuttingDown = false;
const handleShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[WhatsApp] Recibida señal ${signal}. Cerrando cliente y liberando sesión de forma limpia...`);
  try {
    await client.destroy().catch(() => {});
  } catch {}
  server.close(() => {
    console.log('[WhatsApp] Servidor detenido y sesión guardada correctamente.');
    process.exit(0);
  });
  // Forzar salida si tarda más de 3 segundos
  setTimeout(() => process.exit(0), 3000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
