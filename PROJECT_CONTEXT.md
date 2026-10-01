# Project Context - Telas Real

## 📌 Descripción General
Telas Real es una plataforma de comercio electrónico líder en Colombia para la venta de telas por metro, textiles de moda, telas deportivas, sublimación personalizada e insumos de confección.

## 🛠️ Stack Tecnológico
- **Framework:** Next.js 15 (App Router, React 19)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4, tw-animate-css, Radix UI primitives
- **CMS / Base de Datos:** Sanity.io (Groq queries, Sanity Live)
- **Tipografía:** Questrial (Google Fonts)
- **Iconos:** Lucide React

## 📄 Estructura Clave de Rutas
- `/`: Página principal (hero banners interactivos con enlace de redirección opcional en todo el banner y soporte de swipe móvil nativo, categorías, ofertas, productos destacados).
- `/tienda`: Catálogo general de productos y telas con filtros por categoría, búsqueda y drawer móvil de filtros (`MobileFiltersSidebar`, `z-[70]`) con footer fijado por encima del menú de navegación inferior.
- `/producto/[slug]`: Detalle del producto, variantes, especificaciones técnicas (ancho, rendimiento, facturación en kilo), calculadora de metraje y compra.
- `/personalizado`: Sublimación personalizada y asistente de diseño de telas.
- `/checkout`: Proceso de pago unificado y des-saturado con diseño de alta conversión:
  1. **Resumen de Pedido Superior Móvil (Estilo La Poción / Shopify):** Barra colapsable superior con total COP visible, lista de ítems con miniaturas y badge de cantidad circular íntegro (sin cortes por overflow), campo de cupón y botón de pago directo.
  2. **Explicaciones en Acordeón:** Información de envío (`Información sobre tu envío ⌄` con icono `<Truck />`, cotización aproximada, peso estimado y condiciones de Coordinadora) y de retiro (`Información sobre retiro en tienda ⌄` con icono `<Store />`) en desplegables cerrados por defecto para eliminar saturación visual.
  3. **Cupón Colapsable:** `¿Tienes un cupón de descuento? ⌄` con icono `<Tag />`, cerrado por defecto.
  4. **Pasarelas Limpias:** Wompi sin logos de imágenes (texto limpio: `Nequi · Daviplata · Bancolombia · PSE · Visa · Mastercard`) y Pago Contraentrega con condiciones particulares que se despliegan **únicamente al seleccionar dicho método**.
- `/confirmation`: Pantalla de verificación y confirmación de estado de pedido post-pago, detallando dirección de entrega o punto físico de recogida según la modalidad elegida.
- `/pqr`: Sistema de atención al cliente y PQRS con clasificación por tipo de solicitud (Petición, Queja, Reclamo, Sugerencia, Felicitación con descripciones explicativas y selector responsive adaptado al ancho del trigger sin desbordamientos), selector de 14 tiendas y canales de atención, asignación automática de número de radicado consecutivo oficial (`P0001-2026`, `R0004-2026`, etc.), soporte multi-archivo (múltiples fotos, videos de hasta 50MB y documentos PDF) alojados en Sanity CDN, notificados con número de radicado vía Resend y gestionados desde el panel administrativo de Sanity Studio (`/admin`).
- `/not-found`: Página de error 404 personalizada con mascota textil e interactividad.

## 💳 Pasarelas y Métodos de Pago
- **Pago Contraentrega (COD):** Disponible exclusivamente para envíos a domicilio en montos entre $50.000 y $100.000 COP con generación de pedido 'processing' en Sanity y reserva de stock.
- **Recoger en Tienda Física:** Exclusivo pago en línea (Wompi Bancolombia / Nequi / PSE / Tarjetas) para garantizar la separación, corte y alistamiento de las telas antes del retiro. No admite pago contraentrega ni en tienda al retirar.

## 🔎 Sistema de Búsqueda Inteligente (Historial, Autocompletado y Persistencia)
- **Historial en LocalStorage (`lib/search-history.ts`):** Guarda automáticamente las consultas en `localStorage` con deduplicación y límite de 8 búsquedas recientes. Muestra la sección "Búsquedas recientes" con opción de eliminar ítems individuales o limpiar historial.
- **Autocompletado en Tiempo Real:** Sugiere términos clave de telas y categorías al escribir con chips interactivos (`getAutocompleteSuggestions`), combinados con resultados de Sanity en vivo con imágenes y precios.
- **Persistencia de Búsqueda:** Al presionar Enter, el término se conserva dentro del input del buscador y se muestra un banner/barra interactiva en `/tienda` con el texto exacto buscado, botón para modificar la búsqueda y botón para quitar el filtro.
- **Acceso en Móvil y Animación Spotlight (`components/header.tsx`, `components/search-modal.tsx`, `app/globals.css`):** En móviles, la cabecera muestra el logo a la izquierda y el botón de búsqueda a la derecha. El modal se despliega con animación fluida down-to-up ultra suave (`translate3d(0, 38px, 0)` a `0` con fade in, curva Apple `cubic-bezier(0.16, 1, 0.3, 1)` y aceleración por GPU).
- **Navegación Móvil Inferior (`components/mobile-nav.tsx`):** Barra fija de 5 botones: Inicio, Ofertas, Carrito, **Tienda** (acceso directo prioritario) y Menú. El acceso a "Mi Cuenta" se ubica en el encabezado del drawer de menú móvil, permitiendo acceso al perfil de usuario o disparador de inicio de sesión.

