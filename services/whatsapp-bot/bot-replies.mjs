/**
 * Lógica de auto-respuestas y validación de seguridad de remitentes para Telas Real.
 */

/**
 * Normaliza un número telefónico extrayendo solo dígitos.
 */
export function normalizePhone(rawPhone = '') {
  return String(rawPhone || '').replace(/\D/g, '');
}

/**
 * Verifica si el remitente está autorizado en modo de pruebas.
 * En modo pruebas, el bot responde EXCLUSIVAMENTE al número configurado (ej: 3133087069).
 */
export function isAllowedSender(fromJid = '', allowedPhone = '3133087069', isTestMode = true) {
  if (!isTestMode) return true; // En producción responde a todos

  const cleanJid = normalizePhone(fromJid.replace('@c.us', '').replace('@s.whatsapp.net', ''));
  const cleanAllowed = normalizePhone(allowedPhone);

  if (!cleanAllowed) return false;

  // Compara si termina con el número autorizado (ej: 573133087069 termina en 3133087069)
  return cleanJid.endsWith(cleanAllowed);
}

/**
 * Procesa el mensaje entrante y genera la respuesta automática inteligente.
 * @param {string} incomingText - Texto enviado por el usuario
 * @param {string} senderName - Nombre del contacto si está disponible
 * @returns {string|null} Texto a responder (o null si no se debe responder)
 */
export function getAutoReply(incomingText = '', senderName = 'Cliente') {
  const text = incomingText.trim().toLowerCase();

  // 1. Detección de respuestas a encuesta de satisfacción (1 a 5)
  if (['1', '2', '3', '4', '5'].includes(text)) {
    const stars = '⭐'.repeat(Number(text));
    if (Number(text) >= 4) {
      return (
        `${stars} *¡Muchísimas gracias por tu calificación!*\n\n` +
        `Nos alegra enormemente saber que tuviste una gran experiencia con Telas Real. ` +
        `Trabajamos día a día para brindarte los mejores textiles de Colombia y un servicio impecable.\n\n` +
        `Si necesitas algo adicional para tus proyectos de confección, ¡aquí estamos siempre a tu orden! 🧵✨`
      );
    } else {
      return (
        `${stars} *Apreciamos sinceramente tu retroalimentación.*\n\n` +
        `Lamentamos si algún aspecto de tu experiencia no cumplió todas tus expectativas. Tu opinión es fundamental para nosotros. ` +
        `Un asesor de control de calidad revisará tu caso para mejorar y contactarte si es necesario. ¡Gracias por ayudarnos a crecer!`
      );
    }
  }

  // 2. Saludos o solicitud de menú
  const isGreeting = /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|menu|menú|ayuda|info|asesor|inicio)/i.test(text);

  if (isGreeting) {
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
