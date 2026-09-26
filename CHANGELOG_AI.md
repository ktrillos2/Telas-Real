# CHANGELOG AI - Telas Real

## [2026-09-26] - Fix Visual PQRS: Alineación y Renderizado del Selector de Tipo de Solicitud
- **Corrección de Overflow y Texto en Selector PQRS ([`components/pqr-form.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/pqr-form.tsx))**:
  - Se corrigió el desbordamiento en el disparador (`SelectTrigger`) del campo "Tipo de Solicitud (PQRS)", donde el título de la opción ("Petición") se salía verticalmente sobre el borde superior y la descripción multilinea colisionaba con `line-clamp-1` y `flex items-center`.
  - Solución:
    1. Se enlazó explícitamente el título de la opción seleccionada (`selectedTipoInfo?.title`) en `SelectValue`, garantizando que dentro del campo cerrado se muestre de forma limpia y perfectamente centrada en una sola línea, alineándose con el selector adyacente de Tienda/Canal.
    2. Se agregó `textValue={item.title}` a cada `SelectItem` para preservar la navegación por teclado (typeahead) y accesibilidad.
    3. Se eliminó la tarjeta redundante inferior con título duplicado y se reemplazó por la descripción explicativa en texto gris claro (`text-xs text-gray-400 mt-1 pl-0.5 leading-relaxed min-h-[32px]`), manteniendo una simetría vertical perfecta entre las dos columnas del formulario.

## [2026-09-25] - Checkout: Desactivación Temporal de Términos y Política de Datos
- **Fricción Cero en Checkout ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Se desactivaron y removieron de la vista los checkboxes obligatorios de *"He leído y acepto los términos y condiciones del sitio web"* y *"He leído y acepto la política de tratamiento de datos"*.
  - Se eliminaron las validaciones bloqueantes en `handleSubmit`, permitiendo que el cliente proceda directamente al pago sin requerir marcar dichas casillas.
  - Limpieza de estados y componentes UI huérfanos (`Checkbox`, `acceptTerms`, `acceptDataPolicy`).

## [2026-09-25] - Checkout: Eliminación de Barra de Confianza Inferior
- **Limpieza Visual ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Se eliminó la barra inferior con los distintivos "Compra segura", "Mejores precios" y "Envío rápido" para mantener el flujo de checkout completamente enfocado en la conversión, eliminando elementos redundantes al final de la página.
  - Limpieza de importaciones no utilizadas en `lucide-react`.

## [2026-09-25] - Fix Visual Checkout: Recorte de Badge Circular de Cantidad en Miniaturas
- **Corrección de Clipping por Overflow ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Se resolvió el bug donde el badge circular negro de cantidad (`item.quantity`) sobre la miniatura del producto quedaba cortado en su borde superior por la caja de scroll.
  - Causa del bug: El uso de coordenadas negativas relativas al marco de la foto dentro de un scroll container con `overflow-y-auto` provocaba que cualquier pixel proyectado hacia arriba o a la derecha fuera recortado con un corte horizontal plano al inicio del scroll.
  - Solución:
    1. Se implementó una capa de resguardo en la miniatura (`pt-1.5 pr-1.5`) para posicionar el badge en coordenadas seguras (`top-0 right-0 z-10`).
    2. Se expandió el padding del scroll container (`pt-2 pr-2 pb-1`) tanto en la versión móvil (`max-h-[340px]`) como de escritorio (`max-h-[380px]`).
    3. Se ajustó el padding horizontal del badge (`px-1.5`) y `ring-2 ring-white dark:ring-neutral-900` para garantizar círculos perfectos de 1 dígito y pastillas fluidas de 2 o más dígitos sin que ningún elemento visual sea recortado.


## [2026-09-25] - UI/UX Checkout & Carrito: Sustitución de Emojis por Iconos SVG Lucide React
- **Iconografía Unificada en Checkout ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Reemplazado emoji de camión `🚚` en el acordeón de envío por `<Truck className="w-4 h-4 text-primary shrink-0" />`.
  - Reemplazado emoji de boleto `🎟️` en el acordeón de cupón por `<Tag className="w-4 h-4 text-primary shrink-0" />`.
  - Reemplazado emoji de edificio `🏬` en el acordeón de retiro en tienda por `<Store className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />`.
  - Reemplazado emoji informativo `ℹ️` en las condiciones de pago contraentrega por `<Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />`.
  - Reemplazados emojis en la barra de confianza inferior (`🔒`, `✓`, `🚚`) por `<ShieldCheck className="w-4 h-4 text-primary shrink-0" />`, `<Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />` y `<Truck className="w-4 h-4 text-primary shrink-0" />`.
- **Iconografía en Carrito Lateral ([`components/cart-sidebar.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/cart-sidebar.tsx))**:
  - Eliminado emoji de hilo del texto y añadida la insignia vectorial `<Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />` en el banner de incentivo de combo.