## 🎨 Sistema de Agrupación de Variaciones (Telas con múltiples colores)
- **Registro Centralizado (`lib/unified-fabrics.ts`)**: Mapea y unifica 14 familias de telas multicolor:
  1. `brush` (Tela Brush Piel de Durazno - 50+ colores)
  2. `satin` (Tela Satín X Metros | Tela Elegante - 18 colores)
  3. `wafer` (Tela Wafer X Metros | Tela Galleta - 12 colores)
  4. `seda-de-mango` (Tela Seda de Mango X Metros - 11 colores)
  5. `rib-pitillo` (Tela Rib Pitillo X Metros Acanalada - 9 colores)
  6. `rib` (Tela Rib X Metros Acanalada - 9 colores)
  7. `crepe` (Tela Crepe X Metros Liviana - 9 colores)
  8. `brush-standard` (Tela Brush Standard X Metros - 9 colores)
  9. `licra-deportiva` (Tela Licra Deportiva X Metros - 6 colores)
  10. `uvita` (Tela Uvita X Metros Burda - 6 colores)
  11. `poly-licra` (Tela Poly Licra X Metros - 5 colores)
  12. `cartago` (Tela Cartago X Metros Burda - 4 colores)
  13. `acetato` (Tela Acetato X Metros - 4 colores)
  14. `hilos` (Hilo de Coser 40/02 - 12 colores)
- **Experiencia de Usuario Idéntica a Brush**: Selector dinámico de muestras circulares (swatches) con ranuras fijas inamovibles (`w-10 h-10 flex-shrink-0`). La opción seleccionada permanece como círculo con doble anillo distintivo y badge de `Check`, dejando todos los colores adyacentes 100% visibles e inamovibles. El nombre del color seleccionado se exhibe en el encabezado superior y la píldora se expande como superposición flotante (`overlay absolute top-0`) únicamente al pasar el cursor (hover), con expansión inteligente hacia la izquierda en bordes derechos (`expandLeft`), buscador de tono en vivo, filtros rápidos por familias de color (Azules, Rojos, Neutros, etc.), cambio dinámico de imagen/precio/stock, y actualización de URL (`?color=...`) y `document.title`.
- **Preservación Total de SEO y Enlaces**: Navegación directa a cualquier URL de color individual (e.g. `/producto/tela-satin-azul-rey-tela-elegante`) resuelve de forma transparente en la vista unificada con dicho tono preseleccionado. El esquema JSON-LD genera `ProductGroup` con `hasVariant` para rich snippets en Google.
- **Listado Completo e Individual en Catálogo (`/tienda` y Carruseles)**: Cada producto y color se exhibe individualmente con su imagen y título específico. Al hacer clic o abrir cualquier producto, se abre la vista del producto con la variación de color seleccionada preseleccionada automáticamente y con el selector de toda la familia de tonos disponible. Las tarjetas de producto no muestran badges de cantidad de colores (e.g. `9 COLORES`) y el badge "Más Vendido" no se combina con conteos, manteniéndose estrictamente como `MÁS VENDIDO`.
- **Jerarquía de Nombres en Cards (`components/product-card.tsx`)**: Detección automática del caracter `|` en los nombres de producto. Muestra el título principal en el encabezado de la tarjeta y el texto posterior al `|` como subtítulo pequeño (`text-[11px] sm:text-xs text-muted-foreground`), mientras que la vista detallada de producto (`/producto/[slug]`) conserva su presentación completa original.
- **Sitemap XML (`app/sitemap.ts`)**: Incluye todas las rutas maestras de telas unificadas con prioridad alta (0.9).

