# Mejoras SEO, GEO y medición — Telas Real

Documento de referencia de los cambios aplicados en octubre de 2026. Se entregó en dos tandas:

- **Tanda 1** (PR #1, fusionado el 21/10/2026): tareas del tablero SEO/GEO.
- **Tanda 2** (PR #2): comparación con Casatextil y auditoría de la medición en GA4.

> Nada de esto se probó contra los datos reales de Sanity ni en producción (el entorno de trabajo no tenía acceso). Se validó con TypeScript y con `next build`. Revisar en un preview o en producción con la lista de verificación del final.

---

## 1. Comparación con Casatextil

Casatextil aparece primero sobre todo por dos motivos: tiene **muchas páginas que responden a búsquedas concretas** (por textura, uso, color o material) y **envía su catálogo a Google Merchant Center**. El parámetro `srsltid` de su URL lo genera Merchant Center. Ese parámetro también aparece en la URL de Telas Real, así que **las dos tiendas ya compiten en las fichas de producto de Google**.

| Aspecto | Casatextil | Telas Real antes | Telas Real ahora |
|---|---|---|---|
| Páginas por búsqueda específica | Categorías por textura, uso, color y material | Categorías con título "Tienda", H1 "Nuestra Tienda" y canonical a `/tienda` | Categoría con canonical propia, título "Telas X por Metro en Colombia", H1 y texto introductorio. **Nuevas landings por uso** en `/usos/<uso>` |
| robots.txt | Sin bloqueos de recursos | Bloqueaba `/_next/` (CSS y JS) para Googlebot | Desbloqueado |
| URLs de producto | Una ficha con variantes | URLs por color (200) y ficha agrupada al mismo tiempo, y el sitemap con las URLs antiguas | La URL antigua por color redirige con 301 a `ficha?color=`. Sitemap y enlaces internos usan la URL canónica |
| Datos estructurados | Product, Offer, AggregateRating, BreadcrumbList | ProductGroup con variantes | Además: BreadcrumbList con categoría, envío, devoluciones, `material`, FAQPage, CollectionPage e ItemList en las categorías |
| Ficha técnica | Composición %, gramaje, ancho | Ancho y composición | Gramaje (dato o estimado) y cuidados. **La composición en % debe cargarse en Sanity** |
| Precio metro / kilo | — | "$12.400 /metro" junto a "Facturación en kilo · $28.000/kilo" (confuso) | Se aclara que el precio por kilo aplica a rollo cerrado y mayoristas, y que en la web se paga por metro |
| Imágenes | — | Varios `alt` con nombre de archivo | `alt` descriptivo automático cuando el guardado parece un nombre de archivo |
| Productos relacionados | Alternativas de la misma familia | Los 7 más recientes, sin relación con la tela | Prioriza la misma categoría y excluye los otros colores de la misma tela |
| Reseñas | Visibles y en el schema | Sistema de reseñas listo (se agrega al schema cuando hay reseñas aprobadas) | Igual. **Falta conseguir reseñas reales** |

**Lo que no depende del código:**
- Cargar en Sanity la composición en %, el gramaje y los cuidados (atributos `Composición`, `Gramaje`, `Cuidados`).
- Escribir `seoTitle`, `seoDescription` y `description` para las categorías principales (Rib, Rib Pitillo, Antifluido…). Si están vacíos, se usan textos genéricos.
- Pedir reseñas a los clientes.
- Revisar Merchant Center: diagnósticos, productos rechazados y ofertas gratuitas.
- Comparar consultas equivalentes. "Rib algodón" no es la misma tela que "Rib pitillo" (poliéster/spandex).

---

## 2. Auditoría de GA4 (caída de vistas e ingresos)

No hubo acceso a GA4. El diagnóstico sale del código y del historial de commits.

### Hallazgos

1. **Las compras contraentrega no llegaban a GA4 ni a Meta.** El evento `purchase` solo se enviaba con estado `APPROVED` (Wompi). Los pedidos contraentrega llegan a `/confirmation` con estado `PROCESSING` y nunca se registraban. Los ingresos de GA4 eran solo los de pagos con Wompi. **Corregido.**
2. **Riesgo de compras con valor $0 o de otro pedido.** El evento podía dispararse antes de cargar el pedido, o con un `lastOrder` viejo de `localStorage`. Después, la deduplicación impedía corregirlo. **Corregido:** ahora espera a tener el valor y a que el pedido coincida con el de la URL.
3. **`page_path` mal formado en las vistas.** Se construía como `pathname + searchParams` sin el `?`, por ejemplo `/tiendacategoria=rib`. Eso ensucia los informes de páginas. **Corregido.**
4. **Vista inicial duplicada en Meta Pixel.** Se enviaba `PageView` en el script de inicio y otra vez al montar el componente. **Corregido:** el componente ahora solo mide cambios de ruta.
5. **Lectura de los datos del periodo (06/10–19/10):**
   - Las sesiones bajaron 2,6 %, pero las vistas bajaron 14,6 %. Cada sesión ve menos páginas (≈4,0 → 3,5). Es un cambio de navegación, no de tráfico.
   - El 08/10 cambiaron las tarjetas de producto: carrusel de imágenes deslizable y la imagen dejó de ser un enlace. En móvil, el deslizamiento puede reemplazar el toque que antes abría la ficha. El nombre y el precio siguen siendo enlace. **Se recomienda medir en Clarity o GA4 los clics a ficha desde las tarjetas antes y después del 08/10.**
   - Ingresos: las transacciones subieron de 2 a 4 y el ingreso bajó un 35 %. Eso es un **ticket promedio menor**, no menos compras. Con 2 a 4 transacciones la muestra es demasiado pequeña para sacar conclusiones, y además faltaban las ventas contraentrega (punto 1).
   - Los eventos clave bajaron un 14,9 %, en línea con las vistas (−14,6 %). Probablemente incluyen eventos de navegación (`view_item` o similares). Revisar en GA4 qué eventos están marcados como clave.

### Revisar en la configuración de GA4
- En *Medición mejorada*, si "Cambios de página basados en eventos del historial del navegador" está activo, puede duplicar las vistas en la navegación interna, porque el sitio también envía `config` en cada cambio de ruta. Validar en DebugView: debe haber **una** `page_view` por navegación.
- Comparar los próximos periodos teniendo en cuenta que las compras contraentrega **ahora sí se registran**. Los ingresos van a subir en parte por la medición, no solo por las ventas.

---

## 3. Detalle técnico de los cambios

### Tanda 1 (PR #1)
- Canonicals propios en todas las páginas. Antes el layout raíz forzaba `canonical: "/"`.
- Redirección 301 de slugs con espacios (`middleware.ts`) y validación en Sanity para que no se vuelvan a crear.
- Búsquedas internas con `noindex, follow`.
- `/conocenos` renderizado en el servidor (con H1 en el HTML inicial).
- Sitemap solo con URLs canónicas. robots.txt sin el bloqueo de `/_next/`.
- Redirecciones de las rutas legales antiguas y de las de WooCommerce.
- FAQPage, BlogPosting, Organization, Store con horarios válidos.
- Páginas locales en `/puntos-atencion/<ciudad>`.
- `/llms.txt` para buscadores con IA.
- Feed de Merchant con dominio canónico, color deducido y reporte `?diagnostico`.

### Tanda 2 (PR #2)
| Archivo | Cambio |
|---|---|
| `app/producto/[slug]/page.tsx` | 301 de la URL antigua por color a `?color=`. Relacionados por categoría. `alt` descriptivos |
| `lib/product-url.ts` (nuevo) | `productPublicPath()`: URL canónica de producto, usada en tarjetas, menú, buscador, carrito, popups, blog, videos, sitemap y Merchant |
| `app/tienda/tienda-server.tsx` (movido desde `[[...slug]]/page.tsx`) | Lógica de la tienda reutilizable. Títulos "Telas X por Metro en Colombia". H1 "Telas X por metro". Soporte para landings |
| `app/usos/[slug]/page.tsx` (nuevo) | Landing indexable por uso, con título, H1, canonical y schema propios. `/tienda?uso=x` declara como canonical `/usos/x` |
| `components/header.tsx`, `components/mobile-menu-item.tsx` | El menú de usos enlaza a `/usos/<uso>` |
| `app/sitemap.ts` | Incluye las landings por uso con productos disponibles |
| `app/producto/[slug]/ClientProductView.tsx`, `components/product-spec-sheet.tsx` | Aclaración del precio por metro frente al precio por kilo |
| `lib/seo.ts` | `descriptiveAlt()`, `categoryLabel()`, `usageSlug()` |
| `lib/google-merchant.ts` | Se omiten los productos sin slug o sin precio (antes un producto sin precio rompía toda la sincronización). Enlaces canónicos |
| `app/confirmation/page.tsx` | `purchase` también para contraentrega, esperando el valor y el pedido correctos |
| `components/tracking-pixels.tsx` | `page_path` con `?` y sin `PageView` duplicado al cargar |

---

## 4. Lista de verificación después del despliegue

1. `NEXT_PUBLIC_SITE_URL` apunta al dominio real (con o sin `www`, el que use Google).
2. `/producto/tela-rib-pitillo-blanco-colombia` responde con 308/301 hacia `/producto/tela-rib-pitillo-x-metros-acanalada?color=tela-rib-pitillo-blanco-colombia`.
3. `/tienda/rib` muestra el título "Telas Rib por Metro en Colombia" y el H1 "Telas Rib por metro".
4. Al abrir un uso desde el menú (`/usos/...`) aparecen solo productos de ese uso.
5. `/sitemap.xml` incluye `/usos/...` y no incluye las URLs antiguas por color.
6. GA4 DebugView: una `page_view` por navegación y `purchase` con valor > 0 en una compra contraentrega de prueba.
7. Prueba de resultados enriquecidos de Google: un producto, una categoría y el FAQ.
8. Search Console: volver a enviar el sitemap e inspeccionar una ficha para confirmar que se renderiza con CSS.