## [2026-09-25] - Módulo Sanity: Promociones por Precio Fijo o Porcentaje, Rangos por Kilos y Campaña KI LOVERS (25 al 30 de Sep)
- **Esquema de Sanity Studio (`sanity/schemaTypes/eventSettings.ts`, `sanity/structure.ts`)**:
  - Habilitada la selección de **Modalidad de Descuento (`discountType`)**: permite elegir libremente entre **％ Porcentaje (%)** o **💲 Monto Fijo ($ COP)**.
  - Implementado sistema de **Mecánicas / Rangos de Descuento por Volumen (`tiers`)**:
    - Permite definir rangos en kilos (`minKg`, `maxKg`) con porcentaje o monto específico de descuento.
    - Soporte para mecánicas de combo (`requiresCombo`), vinculación de categorías complementarias (ej: `cat-hilos`) y cantidad mínima requerida (ej: 3 hilos).
  - Incluidos campos para el **Nombre de la Campaña (`campaignName`)** y **Términos y Condiciones completos (`termsAndConditions`)**.
  - Valores predeterminados configurados para la campaña oficial **KI LOVERS – Amor y Amistad (25 al 30 de Sep)**:
    - *KI LOVERS:* 3.5% de Dcto por compras de 1Kg a 10Kg de tela participante.
    - *KI LOVERS DUO:* 5% de Dcto por compras de 10Kg a 20Kg de tela participante + 3 hilos en cualquier color.
    - Telas participantes: Brush Standard, Brush Premium, Suavetina, Satín, Antifluido, Poly Licra, Seda de Mango (Unicolor y Sublimado).
    - T&C legales completos prellenados.
- **Motor de Descuentos en Tienda (`components/cart-sidebar.tsx`, `app/checkout/page.tsx`, `lib/contexts/HomeDataContext.tsx`)**:
  - Detección automática del peso en kilos de telas participantes en el carrito y conteo de unidades de hilos para validar el cumplimiento de las mecánicas y combos.
  - Cálculo dinámico del porcentaje de descuento sobre el subtotal de telas aplicables.
  - Mensaje inteligente de incentivo de compra (upsell) en el carrito cuando el cliente tiene entre 10 y 20 kg de tela para animarlo a agregar los 3 hilos y ganar el 5%.
  - Resumen del checkout y carrito sincronizados, exhibiendo el nombre de la mecánica (ej: `KI LOVERS (3.5%)` o `KI LOVERS DUO (5%)`) y los kg participantes.
- **Ficha de Producto (`app/producto/[slug]/ClientProductView.tsx`)**:
  - Banner dinámico que informa los beneficios de la campaña activa y los porcentajes de descuento vigentes sobre la referencia visualizada.

## [2026-09-25] - Checkout: Desaturación Visual, Acordeones de Envío y Cupón, Resumen Superior Móvil y Pasarelas Simplificadas
- **Resumen del Pedido Superior Móvil ("Estilo La Poción / Shopify") ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Implementada barra colapsable fijada en la parte superior en vista móvil (`lg:hidden`) con el total de compra en COP visible en todo momento.
  - Al expandir, despliega la lista de productos con miniatura y badge circular negro en la esquina de la foto con el contador numérico de metros/unidades (`item.quantity`), input de cupón de descuento con botón de aplicación inmediata, desglose de subtotales, envío y total general, junto al botón de acción `[ FINALIZAR COMPRA ]`.
- **Explicaciones en Desplegables Cerrados por Defecto ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - `🚚 Información sobre tu envío ⌄`: Agrupa la cotización aproximada del flete, el peso estimado del pedido en kg y las condiciones de despacho de Coordinadora Mercantil en un acordeón limpio con rotación de flecha chevron.
  - `🏬 Información sobre retiro en tienda ⌄`: Agrupa la dirección de la sede física Bogotá, horario continuo y requisitos de retiro.
  - `🎟️ ¿Tienes un cupón de descuento? ⌄`: Desplegable de cupón cerrado por defecto.
- **Simplificación de Pasarelas de Pago ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - **Pago en línea con Wompi:** Se eliminaron los 6 logos en imagen para dejar una tipografía sutil y limpia: `Nequi · Daviplata · Bancolombia · PSE · Visa · Mastercard`.
  - **Pago contraentrega:** Subtítulo `Efectivo al recibir`. Sus condiciones y advertencias particulares se muestran **exclusivamente cuando el usuario selecciona este método**, desapareciendo por completo si se elige Wompi.
- **Barra de Confianza Minimalista ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Se eliminaron las dos tarjetas pesadas inferiores ("Tu información" y "¿Por Qué Comprar Con Nosotros?") que sobrecargaban la página, sustituyéndolas por una barra horizontal limpia: `🔒 Compra segura · ✓ Mejores precios · 🚚 Envío rápido`.

