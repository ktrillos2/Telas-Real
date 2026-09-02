import { defineField, defineType } from 'sanity'
import { Sparkles, Flame, Tag, AlertCircle } from 'lucide-react'

export const popupConfig = defineType({
  name: 'popupConfig',
  title: 'Gestión de Popups (Urgencia y Promos)',
  type: 'document',
  icon: Sparkles,
  groups: [
    { name: 'general', title: '⚙️ Activación General', default: true },
    { name: 'urgency', title: '🔥 Popup: Agotamiento de Productos' },
    { name: 'promo', title: '🎉 Popup: Nuevas Promociones' },
    { name: 'timing', title: '⏱️ Frecuencia y Tiempos' },
  ],
  fields: [
    // ==========================================
    // 1. ACTIVACIÓN EXCLUSIVA (SOLO UNO A LA VEZ)
    // ==========================================
    defineField({
      name: 'activePopup',
      title: 'Seleccionar Popup Activo en la Web',
      type: 'string',
      group: 'general',
      description: '⚠️ REGLA DE EXCLUSIVIDAD: Solo un popup puede estar activo a la vez en la web para no saturar al usuario.',
      options: {
        list: [
          { title: '🚫 Ninguno (Todos los Popups Desactivados)', value: 'none' },
          { title: '🔥 Popup 1: Urgencia / Agotamiento de Productos', value: 'urgency' },
          { title: '🎉 Popup 2: Nuevas Promociones y Ofertas', value: 'promo' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),

    // ==========================================
    // 2. CONFIGURACIÓN: POPUP 1 (AGOTAMIENTO)
    // ==========================================
    defineField({
      name: 'urgencyMode',
      title: 'Modo de Funcionamiento (Agotamiento)',
      type: 'string',
      group: 'urgency',
      description: 'Elige si quieres que el sistema detecte productos automáticamente o si prefieres configurar un producto/mensaje específico.',
      options: {
        list: [
          { title: '⚡ Automático (Detecta productos con bajo stock o más vendidos)', value: 'auto' },
          { title: '✍️ Manual (Configurado 100% por el editor)', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
    }),

    // Urgencia - Modo Manual
    defineField({
      name: 'urgencyProduct',
      title: 'Producto del Catálogo (Opcional)',
      type: 'reference',
      to: [{ type: 'product' }],
      group: 'urgency',
      description: 'Selecciona un producto para cargar automáticamente sus datos o usa los campos personalizados de abajo.',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyCustomTitle',
      title: 'Título de Urgencia',
      type: 'string',
      group: 'urgency',
      description: 'Ej: ¡Se agota rápido! Tela Brush Sublimada',
      initialValue: '¡Agotándose Rápido! Tela Brush Sublimada',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyCustomMessage',
      title: 'Mensaje de Escasez',
      type: 'text',
      rows: 2,
      group: 'urgency',
      description: 'Ej: Quedan solo 6 metros disponibles en inventario. ¡Alta demanda en las últimas horas!',
      initialValue: 'Quedan solo 6 metros disponibles en inventario. ¡Alta demanda hoy!',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyBadgeText',
      title: 'Etiqueta / Badge Superior',
      type: 'string',
      group: 'urgency',
      description: 'Ej: 🔥 ¡ÚLTIMAS UNIDADES!, ⚠️ QUEDAN POCOS METROS',
      initialValue: '🔥 ¡ÚLTIMAS UNIDADES!',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyStockRemaining',
      title: 'Cantidad restante a mostrar',
      type: 'number',
      group: 'urgency',
      description: 'Número de metros o unidades que quedan.',
      initialValue: 5,
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyStockUnit',
      title: 'Unidad de Stock',
      type: 'string',
      group: 'urgency',
      initialValue: 'metros',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyCustomImage',
      title: 'Imagen Personalizada',
      type: 'image',
      group: 'urgency',
      options: { hotspot: true },
      description: 'Imagen personalizada si no seleccionas un producto arriba.',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyButtonText',
      title: 'Texto del Botón',
      type: 'string',
      group: 'urgency',
      initialValue: 'Ver Producto',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencyButtonUrl',
      title: 'Enlace personalizado del Botón',
      type: 'string',
      group: 'urgency',
      description: 'URL de destino (opcional, por defecto va al producto o /tienda).',
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),
    defineField({
      name: 'urgencySocialProofCount',
      title: 'Personas viendo esto (Social Proof)',
      type: 'number',
      group: 'urgency',
      initialValue: 14,
      hidden: ({ parent }) => parent?.urgencyMode === 'auto',
    }),

    // Urgencia - Modo Automático
    defineField({
      name: 'urgencyAutoStockThreshold',
      title: 'Umbral de Stock Bajo (Automático)',
      type: 'number',
      group: 'urgency',
      description: 'Mostrará productos cuyo stock sea menor o igual a este número.',
      initialValue: 20,
      hidden: ({ parent }) => parent?.urgencyMode !== 'auto',
    }),
    defineField({
      name: 'urgencyAutoBadgeText',
      title: 'Badge en Modo Automático',
      type: 'string',
      group: 'urgency',
      initialValue: '🔥 ¡CASI AGOTADO!',
      hidden: ({ parent }) => parent?.urgencyMode !== 'auto',
    }),
    defineField({
      name: 'urgencyAutoMessageTemplate',
      title: 'Plantilla de Mensaje Automático',
      type: 'string',
      group: 'urgency',
      description: 'Usa {stock} para insertar dinámicamente las unidades/metros restantes.',
      initialValue: '¡Quedan solo {stock} disponibles! Aprovecha antes de que se agote.',
      hidden: ({ parent }) => parent?.urgencyMode !== 'auto',
    }),

    // Urgencia - Estilos
    defineField({
      name: 'urgencyThemeColor',
      title: 'Tema Visual de Urgencia',
      type: 'string',
      group: 'urgency',
      options: {
        list: [
          { title: '🔥 Rojo Fuego Intenso', value: 'red' },
          { title: '⚡ Ámbar / Naranja Alerta', value: 'amber' },
          { title: '🖤 Oscuro Elegante (Dark Luxury)', value: 'dark' },
          { title: '🔵 Azul Marca Telas Real', value: 'primary' },
        ],
        layout: 'radio',
      },
      initialValue: 'red',
    }),
    defineField({
      name: 'urgencyShowProgressBar',
      title: 'Mostrar Barra de Progreso de Stock',
      type: 'boolean',
      group: 'urgency',
      initialValue: true,
    }),
    defineField({
      name: 'urgencyProgressPercent',
      title: 'Porcentaje de Stock Vendido (%)',
      type: 'number',
      group: 'urgency',
      initialValue: 85,
      validation: (Rule) => Rule.min(10).max(99),
      hidden: ({ parent }) => !parent?.urgencyShowProgressBar,
    }),

    // ==========================================
    // 3. CONFIGURACIÓN: POPUP 2 (NUEVAS PROMOS)
    // ==========================================
    defineField({
      name: 'promoMode',
      title: 'Modo de Funcionamiento (Nuevas Promos)',
      type: 'string',
      group: 'promo',
      description: 'Elige si deseas que tome automáticamente las promociones activas de la tienda o configurarlo manualmente.',
      options: {
        list: [
          { title: '⚡ Automático (Detecta ofertas activas en el catálogo)', value: 'auto' },
          { title: '✍️ Manual (Configurado 100% por el editor)', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'manual',
    }),

    // Promo - Modo Manual
    defineField({
      name: 'promoBadgeText',
      title: 'Etiqueta / Badge de Promo',
      type: 'string',
      group: 'promo',
      description: 'Ej: 10% OFF, NUEVA PROMO, OFERTA FLASH, LIQUIDACIÓN',
      initialValue: '15% OFF',
    }),
    defineField({
      name: 'promoTitle',
      title: 'Título de la Promoción',
      type: 'string',
      group: 'promo',
      description: 'Ej: ¡Descuento especial en tu primera compra!',
      initialValue: '¡Aprovecha nuestras nuevas promociones!',
    }),
    defineField({
      name: 'promoDescription',
      title: 'Descripción o Condiciones',
      type: 'text',
      rows: 3,
      group: 'promo',
      description: 'Texto explicativo, cupón de descuento o detalles de la promoción.',
      initialValue: 'Ingresa el cupón PROMOREAL al momento de pagar o descubre los textiles con precio especial hoy.',
    }),
    defineField({
      name: 'promoImage',
      title: 'Imagen de la Promoción',
      type: 'image',
      group: 'promo',
      options: { hotspot: true },
      description: 'Banner o foto atractiva de las telas en promoción.',
    }),
    defineField({
      name: 'promoButtonText',
      title: 'Texto del Botón',
      type: 'string',
      group: 'promo',
      initialValue: 'Ver Ofertas',
    }),
    defineField({
      name: 'promoButtonUrl',
      title: 'Enlace del Botón',
      type: 'string',
      group: 'promo',
      description: 'Ej: /tienda?categoria=ofertas o enlace directo.',
      initialValue: '/tienda',
    }),
    defineField({
      name: 'promoProduct',
      title: 'Producto Destacado en Promo (Opcional)',
      type: 'reference',
      to: [{ type: 'product' }],
      group: 'promo',
      description: 'Si seleccionas un producto, el botón y la imagen pueden vincularse directamente a él.',
    }),

    // Promo - Estilo
    defineField({
      name: 'promoDisplayType',
      title: 'Estilo de Visualización de Promos',
      type: 'string',
      group: 'promo',
      options: {
        list: [
          { title: '🪟 Modal Central con Imagen y Botón', value: 'modal' },
          { title: '📌 Tarjeta Flotante Esquina (Discreta y moderna)', value: 'floating-card' },
        ],
        layout: 'radio',
      },
      initialValue: 'modal',
    }),

    // ==========================================
    // 4. CONFIGURACIÓN DE FRECUENCIA Y TIEMPOS
    // ==========================================
    defineField({
      name: 'delaySeconds',
      title: 'Tiempo de espera para aparecer (Segundos)',
      type: 'number',
      group: 'timing',
      description: 'Segundos que transcurren tras cargar la página antes de mostrar el popup.',
      initialValue: 6,
      validation: (Rule) => Rule.min(1).max(120),
    }),
    defineField({
      name: 'displayFrequency',
      title: 'Frecuencia de Visualización',
      type: 'string',
      group: 'timing',
      description: 'Controla con qué frecuencia se muestra al mismo usuario.',
      options: {
        list: [
          { title: 'Una vez por sesión (Al cerrar, no vuelve a salir en esa sesión)', value: 'session' },
          { title: 'Una vez cada 24 horas', value: 'daily' },
          { title: 'En cada recarga / navegación (Siempre)', value: 'always' },
        ],
      },
      initialValue: 'session',
    }),
    defineField({
      name: 'position',
      title: 'Posición de las Tarjetas Flotantes',
      type: 'string',
      group: 'timing',
      options: {
        list: [
          { title: 'Abajo a la izquierda (Recomendado)', value: 'bottom-left' },
          { title: 'Abajo a la derecha', value: 'bottom-right' },
          { title: 'Abajo al centro', value: 'bottom-center' },
          { title: 'Arriba a la derecha', value: 'top-right' },
        ],
      },
      initialValue: 'bottom-left',
    }),
  ],
  preview: {
    select: {
      activePopup: 'activePopup',
      urgencyTitle: 'urgencyCustomTitle',
      promoTitle: 'promoTitle',
      urgencyProduct: 'urgencyProduct.title',
      promoProduct: 'promoProduct.title',
      urgencyImage: 'urgencyCustomImage',
      promoImage: 'promoImage',
    },
    prepare({ activePopup, urgencyTitle, promoTitle, urgencyProduct, promoProduct, urgencyImage, promoImage }) {
      if (activePopup === 'urgency') {
        return {
          title: `🔥 Urgencia: ${urgencyTitle || urgencyProduct || 'Agotamiento'}`,
          subtitle: '🟢 ACTIVO: Popup de Agotamiento de Productos',
          media: urgencyImage || Flame,
        }
      }
      if (activePopup === 'promo') {
        return {
          title: `🎉 Promo: ${promoTitle || promoProduct || 'Nuevas Promociones'}`,
          subtitle: '🟢 ACTIVO: Popup de Nuevas Promociones',
          media: promoImage || Tag,
        }
      }
      return {
        title: '🚫 Todos los Popups Desactivados',
        subtitle: 'Ningún popup se mostrará a los usuarios.',
        media: AlertCircle,
      }
    },
  },
})
