/**
 * Plantillas oficiales de mensajes automatizados para WhatsApp - Telas Real
 */

export const TEMPLATES = {
  ORDER_CONFIRMATION: 'ORDER_CONFIRMATION',
  ORDER_DISPATCH: 'ORDER_DISPATCH',
  CART_REMINDER: 'CART_REMINDER',
  SATISFACTION_SURVEY: 'SATISFACTION_SURVEY',
  PROMOTIONS: 'PROMOTIONS'
};

/**
 * Formatea un valor numérico a pesos colombianos (COP).
 */
function formatCurrency(amount = 0) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Genera el mensaje según la plantilla solicitada.
 * @param {string} templateId - Tipo de plantilla (de TEMPLATES)
 * @param {object} data - Datos dinámicos para rellenar la plantilla
 * @returns {string} Texto formateado con estilo WhatsApp
 */
export function buildMessage(templateId, data = {}) {
  const customerName = data.customerName || 'Apreciado/a cliente';
  const siteUrl = data.siteUrl || 'https://telasreal.com';

  switch (templateId) {
    case TEMPLATES.ORDER_CONFIRMATION: {
      const orderNumber = data.orderNumber || 'TR-0000';
      const totalFormatted = formatCurrency(data.total || 0);
      const itemsText = Array.isArray(data.items) && data.items.length > 0
        ? data.items.map(it => `• *${it.title || 'Tela'}* x ${it.quantity || 1} m - ${formatCurrency(it.price || 0)}`).join('\n')
        : '• Telas seleccionadas';
      const orderUrl = data.orderUrl || `${siteUrl}/orders/${orderNumber}`;

      return (
        `🎉 *¡Tu compra en Telas Real ha sido confirmada!*\n\n` +
        `Hola *${customerName}*, hemos recibido tu pedido con éxito.\n\n` +
        `📄 *Número de Pedido:* #${orderNumber}\n` +
        `💰 *Total Pagado:* ${totalFormatted}\n\n` +
        `📦 *Detalle del Pedido:*\n${itemsText}\n\n` +
        `📍 *Dirección de Entrega:* ${data.shippingAddress || 'Dirección registrada'}\n` +
        `🚚 *Método de Envío:* Coordinadora Mercantil\n\n` +
        `Estamos preparando tus cortes con el mayor cuidado y precisión. Puedes ver tu pedido en detalle aquí:\n${orderUrl}\n\n` +
        `_¡Gracias por confiar en la calidad de Telas Real!_`
      );
    }

    case TEMPLATES.ORDER_DISPATCH: {
      const orderNumber = data.orderNumber || 'TR-0000';
      const carrier = data.carrier || 'Coordinadora Mercantil';
      const trackingNumber = data.trackingNumber || 'En trámite';
      const trackingUrl = data.trackingUrl || `https://www.coordinadora.com/rastreo/rastreo-de-guia/detalle-de-rastreo/?guia=${trackingNumber}`;

      return (
        `🚚 *¡Tu pedido de Telas Real va en camino!*\n\n` +
        `Hola *${customerName}*, te informamos que tu pedido *#${orderNumber}* ya fue despachado de nuestra bodega.\n\n` +
        `🏢 *Transportadora:* ${carrier}\n` +
        `🔖 *Número de Guía:* *${trackingNumber}*\n` +
        `⏱️ *Tiempo estimado:* 1 a 3 días hábiles\n\n` +
        `🔍 Puedes hacer seguimiento en tiempo real de tu paquete haciendo clic aquí:\n${trackingUrl}\n\n` +
        `Si tienes alguna duda con la entrega, escríbenos por este medio.`
      );
    }

    case TEMPLATES.CART_REMINDER: {
      const cartUrl = data.cartUrl || `${siteUrl}/cart`;
      const reservedItem = data.itemSummary || 'las telas que seleccionaste';

      return (
        `⏰ *¡Hola ${customerName}! Tus telas te están esperando en Telas Real*\n\n` +
        `Notamos que dejaste pendiente tu pedido de *${reservedItem}*.\n\n` +
        `Te recordamos que nuestras referencias en tendencia tienen alta demanda y los rollos se agotan con rapidez.\n\n` +
        `👉 Continúa tu compra fácil y seguro en el siguiente enlace:\n${cartUrl}\n\n` +
        `¿Tienes dudas sobre los metros necesarios o el tipo de tela? ¡Respóndenos a este mensaje y un asesor te atenderá de inmediato!`
      );
    }

    case TEMPLATES.SATISFACTION_SURVEY: {
      const orderNumber = data.orderNumber || 'tu reciente compra';
      const botPhone = data.botPhone || '573159021516';

      return (
        `⭐ *¿Cómo fue tu experiencia con Telas Real?*\n\n` +
        `Hola *${customerName}*, nos alegra confirmar que tu pedido *#${orderNumber}* ha sido completado con éxito. ¡Esperamos que disfrutes al máximo tus cortes de tela!\n\n` +
        `Para nosotros tu satisfacción es lo más importante. ¿Cómo calificarías nuestro servicio y la calidad textil?\n\n` +
        `👉 *Toca una opción para calificar (1 solo clic):*\n\n` +
        `• ⭐⭐⭐⭐⭐ *5/5 Excelente:* https://wa.me/${botPhone}?text=5%20-%20Excelente%20Telas%20Real\n` +
        `• ⭐⭐⭐⭐ *4/5 Muy Buena:* https://wa.me/${botPhone}?text=4%20-%20Muy%20Buena%20Telas%20Real\n` +
        `• ⭐⭐⭐ *3/5 Buena:* https://wa.me/${botPhone}?text=3%20-%20Buena%20Telas%20Real\n` +
        `• ⭐⭐ *2/5 Regular:* https://wa.me/${botPhone}?text=2%20-%20Regular%20Telas%20Real\n` +
        `• ⭐ *1/5 Muy Mala:* https://wa.me/${botPhone}?text=1%20-%20Muy%20Mala%20Telas%20Real\n\n` +
        `_O si lo prefieres, simplemente responde con el número del 1 al 5 en este chat._\n\n` +
        `¡Agradecemos mucho tu confianza en Telas Real! 🧵🇨🇴`
      );
    }

    case TEMPLATES.PROMOTIONS: {
      const promoTitle = data.promoTitle || 'Nuevas Referencias y Descuentos Exclusivos';
      const promoDetails = data.promoDetails || 'Llegaron nuevos rollos de Rib, Lino, Scuba y Sedas con acabados premium listos para despacho inmediato.';
      const catalogUrl = data.catalogUrl || `${siteUrl}/tienda`;

      return (
        `✨ *¡Novedades en Telas Real!* ✨\n\n` +
        `Hola *${customerName}*,\n\n` +
        `🎉 *${promoTitle}*\n\n` +
        `${promoDetails}\n\n` +
        `🧵 Explora los nuevos colores y texturas en nuestra tienda virtual antes de que se agoten:\n${catalogUrl}\n\n` +
        `_Envíos a toda Colombia por Coordinadora. Calidad garantizada en cada metro._`
      );
    }

    default:
      return data.customMessage || `Hola ${customerName}, mensaje de prueba de Telas Real.`;
  }
}