## [2026-09-25] - PQRS: Clasificación de Solicitudes, 14 Tiendas y Generación de Radicado Automático
- **Módulo y Formulario PQRS ([`app/pqr/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/pqr/page.tsx), [`components/pqr-form.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/pqr-form.tsx), [`lib/pqr.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/pqr.ts))**:
  - Incorporada la casilla de selección del **Tipo de Solicitud (PQRS)** con 5 tipos oficiales y su descripción explicativa en letra gris clara:
    - *Petición:* Solicitud de información, documentos, aclaraciones o una gestión relacionada con nuestros productos o servicios.
    - *Queja:* Manifestación de inconformidad relacionada principalmente con la atención, el trato o el comportamiento recibido.
    - *Reclamo:* Solicitud de solución frente a un producto, servicio, cobro, entrega o compromiso que consideras incumplido o defectuoso.
    - *Sugerencia:* Propuesta o recomendación para mejorar un producto, servicio, proceso o forma de atención.
    - *Felicitación:* Reconocimiento a una persona, equipo, tienda, producto o experiencia positiva.
  - Incorporada la casilla de selección para las **14 tiendas y canales de atención**: *T1 E-commerce*, *T2 Tienda Alquería*, *T3 Tienda Cúcuta*, *T4 Tienda Alquería CAI*, *T5 Tienda Policarpa The Store*, *T6 Tienda Medellín*, *T7 Tienda Pereira*, *T8 Tienda Bucaramanga*, *T9 Tienda Policarpa*, *T10 Tienda Medellín The Showroom*, *T11 Tienda Barranquilla*, *T12 Tienda Cali*, *Tienda Cali Centro*, *T13 Tienda Pereira 2*.
  - Mensaje introductorio oficial incorporado en la página y en el formulario:
    > *"En Telas Real tu opinión es importante. A través de este formulario puedes registrar peticiones, quejas, reclamos, sugerencias o felicitaciones. Cada solicitud recibe un número de caso para facilitar su clasificación, seguimiento y trazabilidad."*
- **Generador de Número de Radicado Consecutivo Oficial ([`lib/pqr.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/pqr.ts), [`app/api/pqr/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/pqr/route.ts))**:
  - Implementado algoritmo determinista bajo la nomenclatura `{PREFIJO}{CONSECUTIVO_4_DIGITOS}-{AÑO}`:
    - Petición: Inicia en `P0001-2026`
    - Queja: Inicia en `Q0001-2026`
    - Reclamo: Inicia en `R0004-2026`
    - Sugerencia: Inicia en `S0001-2026`
    - Felicitación: Inicia en `F0001-2026`
  - Consulta automática contra Sanity para autoincrementar consecutivamente sin colisiones ni duplicados.
- **Pantalla de Confirmación y Notificación por Correo ([`components/pqr-form.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/pqr-form.tsx), [`components/emails/pqr-template.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/emails/pqr-template.tsx))**:
  - Al completar la solicitud, el usuario recibe una pantalla de confirmación interactiva con su número de caso asignado, botón de copiado rápido y resumen de datos.
  - La plantilla de correo de Resend incluye tarjeta destacada con el radicado, tipo de solicitud y tienda/canal de atención, enviando copia tanto a Servicio al Cliente como al correo del solicitante.
- **Esquema de Sanity Studio ([`sanity/schemaTypes/pqr.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/sanity/schemaTypes/pqr.ts))**:
  - Campos `radicado`, `tipo` y `tienda` agregados en modo solo lectura para auditoría y visualización directa en la lista de documentos de Sanity Studio.

## [2026-09-25] - Recogida en Tienda: Actualización de Horario de Atención (Lunes a Viernes de 8:30 AM a 5:30 PM)
- **Horario Oficial de Recogida ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx), [`app/confirmation/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/confirmation/page.tsx), [`components/email/order-receipt.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/email/order-receipt.tsx), [`components/store-locations.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/store-locations.tsx))**:
  - Actualizado el horario de atención para la opción "Recoger en Tienda - Bogotá Calle 12 # 38-65 Telas Real" a **Lunes a Viernes: 8:30 AM - 5:30 PM** en la constante `STORE_PICKUP_OPTION` y la tarjeta de aviso del checkout.
  - Sincronizado en la pantalla de confirmación post-compra (`/confirmation`), en el correo transaccional de confirmación de pedido (`order-receipt.tsx`) y en la lista de puntos de atención (`store-locations.tsx`).

## [2026-09-25] - Checkout: Actualización de Rango de Pago Contraentrega ($50.000 a $100.000 COP)
- **Umbral Mínimo y Máximo de Contraentrega / Pago en Tienda ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx), [`app/actions/order.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/actions/order.ts))**:
  - Se actualizó la constante `MIN_COD_AMOUNT` de $20.000 a **$50.000 COP**, manteniendo el tope máximo en **$100.000 COP**.
  - Los mensajes informativos de advertencia para Contraentrega y Retiro en Tienda ahora reflejan explícitamente el rango válido entre **$50.000** y **$100.000 COP** con separadores de miles de Colombia (`es-CO`).
  - Se añadió sincronización reactiva en checkout: si un usuario tiene preseleccionado COD y el total queda fuera del rango permitido ($50.000 - $100.000 COP), la pasarela se conmuta automáticamente a Wompi.
  - Validación reforzada al enviar el formulario en `handleSubmit` y validación defensiva en el servidor en `createOrder` para garantizar la integridad de las órdenes con método COD.

## [2026-09-24] - Navegación Móvil y Buscador: Botón Tienda en Barra Inferior y Animación Ultra Suave Down to Up
- **Navegación Móvil ([`components/mobile-nav.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/mobile-nav.tsx))**:
  - Reemplazado el cuarto elemento de la barra inferior móvil ("Mi cuenta") por el acceso directo a **"Tienda"** (`/tienda` con icono `Store`).
  - La barra móvil ahora cuenta con los accesos directos más frecuentados: **Inicio**, **Ofertas**, **Carrito**, **Tienda** y **Menú**.
  - **"Mi cuenta"** fue integrado elegantemente en la parte superior del drawer del **Menú** móvil, permitiendo acceso tanto para usuarios autenticados (con su nombre, email y enlace directo a `/cuenta`) como para usuarios sin sesión (tarjeta interactiva con disparador de inicio de sesión/registro).
- **Animación Suave Down to Up en Buscador Modal ([`app/globals.css`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/globals.css))**:
  - Actualizada la animación de apertura del buscador modal (`@keyframes search-modal-in`) para emerger fluidamente de abajo hacia arriba (`translate3d(0, 38px, 0) scale(0.982)` a `translate3d(0, 0, 0) scale(1)`) combinado con un suave desvanecimiento progresivo (`fade-in`).
  - Curva de desaceleración ultra fluida estilo Apple (`cubic-bezier(0.16, 1, 0.3, 1)`) en 0.42s y aceleración por GPU (`translate3d` y `will-change`), garantizando 60-120 FPS sin tirones en dispositivos móviles y de escritorio.
  - Sincronización armónica con el desenfoque del backdrop y los contenidos internos.

## [2026-09-24] - Detalle de Producto: Visualización del Ancho bajo el Precio
- **Ficha Técnica en Encabezado ([`app/producto/[slug]/ClientProductView.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/ClientProductView.tsx))**:
  - Incorporada la extracción dinámica del atributo `Ancho` (`anchoAttr`) desde los atributos del producto, de la variante o campos nativos.
  - Se añadió la viñeta `• Ancho: {ancho}` en la lista de especificaciones inmediatamente debajo del precio (junto a facturación en kilo, rendimiento y precio por kilo).
  - Si el producto tiene ancho definido, la lista se visualiza incluso si la tela no se vende por kilo.

