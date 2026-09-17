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
- `/`: Página principal (hero, categorías, ofertas, productos destacados).
- `/tienda`: Catálogo general de productos y telas con filtros por categoría y búsqueda.
- `/producto/[slug]`: Detalle del producto, variantes, calculadora de metraje y compra.
- `/personalizado`: Sublimación personalizada y asistente de diseño de telas.
- `/checkout`: Proceso de pago unificado (Pasarela Wompi con firma sha256 y Contraentrega con validación DANE y cotizador Coordinadora).
- `/confirmation`: Pantalla de verificación y confirmación de estado de pedido post-pago.
- `/pqr`: Sistema de atención al cliente y PQRS.
- `/not-found`: Página de error 404 personalizada con mascota textil e interactividad.

## 💳 Pasarelas y Métodos de Pago
- **Wompi Bancolombia:** Widget Checkout v1 oficial (tarjetas de crédito, PSE, Nequi, Bancolombia a la Mano).
- **Pago Contraentrega (COD):** Disponible para montos entre $20.000 y $500.000 COP con generación de pedido 'processing' en Sanity y reserva de stock.

## 🎨 Sistema de Agrupación de Variaciones (Telas con múltiples colores)
- **Tela Brush (Piel de Durazno):** Productos de Sanity unificados en un único producto padre (`/producto/tela-brush-piel-de-durazno`), con selector dinámico de color, buscador de tonos, filtros por familia de color, SEO individualizado (`?color=...`) y meta-etiquetas de geolocalización (GEO Colombia). Las variaciones agotadas (`stockStatus == 'outOfStock'`) se filtran automáticamente tanto en servidor como en cliente para mostrar únicamente tonos con disponibilidad real para despacho inmediato. Los slugs individuales agotados resuelven de forma transparente a variantes con stock disponible sin bloquear la compra.

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