## 🏭 Sistema ERP y Seguimiento Mayorista Textil (Sanity + Google Sheets)
- **Motor Matemático Central (`lib/wholesale/fabricCalculator.ts`):** Función pura `calculateFabricProgress()` que calcula metros cumplidos (`mt = kg * rendimiento`), faltantes en KG/MT/dinero, porcentaje y estado `SI`/`NO`. El frontend nunca calcula métricas; sólo envía `{ clienteId, mes, kgCumplido }`.
- **Rendimiento Centralizado (`sanity/schemaTypes/fabricSettings.ts`):** Singleton `fabricSettings` (`rendimientoKgMetro: 3.3`).
- **Entidades Desacopladas (`sanity/schemaTypes/clienteMayorista.ts`):** Separa empresa (`clienteMayorista`) de usuarios individuales (`user.clienteMayorista`), permitiendo múltiples contactos por empresa (portal B2B).
- **Sincronización Bidireccional:**
  - `/api/sync/sanity-to-google`: Propaga cambios desde Studio o Webhook hacia Google Apps Script con columnas `ID_CLIENTE`, `ID_SANITY`, `UPDATED_AT`, `MES_NUMERO`.
  - `/api/sync/google-to-sanity`: Sincroniza cambios desde Google Sheets a Sanity con detección de cambios y resolución de conflictos.
  - **Auditoría (`sanity/schemaTypes/syncHistory.ts`):** Registro inmutable de cada sincronización, origen, valores anterior/nuevo y cálculos.
- **Componente Personalizado Sanity (`sanity/components/WholesaleProgressEditor.tsx`):** Editor reactivo en tiempo real con selector de mes y edición de KG entregados con métricas solo lectura.
- **Portal de Clientes (`app/mayorista/page.tsx`):** Vista cliente mayorista que consulta los datos ERP de la empresa asignada a la sesión del usuario.

## 🤖 Automatización WhatsApp Bot (Puppeteer + whatsapp-web.js)
- **Servicio Bot (`services/whatsapp-bot/index.mjs`):** Microservicio HTTP en puerto 3005 con persistencia de sesión (`.wwebjs_auth`).
- **Plantillas y Eventos:**
  - `ORDER_CONFIRMATION`: Disparado automáticamente al aprobar pago Wompi (`lib/wompi-sync.ts`) o al crear orden COD (`app/actions/order.ts`).
  - `ORDER_DISPATCH`: Disparado al pasar pedido a `shipped` con guía y link de Coordinadora.
  - `SATISFACTION_SURVEY`: Disparado al marcar pedido como `delivered` con formato numérico limpio del 1 al 5 (sin enlaces externos).
  - Auto-respuestas inteligentes con calificación (1 a 5, estrellas o palabras de satisfacción) y menú en `services/whatsapp-bot/bot-replies.mjs`.
- **Envíos en Entorno Local:** En local, cualquier pedido envía directamente el WhatsApp al número telefónico especificado en el pedido (`shippingAddress.phone`), registrándolo automáticamente para permitir interacción con el bot.
- **Arquitectura de Producción:**
  - Next.js corre en **Vercel** (Serverless).
  - El bot corre desacoplado como microservicio persistente 24/7 (en **Railway**, **Render** o **VPS** con `Dockerfile.whatsapp`) para mantener viva la sesión de Chromium/Puppeteer.
  - Vercel se comunica con el bot vía `WHATSAPP_BOT_URL`. En producción se fija `WHATSAPP_TEST_MODE=false`.
  - El enlace de consulta de pedido redirige a `/confirmation?orderId={orderNumber}&status=APPROVED`.

## 🏷️ Sistema de Promociones y Descuentos Dinámicos (Precio o Porcentaje / Rangos y Combos)
- **Esquema Central Sanity (`sanity/schemaTypes/eventSettings.ts`):**
  - Modalidad de descuento seleccionable: **Precio Fijo ($ COP)** o **Porcentaje (%)**.
  - Unidad de referencia seleccionable: **Kilogramo (kg)** o **Metro lineal**.
  - Soporte de **Mecánicas / Rangos de Descuento por Volumen (Tiers)**:
    - Permite configurar tiers por rango de kilos (ej: 1 a 10 kg con 3.5% de Dcto; 10 a 20 kg con 5% de Dcto).
    - Soporte para combos con categorías complementarias (ej: requiere 3 hilos de cualquier color para desbloquear la mecánica superior).
    - Campo de **Términos y Condiciones (T&C)** enriquecido y editable desde el panel administrativo.
- **Cálculo y Visualización en Carrito y Checkout (`components/cart-sidebar.tsx`, `app/checkout/page.tsx`, `app/producto/[slug]/ClientProductView.tsx`):**
  - Detección precisa de telas participantes (Brush, Suavetina, Satín, Antifluido, Poly Licra, Seda Mango) y conteo de insumos combo (Hilos).
  - Cálculo automático y transparente del subtotal de telas y el beneficio porcentual aplicable.
  - Mensajes de upsell inteligentes en el carrito para incentivar la compra de combo y subir el ticket promedio (e.g. *"Agrega X hilos para obtener el 5% de descuento en tus telas"*).
  - Resumen de checkout sincronizado con desglose del nombre de la mecánica y los kilos participantes.