## [2026-09-24] - Cabecera Móvil y Buscador: Logo a la Izquierda, Botón a la Derecha y Animación Spotlight
- **Diseño del Header Móvil ([`components/header.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/header.tsx))**:
  - En móviles (`lg:hidden`), se reemplazó la barra de búsqueda ancha por una barra balanceada con el logo de **Telas Real** a la izquierda y el botón circular de búsqueda con icono interactivo a la derecha.
  - Al pulsar el botón de búsqueda, se abre directamente el buscador modal.
  - Se mantiene el indicador de pulso sutil cuando hay una búsqueda activa.
- **Rediseño y Animación Suave del Buscador Modal ([`components/search-modal.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/search-modal.tsx), [`app/globals.css`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/globals.css))**:
  - **Fondo Glassmorphism**: Fondo oscuro semitraslúcido (`bg-slate-950/70`) con desenfoque dinámico (`backdrop-blur-md`) que se desvanece suavemente (`animate-search-backdrop`).
  - **Entrada Spotlight con Curva de Aceleración Apple**: La ventana de búsqueda flotante ahora desciende suavemente con escala sutil (`-24px scale(0.97)` a `0px scale(1)`) usando la curva `cubic-bezier(0.16, 1, 0.3, 1)`.
  - **Entrada Escalonada de Contenidos**: Las sugerencias de autocompletado, historial reciente y búsquedas populares se desvanecen con un ligero retraso de entrada (`0.06s`) para una sensación de fluidez y profundidad premium.
  - Soporte completo para accesibilidad y `prefers-reduced-motion`.

## [2026-09-24] - Catálogo y Tarjetas: Listado Individual de Productos y Eliminación de Badges de Color
- **Visualización Completa de Productos en Tienda ([`app/tienda/[[...slug]]/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/[[...slug]]/page.tsx), [`app/tienda/ClientTiendaPage.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/ClientTiendaPage.tsx), [`components/best-sellers.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/best-sellers.tsx), [`components/offers-carousel.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/offers-carousel.tsx), [`components/new-arrivals-carousel.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/new-arrivals-carousel.tsx), [`components/product-tabs.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-tabs.tsx))**:
  - En la lista de productos de `/tienda` y en los carruseles se muestran todos los productos tal cual existen en inventario (cada color como su propio ítem independiente con su foto y título real).
  - Al hacer clic o abrir cualquier producto de la tienda, el detalle (`/producto/[slug]`) se abre automáticamente con la familia completa de colores disponibles y con la **variación de color seleccionada** activa de inmediato.
- **Eliminación Definitiva de Badges de Cantidad de Colores ([`components/product-card.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-card.tsx), [`lib/unified-fabrics.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/unified-fabrics.ts))**:
  - Eliminados todos los badges que indicaban cantidad de colores (e.g. `9 COLORES`, `18 COLORES`, `50+ COLORES`) de las tarjetas de producto.
  - El badge "Más Vendido" ya no se combina con conteo de colores; se normalizó para decir estrictamente **"MÁS VENDIDO"** de forma limpia.
  - Filtro estricto en `ProductCard` que descarta cualquier badge textual que mencione colores o variantes.

## [2026-09-24] - Catálogo: Sidebar de Filtros Móviles Sobre Menú Inferior
- **Superposición y Acceso Directo de Filtros en Móvil ([`components/mobile-filters-sidebar.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/mobile-filters-sidebar.tsx))**:
  - **Jerarquía de Capas (Z-Index)**: Elevado el sidebar de filtros a `z-[70]` y su fondo traslúcido a `z-[60]`, garantizando que se desplieguen estrictamente por encima de la barra de navegación móvil inferior (`MobileNav` `z-50`), evitando que el menú tape el botón de acción.
  - **Footer Fijo / Pinned**: El botón "Aplicar Filtros" ahora se encuentra fijado en un contenedor inferior dedicado (`flex-shrink-0 border-t bg-background shadow-md`), con soporte para áreas seguras (`pb-[max(1rem,env(safe-area-inset-bottom))]`), manteniéndose visible y accesible en todo momento sin requerir desplazarse hasta el final del contenido.
  - **Bloqueo de Scroll de Fondo**: Se agregó bloqueo de desplazamiento (`document.body.style.overflow = "hidden"`) mientras los filtros están abiertos para una experiencia móvil fluida sin saltos de página.

## [2026-09-24] - Selector de Colores: Muestra Seleccionada Circular Fija e Inamovible
- **Optimización de Interacción en Selector de Variantes ([`app/producto/[slug]/ClientProductView.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/ClientProductView.tsx))**:
  - **Eliminado Bloqueo de Colores Adyacentes**: Se corrigió el comportamiento donde la muestra seleccionada permanecía expandida en forma de píldora horizontal permanente, lo cual cubría o perturbaba la visibilidad de los 2 o 3 colores vecinos en la grilla.
  - **Muestra Circular con Indicador de Selección**: El color seleccionado permanece como un círculo perfecto (`w-10 h-10`), resaltado nítidamente con anillo primario doble (`border-primary ring-2 ring-primary ring-offset-2 scale-105`) y un distintivo badge de verificación (`Check` blanco con sombra) en el centro de su miniatura.
  - **Expansión Flotante Exclusiva en Hover**: La píldora con el nombre del color ahora se expande como overlay flotante únicamente al pasar el cursor (`isHovered`), replegándose suavemente al salir, dejando el 100% de la paleta de colores siempre visible y estática.
  - **Información del Tono Activo en Encabezado**: El nombre del color seleccionado (ej. `Mostaza Picante [Disponible]`) se mantiene visible y destacado en la tarjeta superior inmediatamente encima de la paleta.

