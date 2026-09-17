# CHANGELOG AI - Telas Real

## [2026-09-17] - Encuesta de Satisfacción en WhatsApp sin Enlaces (Respuesta Numérica 1 a 5)
- **Eliminación de Enlaces wa.me en Plantilla de Encuesta ([`services/whatsapp-bot/templates.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/templates.mjs))**:
  - Se eliminaron todos los enlaces largos (`https://wa.me/...`) que hacían ver el mensaje sobrecargado y poco estético.
  - Se rediseñó la plantilla `SATISFACTION_SURVEY` con una presentación limpia y directa que invita al cliente a responder simplemente con un número del 1 al 5 en el chat:
    - `*5* ⭐⭐⭐⭐⭐ Excelente`
    - `*4* ⭐⭐⭐⭐ Muy buena`
    - `*3* ⭐⭐⭐ Buena`
    - `*2* ⭐⭐ Regular`
    - `*1* ⭐ Mala`
- **Reconocimiento Inteligente y Contexto de Respuestas ([`services/whatsapp-bot/bot-replies.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/bot-replies.mjs) y [`services/whatsapp-bot/index.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/index.mjs))**:
  - Implementado `registerSurveySent` para rastrear los números a los que se les ha despachado la encuesta (tanto en `/send` como en `/test`).
  - El bot reconoce la respuesta con dígitos simples (`1`, `2`, `3`, `4`, `5`), estrellas emoji (`⭐⭐⭐⭐⭐`), o palabras clave (`excelente`, `buena`, etc.) y genera la respuesta de agradecimiento personalizada según la calificación.
  - Se separó el contexto del menú principal del contexto de calificación para evitar colisiones entre las opciones 1 a 5 del menú de atención y los puntajes de la encuesta.

## [2026-09-17] - Corrección de Enlace de Redirección de Pedido en WhatsApp
- **Enlace de Seguimiento en Plantilla de WhatsApp ([`services/whatsapp-bot/templates.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/templates.mjs) y [`lib/whatsapp/service.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/whatsapp/service.ts))**:
  - Se corrigió el enlace del pedido en la plantilla `ORDER_CONFIRMATION` que apuntaba a `/orders/${orderNumber}` (ruta 404 inexistente).
  - Ahora redirige de forma transparente a la pantalla de confirmación oficial con los parámetros correctos:
    - Pagos aprobados: `${siteUrl}/confirmation?orderId=${orderNumber}&status=APPROVED`
    - Contraentrega (COD): `${siteUrl}/confirmation?orderId=${orderNumber}&status=PROCESSING&payment_method=cod`
  - La pantalla de confirmación carga automáticamente los detalles del pedido, artículos, dirección, transportadora y estado desde Sanity.
- **Filtrado Estricto de Variaciones en Servidor ([`app/producto/[slug]/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/page.tsx))**:
  - En la consulta GROQ y en el mapeo de productos unificados (Brush, Satín), se añadieron los filtros `stockStatus != "outOfStock" && stock_status != "outofstock"` tanto en la base de datos como en memoria.
  - Las variaciones sin stock dejan de cargarse por completo en `colorVariants`, evitando opciones deshabilitadas o con tachado `✕`.
  - La variante inicial seleccionada (`targetVariant`) ahora resuelve exclusivamente hacia una variante con existencias disponibles, incluso si un cliente accede directamente a la URL de un slug o color agotado.
  - El badge superior y las descripciones del producto ahora calculan dinámicamente el número real de colores disponibles para despacho inmediato.
- **Selector de Colores y Swatches ([`app/producto/[slug]/ClientProductView.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/ClientProductView.tsx))**:
  - `inStockColorVariants`: Filtra y garantiza que solo se muestren variaciones disponibles para compra.
  - **Diseño de Muestras Circulares Redondas (`rounded-full`) sin Espacios Blancos**:
    - Las muestras no seleccionadas ahora son **círculos perfectos** (`h-10 w-10 rounded-full`), eliminando por completo cualquier espacio en blanco residual. La foto de la tela cubre la totalidad del círculo de borde a borde.
    - Al pasar el cursor (hover) o al estar seleccionada, el círculo se expande suavemente hacia la derecha en una píldora estilizada revelando el nombre del color con animación fluida (*slide right*).
    - Se aumentó la separación visual entre la miniatura circular y el texto del nombre (`pl-3.5 pr-4.5`, `max-w-[220px]`).
    - Se aumentó el tamaño de letra de las variantes a `text-sm font-semibold` (14px) en los botones y `text-lg` en el encabezado de selección, ofreciendo una lectura mucho más clara, destacada y cómoda en cualquier dispositivo.
    - La variante activa permanece expandida con su nombre y el borde de color primario.
  - El encabezado de la sección ahora incluye una miniatura con la textura real del color seleccionado.
  - Las familias de tonos disponibles (`availableToneFamilies`) y la búsqueda por texto solo consideran variaciones con existencias activas.
  - Eliminados los estados visuales de agotado (`✕`, bordes punteados, baja opacidad) en la cuadrícula de muestras; todos los botones son completamente interactivos y permiten añadir al carrito y comprar de inmediato.
  - El contador de la sección ahora refleja con precisión los colores disponibles (ej. `32 colores disponibles`).

## [2026-09-17] - Rediseño Premium de la Plantilla de Correo de Pedido Confirmado
- **Header con Logo Oficial**:
  - Incorporado el logotipo oficial de alta resolución de Telas Real (`https://www.telasreal.com/images/design-mode/image.png`) con enlace a la web principal y subtítulo de marca.
- **Estructura y Organización Visual Mejorada ([`components/email/order-receipt.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/email/order-receipt.tsx))**:
  - Encabezado con barra de acento superior según el estado de la orden (verde esmeralda para pagos aprobados, ámbar para contraentrega, azul para despachos).
  - Insignia de estado destacada (`✓ PAGO APROBADO`, `✓ PEDIDO CONTRAENTREGA CONFIRMADO`).
  - Tarjeta resumen de metadatos (No. de Pedido, Fecha, Método de Pago y Estado).
  - Tabla de productos refinada con miniaturas de telas, cantidades de metraje, etiquetas de diseño/personalizado y precios alineados.
  - Tarjeta de desglose económico (Subtotal, Flete estimado de Coordinadora, Total COP).
  - Bloque logístico de 2 columnas: Dirección completa de entrega con teléfono y datos de transportadora (Coordinadora) con número de guía.
  - Botón principal de seguimiento del pedido en cuenta.
  - Barra de soporte directo con enlace dinámico a WhatsApp oficial con mensaje pre-rellenado.
  - Bloque de garantías y confianza (Envíos asegurados, calidad textil, compra segura).
  - Footer corporativo con copyright dinámico (`new Date().getFullYear()`) y firma obligatoria "Desarrollado por K&T ♥" con enlace a `https://www.kytcode.lat`.
- **Soporte de Metadatos en el Despacho ([`lib/email-notifications.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/email-notifications.ts))**:
  - Propagación de ciudad, departamento, transportadora y títulos legibles de métodos de pago.

## [2026-09-17] - Automatización de Notificaciones WhatsApp en Compras Wompi y Envíos Locales
- **Envíos Directos al Celular del Pedido en Local**:
  - Modificado [`services/whatsapp-bot/index.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/index.mjs) para que respete el número celular colocado en cualquier pedido de prueba local (`payload.phone`), enviando el mensaje directamente al celular del cliente sin forzar la redirección al teléfono de prueba.
  - Implementado `registerAllowedRecipient` en [`services/whatsapp-bot/bot-replies.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/bot-replies.mjs) para que cualquier número al que se le envíe un pedido pueda interactuar y recibir respuestas automáticas del bot.
- **Integración de WhatsApp en Pagos Wompi**:
  - En [`lib/wompi-sync.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/wompi-sync.ts), agregado el disparo de `notifyOrderConfirmationViaWhatsApp` cuando Wompi aprueba el pago, garantizando que los pedidos pagados con tarjeta/PSE reciban WhatsApp de confirmación.
  - En [`app/actions/order.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/actions/order.ts), agregado respaldo para no omitir WhatsApp si el pedido ya fue marcado como pagado por el webhook.
  - Agregado timeout defensivo de 8s en `sendMessage` y 12s en `fetch` para evitar bloqueos por acuse de recibo.

## [2026-09-17] - Limpieza de Sombras y Fondos en Imagen de Página 404
- **Página de Error 404 ([`app/not-found.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/not-found.tsx))**:
  - Eliminado el efecto de sombra `drop-shadow-xl sm:drop-shadow-2xl` sobre la imagen del camaleón y el rollo de tela, permitiendo una visualización limpia e integrada con el lienzo.
  - Eliminada la sombra ovalada inferior de suelo (`animate-shadow-breathe`).
  - Retirados los resplandores de fondo coloreados (`bg-emerald-400/10` y `bg-amber-200/15`) para garantizar un fondo blanco puro y nítido.
  - Fondo de la sección normalizado a `bg-white dark:bg-zinc-950`.

## [2026-09-17] - Corrección de Bucle de Carga al Hacer Clic en el Logo del Header
- **Problema Solucionado**:
  - Al hacer clic en el logo del header cuando el usuario ya se encontraba en la página de inicio (`/`), Next.js App Router desencadenaba una navegación redundante con petición RSC (`revalidate: 0`), causando que el navegador y el carrusel hero se quedaran en un estado de carga continua / bucle de carga giratorio.
- **Header Desktop ([`components/header.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/header.tsx))**:
  - Implementado manejador dedicado `handleLogoClick` que verifica `pathname === '/'`:
    - Si el usuario ya está en el inicio, ejecuta `e.preventDefault()` y realiza un scroll suave hacia arriba (`window.scrollTo({ top: 0, behavior: 'smooth' })`), eliminando por completo cualquier petición de red o bucle de recarga.
    - Si el usuario viene de otra página, ejecuta la navegación hacia `/` sin prefetch innecesario (`prefetch={false}`).
- **Barra Móvil ([`components/mobile-nav.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/mobile-nav.tsx))**:
  - Aplicada la misma lógica en el botón "Inicio": si ya está en `/`, previene recarga y hace scroll suave a la parte superior.
- **Hero Carousel ([`components/hero-carousel.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/hero-carousel.tsx))**:
  - Implementada memoria caché en memoria (`cachedHeroBanners`) a nivel de módulo: en navegaciones subsecuentes o retornos al inicio, los banners se presentan instantáneamente sin retrasos ni ruedas de carga.
  - Sustituido el spinner giratorio invasivo por un placeholder skeleton elegante con pulso suave.
- **Skeletons y Streaming en Inicio ([`app/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/page.tsx) y [`components/product-tabs-skeleton.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-tabs-skeleton.tsx))**:
  - Integrado `<Suspense>` con fallback skeleton para el bloque de productos, permitiendo un streaming instantáneo de la cabecera e inicio.
  - Reemplazado el spinner de carga en `ProductTabsSkeleton` por tarjetas skeleton modernas con efecto pulso.

- **Ruta `/mayorista` ([`app/mayorista/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/mayorista/page.tsx))**:
  - Desactivada temporalmente en la web pública mediante `notFound()`.
  - Respaldo completo de la lógica ERP preservado en [`app/mayorista/page.tsx.bak`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/mayorista/page.tsx.bak) para reactivación inmediata cuando se requiera.
- **Navegación y Enlaces Públicos Limpios**:
  - Encabezado ([`components/header.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/header.tsx)): Enlace del icono de usuario normalizado directamente hacia `/cuenta`.
  - Barra Móvil ([`components/mobile-nav.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/mobile-nav.tsx)): Icono de usuario normalizado con enlace `/cuenta` y etiqueta "Mi cuenta".
  - Login ([`app/login/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/login/page.tsx) y [`components/auth-drawer.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/auth-drawer.tsx)): Desactivada la redirección automática hacia `/mayorista`, enviando a los usuarios a `/cuenta`.
  - Mi Cuenta ([`app/cuenta/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/cuenta/page.tsx)): Desactivada la redirección forzada y oculto el botón "Panel Mayorista".
- **Backend y Sanity Studio Intactos**:
  - Todas las herramientas administrativas, esquemas de Sanity (`clienteMayorista`, `fabricSettings`, `syncHistory`) y APIs de sincronización bidireccional continúan listas en el backend para cuando se active nuevamente el portal al público.

## [2026-09-17] - Desactivación Temporal de Página de Políticas
- **Ruta `/politicas` ([`app/politicas/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/politicas/page.tsx))**:
  - Desactivada temporalmente invocando `notFound()`.
  - Respaldo íntegro preservado en [`app/politicas/page.tsx.bak`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/politicas/page.tsx.bak) para reactivación o actualización futura.
- **Navegación y Enlaces Limpios**:
  - Retirados enlaces a políticas en [`components/footer.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/footer.tsx).
  - Eliminados enlaces muertos en casillas de verificación de checkout ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx)) y formulario B2B ([`components/forms/b2b-form.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/forms/b2b-form.tsx)).
  - Retiradas las rutas de políticas en [`app/sitemap.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/sitemap.ts) para evitar errores 404 en motores de búsqueda (SEO).
  - Redireccionadas rutas `/privacidad` y `/terminos` hacia `/` en [`next.config.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/next.config.mjs).

## [2026-09-17] - Refactorización Integral ERP Mayorista y Sincronización Bidireccional Sanity <-> Google Sheets

### Añadido y Arquitectura Implementada
- **Motor Matemático Central Puro (`lib/wholesale/fabricCalculator.ts`)**:
  - Implementación de `calculateFabricProgress({ objetivoKg, kgCumplido, rendimiento, precioKg })`.
  - Cálculo estricto de reglas de negocio:
    - Metros cumplidos: $mt = kg \times rendimiento$ (ej: $400 \times 3.3 = 1320$ MT).
    - Faltante KG: $\max(0, objetivoKg - kgCumplido)$ (ej: $684.5 - 400 = 284.5$ KG).
    - Faltante Metros: $faltanteKg \times rendimiento$ (ej: $284.5 \times 3.3 = 938.85$ MT).
    - Cumplimiento: `SI` cuando $kgCumplido \ge objetivoKg$, de lo contrario `NO`.
    - Eliminación de dependencias del frontend: la interfaz solo envía `{ clienteId, mes, kgCumplido }`.
- **Configuración Global de Rendimiento Textil (`sanity/schemaTypes/fabricSettings.ts`)**:
  - Documento singleton en Sanity con `rendimientoKgMetro: 3.3`, `precioKgDefault: 37950` y `precioMtDefault: 11500`.
  - Centraliza el rendimiento textil para todos los clientes sin duplicar valores.
- **Entidad Maestra `clienteMayorista` (`sanity/schemaTypes/clienteMayorista.ts`)**:
  - Desacoplamiento de la empresa y sus cuentas de usuario (soporte multi-usuario por cliente corporativo).
  - Estructura con `nombre`, `codigoCliente`, `nit`, `objetivoMensual`, `acuerdoPrecio`, `meses` y usuarios asociados vía `references`.
  - Enriquecido con el componente personalizado de edición rápida `WholesaleProgressEditor`.
- **Auditoría e Historial de Sincronización (`sanity/schemaTypes/syncHistory.ts`)**:
  - Registro inmutable de cada cambio: fecha, cliente, mes, año, origen (`sanity` | `google_sheets`), valor anterior, valor nuevo, métricas calculadas y estado (`exitoso` | `conflicto` | `error`).
- **Componente Personalizado en Sanity Studio (`sanity/components/WholesaleProgressEditor.tsx`)**:
  - Vista integrada en Studio con selector de mes/año, objetivo mensual (solo lectura), campo editable de **KG Entregados** y cálculos automáticos reactivos en tiempo real (Metros, Faltante KG, Faltante MT, Dinero, Cumplimiento SI/NO) con botón de guardado y feedback interactivo.
- **Servicio Centralizado (`lib/wholesale/wholesaleService.ts`)**:
  - `getFabricSettings()`: Consulta de rendimiento en Sanity.
  - `updateClientProgress()`: Lógica central para actualizar meses, generar registros de auditoría y despachar actualizaciones a Google Sheets.
  - `syncGoogleSheet()`: Envío formateado hacia Google Apps Script.
- **Rutas API de Sincronización Bidireccional**:
  - `/api/sync/sanity-to-google`: Recibe actualizaciones desde Sanity Studio o webhooks y las propaga a Google Sheets.
  - `/api/sync/google-to-sanity`: Lee el libro de Google Sheets, detecta cambios, ejecuta `calculateFabricProgress()`, genera historial en `syncHistory` y actualiza Sanity en lotes.
- **Google Apps Script Sincronizador (`public/drive-scripts/mayoristas-sync.js`)**:
  - Soporte de columnas internas de identificación: `ID_CLIENTE`, `ID_SANITY`, `UPDATED_AT`, `MES_NUMERO`.
- **Estructura del Desk en Sanity (`sanity/structure.ts`)**:
  - Nuevo grupo **Gestión Mayorista (ERP)** con accesos directos a Clientes Mayoristas, Configuración Textil Global e Historial de Sincronización.
- **Portal del Cliente Mayorista (`app/mayorista/page.tsx`)**:
  - Adaptación para consultar la entidad corporativa `clienteMayorista` vinculada al usuario autenticado, mostrando cuota en tiempo real calculada exclusivamente por el backend.

## [2026-09-17] - Automatización Integral de WhatsApp (Persistencia QR, Modo Pruebas Local y Notificaciones por Estado)

### Añadido y Mejorado
- **Persistencia de Sesión con Código QR Escaneado 1 Sola Vez**:
  - Se eliminó la causa raíz que forzaba re-escanear el código QR (bloqueos zombi de Chrome `SingletonLock`, `SingletonCookie`, `SingletonSocket`).
  - Se implementó `cleanResidualSessionLocks()` en `services/whatsapp-bot/index.mjs` que purga automáticamente bloqueos residuales antes de inicializar Puppeteer.
  - Se configuró `LocalAuth` con `clientId: 'session'` fijo y flags de aislamiento estables para Chromium.
  - Se añadió cierre limpio y sincronizado (`handleShutdown`) en señales `SIGINT` y `SIGTERM` para que Chrome preserve las cookies en disco al apagarse el bot.
- **Protección de Privacidad y Restricción a Entorno Local**:
  - El panel de control [`app/admin/whatsapp/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/admin/whatsapp/page.tsx) y la ruta API [`app/api/whatsapp/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/whatsapp/route.ts) ahora detectan si la petición proviene de producción y bloquean el acceso mostrando una pantalla segura de bloqueo (403 Forbidden). El panel de pruebas solo es accesible en `localhost:3000`.
- **Modo de Prueba Seguro (`WHATSAPP_TEST_MODE=true`)**:
  - Todo mensaje generado por compras o cambios de estado es interceptado automáticamente y reenviado al teléfono de pruebas (`WHATSAPP_TEST_PHONE=3014453123`).
  - Se incluye el encabezado de seguridad `🧪 [MODO PRUEBA LOCAL - Destino Original: +57 {teléfono} ({cliente})]`, imposibilitando mensajes accidentales a clientes reales mientras se prueba.
- **Disparadores Automáticos por Estado del Pedido**:
  - **Compra Confirmada**: Dispara `ORDER_CONFIRMATION` al pagar por Wompi (`status: 'paid'`) o crear pedido Contraentrega (`status: 'processing'`) en [`app/actions/order.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/actions/order.ts).
  - **Pedido Enviado**: Dispara `ORDER_DISPATCH` con transportadora (**Coordinadora Mercantil**), número de guía (`trackingNumber`) y enlace de rastreo en tiempo real cuando el pedido pasa a `shipped` tanto desde código como desde [`SalesDashboard.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/sanity/components/SalesDashboard.tsx).
  - **Pedido Completado**: Dispara `SATISFACTION_SURVEY` con mensaje de agradecimiento y encuesta interactiva al pasar a `delivered`.
- **Encuesta Interactiva 1-Toque (Sin necesidad de teclear)**:
  - Se adaptó la plantilla de encuesta con enlaces de acción directa `wa.me` para cada nivel de estrellas (1 a 5), permitiendo al cliente calificar con 1 solo toque desde su celular.
  - El bot procesa la respuesta en `services/whatsapp-bot/bot-replies.mjs` y responde automáticamente agradeciendo la puntuación.
- **Endpoint API Dedicado (`app/api/orders/notify-whatsapp/route.ts`)**:
  - Nuevo endpoint para invocar, reenviar o actualizar guías de rastreo de pedidos y despachar WhatsApp al instante.
- **Campos en Schema de Sanity (`sanity/schemaTypes/order.ts`)**:
  - Agregados `carrier` (Transportadora), `trackingNumber` (Número de Guía Coordinadora) y banderas de auditoría de envío WhatsApp.

## [2026-09-17] - Ajuste Responsive y Ampliación de Tipografía en Cotizador de Envíos (Checkout)

### Mejorado
- **Tipografía y Legibilidad en Cotización de Envío Coordinadora (`app/checkout/page.tsx`)**:
  - Se aumentó el tamaño de fuente de la cabecera a `text-[15px] sm:text-base font-bold`, con icono `Truck` de 20px (`w-5 h-5`).
  - Subtítulo ampliado de `text-[11px]` a `text-xs sm:text-sm` ("Cotización aproximada · Pago al recibir").
  - Tiempo de entrega estimado ampliado a `text-xs sm:text-sm font-medium` con icono `Clock` en tono esmeralda accesible.
  - Precio estimado de envío ampliado de `text-sm` a `text-base sm:text-lg font-bold`.
  - Etiqueta "Valor aproximado" agrandada de `text-[10px]` a `text-xs font-semibold px-2.5 py-0.5 rounded-full`.
  - Cuadro informativo azul explicativo ampliado de `text-[11px]` a `text-xs sm:text-sm leading-relaxed`, con icono de paquete alineado superior y destacados en negrita clara para "Cotizador de envío:" y "No se cobra en este pedido".
  - Ampliadas notas de pie de cálculo de peso y advertencias de flete a `text-xs`.
- **Diseño Adaptativo Móvil (Vista Cel)**:
  - Se desacopló la fila rígida horizontal que comprimía el título contra el precio en pantallas estrechas (`<400px`).
  - En móviles, el bloque ahora adopta una disposición fluida en columna con una barra de precio y distintivo espaciada (`bg-muted/40 p-2.5 rounded-xl`), manteniendo en desktop la distribución lateral compacta (`sm:flex-col sm:items-end sm:bg-transparent`).

## [2026-09-17] - Unificación de Productos Brush con Variaciones de Color, SEO y GEO

### Añadido
- **Unificación de Catálogo Brush (`app/producto/[slug]/page.tsx`)**:
  - Unificación de **52 productos individuales de Brush (Piel de Durazno)** en 1 solo producto padre navegable en `/producto/tela-brush-piel-de-durazno` (y alias `/producto/tela-brush-colores-prueba`).
  - Resolución inversa transparente: Cualquier acceso a los 52 slugs individuales de cada color (ej. `/producto/tela-brush-negro-colombia`) resuelve automáticamente en la vista unificada con dicho color preseleccionado, preservando al 100% el posicionamiento previo en Google.
- **Optimización de SEO Dinámico por Variación**:
  - `generateMetadata` dinámico según la variación activa (`?color=...`), con títulos y descripciones individualizados por tono textil.
  - Generación de datos estructurados Schema.org `ProductGroup` y `hasVariant` con colección de `Product` y `Offer` por variación.
  - Canónicas inteligentes hacia la variación activa.
- **Optimización GEO para Colombia**:
  - Meta-etiquetas de geolocalización nacional (`geo.region: CO`, `geo.placename: Colombia`, coordenadas ICBM).
  - Schema.org con `areaServed` para Colombia y logística Coordinadora.
  - Banner interactivo de confianza GEO en la ficha de producto con mención a cobertura en Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Pereira y más de 1.100 municipios.
- **Selector Avanzado de Variaciones de Color (`ClientProductView.tsx`)**:
  - Buscador reactivo en vivo de tonos (ej: "Negro", "Lila", "Menta").
  - Píldoras de filtro por familias de color (Azules, Rojos/Rosados, Verdes, Amarillos/Cálidos, Neutros/Medios, Oscuros, Neón, Morados).
  - Indicadores visuales de stock por tono (Disponible vs Agotado).
  - Actualización sin recarga de URL en el navegador (`window.history.replaceState`) para compartir enlaces directos a colores específicos.
  - Sincronización real con el carrito de compras: cada variante añade al carrito su ID original de Sanity para completar pagos con Wompi o Contraentrega.

## [2026-09-17] - Corrección Urgente de Checkout y Desbloqueo de Pagos (Wompi y Contraentrega)

### Corregido
- **Desbloqueo de Botón de Pago en Móviles y Desktop (`app/checkout/page.tsx`)**:
  - Se eliminó el bloqueo rígido `disabled={!acceptTerms || !acceptDataPolicy}` que inhabilitaba la interacción (`pointer-events-none`) sin explicarle al usuario la causa en dispositivos táctiles.
  - Los términos y política de datos ahora vienen marcados (`true`) por defecto para reducir la fricción en el funnel.
  - Si un usuario desmarca las casillas e intenta pagar, el sistema ya no se queda congelado: dispara un `toast` informativo y realiza auto-scroll suave directo a la casilla correspondiente.
- **Eliminación de Error Silencioso de Validación Radix UI Select**:
  - Se retiró el atributo `required` nativo de los componentes `<Select>` de Departamento y Ciudad que inyectaba inputs ocultos inalcanzables (`An invalid form control with name='' is not focusable`), provocando que el navegador abortara el envío silenciosamente.
  - Se implementó validación programática amigable campo por campo con feedback visual vía `sonner` (`toast.error`) y enfoque automático al campo faltante.
- **Carga Asíncrona Resiliente de Pasarela Wompi**:
  - Función `ensureWompiLoaded()` para garantizar que `WidgetCheckout` esté disponible antes de invocar la apertura del modal, eliminando errores de red intermitentes.
  - Saneamiento estricto de teléfono móvil (`cleanPhone`: 10 dígitos colombianos sin código internacional duplicado) y documento de identidad (`cleanDoc`: alfanumérico) requeridos por el widget de Wompi.
  - Prevención de desorientación de usuario: se eliminó el scroll forzado a la cabecera al pulsar pagar y se corrigió el cierre del modal de Wompi (si el usuario cierra el modal sin pagar, no es redirigido a confirmación vacía, sino que permanece en el checkout con un aviso claro).
  - Liberación segura de banderas de estado (`isTransactionProcessing.current` e `isLoading`) en todos los bloques `finally` para impedir que el botón quede bloqueado permanentemente tras un reintento.
- **Umbral de Pago Contraentrega**:
  - Se redujo el monto mínimo de Contraentrega de $50.000 a $20.000 COP para permitir pedidos comunes de pocas unidades o metraje accesible.

## [2026-09-17] - Rediseño de Página de Error 404 con Mascota Textil

### Añadido
- **Componente `components/not-found-search.tsx`**: Barra de búsqueda interactiva cliente para recuperación inmediata de usuarios extraviados en la página 404.
- **Animaciones en `app/globals.css`**: Keyframes `.animate-float-gentle` y `.animate-shadow-breathe` con soporte estricto a accesibilidad `@media (prefers-reduced-motion: reduce)`.
- **`PROJECT_CONTEXT.md`**: Documento de contexto del proyecto según directrices globales.

### Modificado
- **`app/not-found.tsx`**:
  - Implementación de la imagen 3D de la mascota camaleón descansando sobre el rollo de tela (`public/404.png`).
  - Estructuración responsiva optimizada: Grid de 2 columnas para PC y flujo vertical armónico para pantallas móviles.
  - Corrección de semántica HTML5 (uso de `<section>` en lugar de `<main>` anidado dentro de `RootLayout`).
  - Jerarquía estricta de encabezados con un único `<h1>` para SEO.
  - Inclusión de metadata de página para SEO.
  - Píldoras de navegación rápida con scroll horizontal táctil en móviles.
- **`app/producto/[slug]/not-found.tsx`**:
  - Corrección semántica del contenedor principal a `<section>`.
