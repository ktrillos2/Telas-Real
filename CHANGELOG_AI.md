# CHANGELOG AI - Telas Real

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