## [2026-09-24] - Tienda: Reducción y Optimización de Espaciados Verticales
- **Compactación de Secciones en Catálogo ([`app/tienda/ClientTiendaPage.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/ClientTiendaPage.tsx))**:
  - Reducido el padding vertical de la sección de Usos / Avatares de `py-8` con `pt-5 pb-5` a un espaciado equilibrado `py-3 md:py-4` y `py-1` interno.
  - Compactada la barra de categorías / subcategorías de `py-8` a `py-2.5 md:py-3.5`, ajustando la altura de los botones a `h-[46px] md:h-[54px]`.
  - Eliminado el padding excesivo `pb-16` (64px de espacio muerto) en la barra de botones móviles "Filtros" y "Ordenar por".
  - Reducido el padding superior de la sección de productos y del encabezado para un flujo visual continuo sin huecos en blanco.
  - Ocultado el banner/tarjeta de búsqueda activa en móviles (`hidden md:block`), maximizando el espacio de pantalla para el catálogo y productos.
  - Eliminadas las comillas en el término de búsqueda activo en la barra móvil del encabezado (`components/header.tsx`), mostrándose directamente el texto limpio.


- **Visualización Jerárquica en Tarjetas de Producto ([`components/product-card.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-card.tsx), [`components/blog/product-card-ref.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/blog/product-card-ref.tsx))**:
  - Detección y división automática del nombre de producto mediante el separador `|` (ej. `"Granito de Arroz Blanco X Metros | Tela Texturizada"`).
  - Título principal (`mainTitle`) mostrado como encabezado de la tarjeta con `line-clamp-1` y sin el corte abrupto del texto secundario.
  - Subtítulo posterior al `|` (`subtitle`, ej. `"Tela Texturizada"`) mostrado de forma pequeña y estilizada (`text-[11px] sm:text-xs text-muted-foreground font-normal`) justo debajo del título principal.
  - Eliminada la fila redundante de previsualización cromática bajo el título (mini círculos superpuestos y badge `X colores`), dejando la tarjeta más limpia y enfocada en el título, subtítulo y precio, mientras se conserva el badge principal en la imagen y el botón de paleta.
  - La vista detallada de producto (`/producto/[slug]`) se mantiene intacta según la instrucción expresa del usuario.

## [2026-09-24] - Selector de Colores: Superposición Flotante sin Desplazamiento de Grilla
- **Arquitectura de Ranura Fija y Superposición ([`app/producto/[slug]/ClientProductView.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/ClientProductView.tsx))**:
  - **Grilla Estática Inamovible**: Cada muestra de color se ubica en un contenedor con dimensiones fijas (`w-10 h-10 flex-shrink-0`), asegurando que la grilla de círculos permanezca completamente estática y ningún color se mueva o reordene al expandirse la palabra.
  - **Superposición Flotante (Overlay)**: El botón expandido se posiciona de forma absoluta (`absolute top-0 h-10 w-max z-20/z-40 shadow-md bg-background`), sobreponiéndose elegantemente por encima de los círculos adyacentes.
  - **Detección Dinámica de Borde (Expansión Inteligente)**: Mediante cálculo reactivo del espacio disponible respecto al contenedor (`spaceOnRight < 175`), si una muestra se encuentra cerca del borde derecho se expande hacia la izquierda (`right-0 flex-row-reverse`), garantizando que jamás se recorte ni provoque barras de desplazamiento horizontal.
  - **Transparencia de Eventos de Puntero**: El texto expandido de la variante seleccionada incluye `pointer-events-none` cuando no está en hover directo, permitiendo colocar el cursor o hacer clic directamente en cualquier círculo que se encuentre visualmente debajo sin bloqueo alguno.
  - **Accesibilidad y Foco**: Compatible con navegación por teclado (`onFocus`/`onBlur`, `focus-visible:ring-2`), soporte para `motion-reduce:transition-none` y compatibilidad táctil nativa en móviles.


- **Módulo Central de Historial y Autocompletado ([`lib/search-history.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/search-history.ts))**:
  - Implementadas funciones seguras con SSR para `localStorage` (`getSearchHistory`, `saveSearchHistory`, `removeSearchHistoryItem`, `clearSearchHistory`).
  - Límite de 8 búsquedas recientes con deduplicación insensible a mayúsculas y ordenamiento cronológico inverso (lo más reciente al principio).
  - Algoritmo de sugerencias de autocompletado en tiempo real `getAutocompleteSuggestions` basado en catálogo textil y búsquedas previas.
- **Buscador Modal Interactivo ([`components/search-modal.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/search-modal.tsx))**:
  - **Historial en LocalStorage**: Muestra sección "Búsquedas recientes" con ícono de reloj, eliminación individual por término y botón "Borrar historial".
  - **Sugerencias de Autocompletado**: Al escribir, despliega chips con sugerencias dinámicas de telas coincidentes que ejecutan la búsqueda al hacer clic.
  - **Persistencia de Término**: Mantiene la palabra en el input al presionar Enter o reabrir el buscador, permitiendo limpiar con botón `X` o buscar con botón dedicado.
