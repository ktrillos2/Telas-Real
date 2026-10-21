# Bot de WhatsApp — diagnóstico y migración a Baileys

## Problema reportado

En local el bot enviaba mensajes. En Railway los logs mostraban "conectado" y "enviado", pero el mensaje nunca llegaba.

## Causas encontradas en el bot anterior (whatsapp-web.js)

1. **Reportaba "enviado" sin confirmación.** `/send` esperaba solo 3,5 s a `sendMessage`. Si no respondía, lo daba por enviado (`sent = { id: 'enviado' }`) y devolvía `success: true`. En Railway, con menos CPU y Chromium más lento, eso pasaba siempre: el log decía "Entregado" aunque el mensaje nunca saliera.
2. **Versión de WhatsApp Web fijada a mano** (`2.3000.1049703040-alpha`, descargada de un repositorio de terceros). Cuando WhatsApp la deja de aceptar, la sesión "conecta", pero los envíos quedan pendientes.
3. **Chromium headless en un contenedor** con un User-Agent de Windows falso. Es frágil por memoria, por `/dev/shm` y por la detección de automatización. En local se usaba el Google Chrome del Mac, que se comporta distinto.
4. **Errores silenciados.** `uncaughtException` y `unhandledRejection` solo mostraban una advertencia, así que los fallos internos de Puppeteer no se veían.
5. **Sesión en disco efímero.** `.wwebjs_auth` se perdía en cada despliegue si no había un Volume.
6. **Posible restricción de la cuenta (error 463).** WhatsApp puede bloquear temporalmente que una cuenta vinculada inicie chats nuevos. whatsapp-web.js no lo mostraba; el mensaje simplemente no salía.

## Solución implementada: Baileys

`@whiskeysockets/baileys` 7.0.0-rc14 (la etiqueta `latest` en npm, de julio de 2026) habla directamente con los servidores de WhatsApp por WebSocket, el mismo protocolo que WhatsApp Web, **sin navegador**.

- **Sin Chromium ni Puppeteer.** La imagen es mucho más liviana y no hay procesos de navegador que se cuelguen.
- **Versión del protocolo automática** (`fetchLatestBaileysVersion`).
- **Confirmación real.** `/send` solo responde `success: true` cuando el servidor de WhatsApp confirma la recepción (✓). Si no, devuelve un error con código:

| Código | HTTP | Significado |
|---|---|---|
| `NOT_CONNECTED` | 503 | El bot no está vinculado o perdió la conexión |
| `NOT_ON_WHATSAPP` | 422 | El número no tiene WhatsApp |
| `ACCOUNT_RESTRICTED` | 429 | WhatsApp restringió a la cuenta para iniciar chats nuevos (error 463) |
| `ACK_TIMEOUT` | 504 | WhatsApp no confirmó en 20 s |
| `SEND_ERROR` | 502 | Otro rechazo del servidor |

- **Reintentos de cifrado** (`getMessage`). Se guardan los mensajes enviados recientes para reenviarlos si el teléfono del destinatario lo pide. Así se evita el "Esperando el mensaje" en el celular del cliente.
- **Identificadores LID** resueltos por la librería (antes había un ID `@lid` escrito a mano en el código).
- **Reconexión** con espera creciente. Si la sesión se cierra desde el celular, se borra y se genera un QR nuevo.
- **QR protegido.** La página pública `/` ya no muestra el QR sin el token (`/?token=SECRETO`), porque cualquiera que lo escaneara podía vincular su propio celular al bot. El panel `/admin/whatsapp` sigue funcionando igual.
- **Código de vinculación** como alternativa al QR: `POST /pairing-code { "phone": "3001234567" }`. En el celular: Dispositivos vinculados → Vincular con número de teléfono.
- **`GET /health`** para el healthcheck de Railway.

El contrato HTTP que usa Next.js (`/status`, `/qr`, `/send`, `/test`, `/logout`, `/refresh-qr`) no cambió.

## Configuración en Railway (obligatoria)

1. **Volume.** Crear un Volume en el servicio del bot montado en `/data`. Sin él, cada despliegue borra la sesión y hay que volver a escanear el QR. La imagen ya usa `WHATSAPP_AUTH_PATH=/data/baileys_auth`.
2. **Variables del servicio:**
   - `WHATSAPP_API_SECRET`: un valor largo y aleatorio. **El mismo** debe estar en Vercel (Next.js). Hoy ambos usan un valor por defecto escrito en el código.
   - `WHATSAPP_TEST_MODE=false` cuando se quiera que el bot responda a todos los clientes.
   - Opcional: `WHATSAPP_LOG_LEVEL=info` para diagnosticar.
3. **Una sola instancia.** No tener el bot corriendo en local y en Railway con la misma sesión. Con una sola réplica, si aparece `connectionReplaced` en los logs, había otra instancia conectada.
4. Tras el primer despliegue, **volver a vincular** el número: la sesión de whatsapp-web.js no es compatible con Baileys. Hacerlo desde `/admin/whatsapp`, desde `https://<bot>.up.railway.app/?token=SECRETO` o con el código de vinculación.

## Desarrollo local

```bash
cd services/whatsapp-bot && npm install   # solo la primera vez
cd ../.. && pnpm whatsapp:bot
```

## Si aparece `ACCOUNT_RESTRICTED` (error 463)

No es un fallo del código: WhatsApp limita a la cuenta para iniciar conversaciones nuevas. Suele pasar con números nuevos o que envían muchos mensajes a contactos que nunca les han escrito. Qué hacer:
- Esperar a que se levante la restricción y reducir el volumen de mensajes a contactos nuevos.
- Usar un número con historial (no recién creado).
- Para notificaciones de pedidos a gran escala, la vía estable es la **API oficial de WhatsApp Business (Cloud API de Meta)**. Requiere verificar el negocio y aprobar plantillas, y cobra por conversación, pero no tiene riesgo de bloqueo. Baileys y whatsapp-web.js son clientes no oficiales: WhatsApp puede restringir o banear cuentas que los usen para envíos masivos.