- **Página de Catálogo y Banner de Búsqueda Activa ([`app/tienda/ClientTiendaPage.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/ClientTiendaPage.tsx))**:
  - Incorporada barra interactiva de búsqueda dentro del catálogo que mantiene visible el término buscado (`"{effectiveSearch}"`) y el conteo de telas encontradas.
  - Formulario integrado para refinar la búsqueda directamente desde la tienda o quitar el filtro mediante botón "Quitar búsqueda".
- **Indicador en Cabecera ([`components/header.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/header.tsx))**:
  - En móviles, el botón del buscador refleja el término activo actual (ej. `"{effectiveSearch}"` con badge "Búsqueda activa").
  - En escritorio, el ícono de búsqueda resalta cuando hay una consulta en curso y pre-carga la palabra en el modal.

- **Registro Centralizado de Telas Unificadas ([`lib/unified-fabrics.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/unified-fabrics.ts))**:
  - Arquitectura modular que consolida 14 familias de telas multicolor: Satín (18 colores), Wafer (12 colores), Seda de Mango (11 colores), Rib Pitillo (9 colores), Rib Tradicional (9 colores), Crepe Liviano (9 colores), Brush Standard (9 colores), Licra Deportiva (6 colores), Uvita (6 colores), Poly Licra (5 colores), Cartago (4 colores), Acetato (4 colores), Hilos de Coser 40/02 (12 colores) y Brush Piel de Durazno (50+ colores).
  - Funciones utilitarias exportadas: `findUnifiedFabricConfig`, `isMasterUnifiedSlug`, `getUnifiedProductData`, y `groupCatalogProducts`.
- **Ruta de Detalle de Producto Dinámica y SEO ([`app/producto/[slug]/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/page.tsx))**:
  - Resuelve tanto los slugs maestros (ej. `/producto/tela-satin-x-metros-elegante`) como cualquier URL histórica o individual de color (ej. `/producto/tela-satin-azul-rey-tela-elegante`).
  - Preselecciona automáticamente el tono correspondiente sin romper indexación previa en Google Search Console ni enlaces externos.
  - Generación de datos estructurados Schema.org `ProductGroup` con `hasVariant` y precios de oferta.
- **Vista Interactiva del Producto ([`app/producto/[slug]/ClientProductView.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/producto/[slug]/ClientProductView.tsx))**:
  - Réplica fiel de la experiencia de usuario de Brush: muestras circulares de tono, buscador en tiempo real, filtros por familia cromática, estado de stock por variante y sincronización de URL (`?color=...`) y `document.title`.
  - **Galería Móvil Táctil Swipe y Puntos de Paginación**: En dispositivos móviles, la galería principal permite deslizar las imágenes de lado a lado con el dedo (gesto táctil nativo con `scroll-snap` y `touch-pan-x`).
  - **Indicadores de Puntos Pequeños**: Incorporada píldora flotante con puntos pequeños ("dots") que señalan la cantidad de imágenes y la foto activa, con animación fluida y posibilidad de toque directo para saltar entre fotos.
  - Agregado al carrito y checkout 100% operativos con el producto real y su respectivo ID de Sanity.
- **Tarjetas de Producto Enriquecidas ([`components/product-card.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-card.tsx))**:
  - Soporte de propiedades `hasColorVariants`, `variantsCount` y `colorPreviewTones`.
  - Despliegue de badges dinámicos (ej. `18 COLORES`), mini previsualización de 5 puntos cromáticos y botón rápido con ícono `Palette` que guía fluidamente a la elección de color.
- **Agrupación en Tienda y Carousels ([`app/tienda/[[...slug]]/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/[[...slug]]/page.tsx), [`app/tienda/ClientTiendaPage.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/tienda/ClientTiendaPage.tsx), [`components/offers-carousel.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/offers-carousel.tsx), [`components/best-sellers.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/best-sellers.tsx), [`components/product-tabs.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/product-tabs.tsx), [`components/new-arrivals-carousel.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/new-arrivals-carousel.tsx))**:
  - Aplicación de `groupCatalogProducts` que reduce la saturación del catálogo de ~196 items repetidos a una vista limpia y curada de ~60 productos destacados con selector de color integrado.
- **Sitemap XML ([`app/sitemap.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/sitemap.ts))**:
  - Incorporadas todas las URLs maestras unificadas con prioridad alta (0.9) para maximizar la indexación en motores de búsqueda.

## [2026-09-24] - Implementación de Opción "Recoger en Tienda" (Bogotá Calle 12 # 38-65)
- **Selector de Método de Entrega en Checkout ([`app/checkout/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/checkout/page.tsx))**:
  - Incorporadas tarjetas interactivas de selección entre **Envío a Domicilio** (Coordinadora) y **Recoger en Tienda** (`OPCIÓN - RECOGER EN TIENDA - BOGOTÁ CALLE 12 # 38-65 Telas Real`).
  - Al seleccionar retiro en tienda:
    - Se omite la cotización automática de Coordinadora y el costo de flete es estrictamente $0 COP (Gratis).
    - Se ocultan los campos innecesarios de dirección domiciliaria, departamento, ciudad y código postal.
    - Se muestra la tarjeta informativa oficial con dirección de recogida, horario de atención (Lunes a Sábado: 8:00 AM - 6:00 PM) y campo opcional para autorizar a un tercero a retirar el pedido.
    - El método de pago en efectivo se adapta a "Pagar en Tienda al Retirar" y el botón de acción cambia a "CONFIRMAR PEDIDO PARA RETIRO".
    - Cumplimiento estricto con la jerarquía semántica (H1 único `Finalizar Compra`, Regla 6) y micro-interacciones fluidas.
- **Acciones del Servidor y Persistencia en Sanity ([`app/actions/order.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/actions/order.ts) y [`sanity/schemaTypes/order.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/sanity/schemaTypes/order.ts))**:
  - Campos `deliveryMethod` (`'shipping' | 'pickup'`) y `notes` incorporados al esquema de Sanity y al tipado de pedidos.
  - En `createOrder` y `saveDraftCheckout`, cuando el pedido es para retiro en tienda, se asigna `shippingProvider: 'pickup'`, `carrier: 'Recoger en Tienda (Bogotá Calle 12 # 38-65)'`, `shippingCost: 0` y la dirección física de la sede central en Bogotá.
  - `getOrderDetails` expone `deliveryMethod`, `carrier`, `shippingCost` y `notes` hacia la página de confirmación.
- **Página de Confirmación Post-Pago ([`app/confirmation/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/confirmation/page.tsx))**:
  - Mensajes de estado adaptados para indicar al cliente que sus telas serán alistadas para recoger en la sede de Bogotá.
  - Resumen de orden muestra línea de "Recoger en Tienda - $0 COP (Gratis)".
  - Ficha de información muestra la tarjeta verde destacada con el punto oficial de retiro y recordatorio de notificación.
- **Plantillas de Correo Electrónico y Sincronización Wompi ([`components/email/order-receipt.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/email/order-receipt.tsx), [`components/email/admin-order-notification.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/email/admin-order-notification.tsx), [`lib/email-notifications.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/email-notifications.ts), [`lib/wompi-sync.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/wompi-sync.ts))**:
  - Los correos a cliente y a administración indican explícitamente cuando el pedido es para retiro en tienda, omitiendo el cálculo de flete de Coordinadora y detallando el punto físico.
- **Microservicio WhatsApp Bot ([`lib/whatsapp/service.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/whatsapp/service.ts) y [`services/whatsapp-bot/templates.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/templates.mjs))**:
  - La plantilla `ORDER_CONFIRMATION` reconoce dinámicamente si el pedido es para retiro en tienda y muestra "🏬 Punto de Recogida: Calle 12 # 38-65, Bogotá" en vez de dirección de envío domiciliario.
- **Actualización de Ubicaciones ([`components/store-locations.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/store-locations.tsx))**:
  - Dirección central actualizada a "Calle 12 # 38-65, Bogotá".

## [2026-09-21] - Optimización de Subida Streaming y Notificación Visual de PQR Multimedia
- **Endpoint de Streaming Directo a Sanity CDN ([`app/api/pqr/upload/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/pqr/upload/route.ts))**:
  - Implementado endpoint dedicado para transferencia binaria directa (`duplex: 'half'`) hacia Sanity CDN, eliminando la sobrecarga de memoria en Node.js y resolviendo el error `TypeError: Failed to parse body as FormData` con archivos grandes (>5 MB - 50 MB).
  - Soporta videos de hasta 50 MB (MP4, MOV, WEBM) y fotos/documentos de hasta 15 MB con sanitización estricta de nombres y detección automática de tipo MIME.
- **Ruta Principal de Registro PQR ([`app/api/pqr/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/pqr/route.ts))**:
  - Soporte de payload JSON optimizado con referencias de activos ya subidos, además de fallback para `multipart/form-data`.
  - Uso de cliente de escritura dedicado con `useCdn: false` y token administrativo para garantizar consistencia y persistencia inmediata en Sanity.
  - Renderizado HTML robusto mediante `@react-email/render` para compatibilidad total con React 19 y Next.js 15, evitando fallos en Resend.
- **Formulario PQR Reactivo ([`components/pqr-form.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/pqr-form.tsx))**:
  - Flujo de subida individual progresivo con indicador de estado dinámico en vivo (ej. `Subiendo video (1 de 2)...`).
  - Limpieza segura de URLs de objeto y reseteo completo del estado al culminar con éxito.
- **Plantilla de Correo Enriquecida ([`components/emails/pqr-template.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/components/emails/pqr-template.tsx))**:
  - Previsualización gráfica embebida de imágenes (`<Img>`) en el cuerpo del correo con enlace a alta resolución.
  - Tarjetas de video distintivas con botón de reproducción directa en el navegador desde el CDN de Sanity.
- **Panel de PQR en Sanity Studio ([`sanity/structure.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/sanity/structure.ts) y [`sanity/schemaTypes/pqr.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/sanity/schemaTypes/pqr.ts))**:
  - Incorporada la sección `PQR (Atención al Cliente)` en el menú principal del Studio con icono descriptivo y listado ordenado cronológicamente por fecha de radicación.
  - Campos enriquecidos para gestión de solicitudes: estado de atención (`🟡 Pendiente de Revisión`, `🔵 En Proceso`, `🟢 Resuelto`, `🔴 Cerrado`), visor de evidencias multimedia (fotos, videos y PDFs) y campo de notas internas para el equipo de SAC.
  - Destinatario configurable por entorno (`PQR_NOTIFICATION_EMAIL` / `ADMIN_EMAIL`) con fallback al correo oficial `sac@telasreal.com`.

## [2026-09-21] - Soporte de Múltiples Imágenes y Videos en Sistema PQR
- **Esquema de Sanity (`sanity/schemaTypes/pqr.ts`)**:
  - Se agregó el campo `evidencias` como array de archivos (`type: 'array', of: [{ type: 'file' }]`) con soporte para imágenes (`image/*`), videos (`video/*`) y documentos (`.pdf`).
  - Se mantuvo el campo `evidencia` original para retrocompatibilidad con registros históricos en Sanity.
- **Formulario Interactivo PQR (`components/pqr-form.tsx`)**:
  - Reemplazado el input estático de un solo archivo por un módulo de carga múltiple con soporte para arrastrar y soltar (Drag & Drop), explorador nativo y selección de múltiples archivos.
  - Validación dinámica por tipo de archivo: fotos (JPG, PNG, WEBP), videos (MP4, MOV, WEBM) y documentos (PDF).
  - Límites de tamaño: hasta 50 MB por video y 15 MB por imagen o PDF, permitiendo hasta 10 archivos en total por solicitud.
  - Previsualización en tiempo real: miniaturas reales para fotos, reproductor/badge de video con ícono de película para videos y tarjeta con formato y peso.
  - Botón de eliminación individual con animación suave y limpieza de Object URLs para evitar fugas de memoria.
- **Procesamiento y Almacenamiento en CDN (`app/api/pqr/route.ts`)**:
  - Soporte de subida concurrente y sanitización de nombres de archivo a Sanity CDN (`client.assets.upload('file', ...)`).
  - Almacenamiento estructurado de referencias en el documento `pqr` en Sanity.
  - Cómputo inteligente de adjuntos para correo: los archivos con peso total seguro (<12 MB) se adjuntan directamente en Resend, y todos los archivos sin excepción se proporcionan con enlaces directos de descarga y visualización en alta definición desde el CDN de Sanity.
- **Plantilla de Correo Electrónico (`components/emails/pqr-template.tsx`)**:
  - Lista estructurada de evidencias con identificación visual (íconos, tipo de evidencia, nombre del archivo, tamaño formateado) y botón de descarga directa para el equipo de Servicio al Cliente (SAC).

## [2026-09-21] - Corrección de Sincronización QR de WhatsApp en Despliegue (Railway)
- **Fijación de Versión Remota (`webVersionCache`) y User-Agent ([`services/whatsapp-bot/index.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/index.mjs))**:
  - Se configuró `webVersionCache` apuntando a `wppconnect-team/wa-version` remoto para evitar que Puppeteer cargue versiones experimentales de WhatsApp Web que rompen la detección interna de autenticación.
  - Se agregó un User-Agent realista de Chrome de escritorio en los argumentos de Puppeteer para prevenir bloqueos o congelamientos durante la carga en entornos Linux/Docker.
  - Se implementó el listener para el evento `loading_screen`, registrando el porcentaje exacto de descarga de chats y actualizando de inmediato el estado del bot a `AUTHENTICATED` para limpiar el QR en cuanto el celular lo lee.
  - Se hizo configurable la ruta de autenticación mediante `process.env.WWEBJS_AUTH_PATH || './.wwebjs_auth'` para soportar volúmenes persistentes en Railway/Render.
- **Prevención de Caché en Vercel/Next.js ([`app/api/whatsapp/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/whatsapp/route.ts))**:
  - Se forzó la ruta como dinámica (`export const dynamic = 'force-dynamic'`, `export const revalidate = 0`).
  - Se agregaron encabezados HTTP `Cache-Control: no-store, no-cache, must-revalidate` para garantizar que el panel de administración consulte siempre el estado en vivo del microservicio sin recibir datos obsoletos desde el CDN de Vercel.
- **Retroalimentación Visual en Panel Admin ([`app/admin/whatsapp/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/admin/whatsapp/page.tsx))**:
  - Se añadió la tarjeta visual del estado `AUTHENTICATED` ("¡Código escaneado! Sincronizando chats...") con indicador animado, evitando que el usuario vuelva a ver el QR o un mensaje genérico de reinicio mientras WhatsApp Web termina de sincronizarse.

## [2026-09-17] - Simplificación Minimalista del Panel Admin WhatsApp
- **Diseño Concentrado en QR y Estado ([`app/admin/whatsapp/page.tsx`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/admin/whatsapp/page.tsx))**:
  - Se eliminaron todas las secciones no solicitadas (tarjetas de plantillas, previsualizaciones de mensajes, banners explicativos y tablas de historial).
  - Si el bot no está conectado, la pantalla muestra exclusivamente una tarjeta centrada con el **código QR** e instrucciones de escaneo.
  - Si el bot ya está conectado, la pantalla muestra exclusivamente el **estado de conexión activo (`🟢 WhatsApp Conectado`)**, el número vinculado y el botón de **🔌 Desconectarse**.
- **Endpoint de Desconexión Remota ([`services/whatsapp-bot/index.mjs`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/services/whatsapp-bot/index.mjs), [`lib/whatsapp/service.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/lib/whatsapp/service.ts) y [`app/api/whatsapp/route.ts`](file:///Users/keynerstebantri/Desktop/Trabajos/Telas-Real/app/api/whatsapp/route.ts))**:
  - Implementado `POST /logout` en el microservicio para cerrar la sesión activa de WhatsApp Web de forma limpia y generar un nuevo código QR inmediatamente.
  - Eliminado el bloqueo artificial 403 que impedía el acceso en producción a `/api/whatsapp`.

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
