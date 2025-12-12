# Integración de Productos WordPress - Telas Real

## Descripción General

Se ha implementado la integración completa con la API de WordPress/WooCommerce para obtener y mostrar productos y categorías dinámicamente desde https://www.telasreal.com

## Archivos Creados/Modificados

### 1. `/lib/hooks/useProducts.ts`
Hook personalizado para obtener productos desde WordPress con:
- **Caché localStorage** (10 minutos de duración)
- **Stale-while-revalidate**: Muestra datos cacheados instantáneamente mientras revalida en background
- **Paginación**: Soporta parámetros `page` y `perPage`
- **Transformación de datos**: Convierte la estructura de WooCommerce al formato esperado

**Endpoint utilizado:**
```
GET https://www.telasreal.com/wp-json/wc/store/products?per_page=100&page=1
```

### 2. `/lib/hooks/useCategories.ts`
Hook personalizado para obtener categorías desde WordPress con:
- **Caché localStorage** (30 minutos de duración)
- **Stale-while-revalidate**: Muestra categorías cacheadas instantáneamente
- **Filtrado automático**: Solo muestra categorías con productos (count > 0)

**Endpoint utilizado:**
```
GET https://www.telasreal.com/wp-json/wc/store/products/categories?per_page=100
```

### 3. `/app/tienda/page.tsx`
Página de tienda actualizada para:
- Usar `useProducts()` y `useCategories()` en lugar de datos hardcodeados
- **Categorías dinámicas**: Se cargan desde WordPress automáticamente
- Filtrar por categorías de WordPress (usando slugs)
- Filtrar por atributos de productos:
  - **Precio**: Bajo (< $20.000), Medio ($20.000-$28.000), Alto (> $28.000)
  - **Ancho**: 1.50m, 1.55m, 1.60m, 1.70m
  - **Elasticidad**: Alta, Media, Limitada, Nula
- Ordenamiento: Precio, Nombre, Fecha (más reciente/antiguo)
- Paginación: 20 productos por página

## Estructura de Datos

### Producto (Product Interface)
```typescript
interface Product {
  id: number
  name: string
  slug: string
  price: number
  regular_price: number
  sale_price: number
  image: string
  images: Array<{
    id: number
    src: string
    thumbnail: string
    alt: string
  }>
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  attributes: Array<{
    id: number
    name: string
    terms: Array<{
      id: number
      name: string
      slug: string
    }>
  }>
  is_in_stock: boolean
  short_description: string
  description: string
}
```

## Categorías de WordPress

Las categorías se obtienen dinámicamente desde WordPress. Algunas categorías principales incluyen:

| Nombre                      | Slug                                        | Productos |
|-----------------------------|---------------------------------------------|-----------|
| SUBLIMADOS                  | sublimado-telas-textil                      | 9         |
| UNICOLOR                    | telaunicolor                                | 221       |
| DEPORTIVOS Y CÓMODOS        | tela_para_confeccion_licra_deportiva        | 77        |
| ELEGANTES                   | tela-para-confeccion-prendas-elegantes      | 41        |
| MODA CASUAL                 | tela-moda-casual-confeccion                 | 123       |
| PIJAMAS                     | tela-para-pijamas                           | 92        |
| ACCESORIOS Y MASCOTAS       | telas_para_accesorios_mascotas              | 19        |
| Ofertas                     | ofertas_telas_promociones                   | 90        |

**Nota:** Los números de productos son aproximados y se actualizan dinámicamente desde la API.

### Iconos de Categorías

El sistema mapea automáticamente iconos para categorías conocidas:
- **Sublimados**: Sparkles (✨)
- **Unicolor**: Shirt (👕)
- **Deportivos**: Dumbbell (🏋️)
- **Elegantes**: Crown (👑)
- **Casual**: Coffee (☕)
- **Otros**: Package (📦) por defecto

## Atributos de Productos

### 1. Ancho (pa_anchodetela)
- Se extrae del atributo "Ancho"
- Ejemplos: "1.50 metros", "1.55 metros", "1.60 metros", "1.70 metros"
- El filtro busca números coincidentes (1.50, 1.55, etc.)

### 2. Elasticidad (pa_elasticidad)
- Se extrae del atributo "Elasticidad"
- Valores: "Alta", "Media", "Limitada", "Nula"
- El filtro compara slugs en minúscula

### 3. Composición (pa_composicion)
- Información disponible en los datos pero no filtrable actualmente
- Ejemplos: "Poliester", "90% Poliester / 10% Elastano"

## Sistema de Caché

### Configuración
- **Clave de caché**: `telasreal_products_page{page}_per{perPage}`
- **Duración**: 10 minutos (600,000ms)
- **Estrategia**: Stale-while-revalidate

### Comportamiento
1. **Primera carga**: Obtiene datos de la API y los guarda en localStorage
2. **Cargas subsecuentes**:
   - Muestra datos cacheados inmediatamente (< 100ms)
   - Revalida en background después de 100ms
   - Si hay cambios, actualiza silenciosamente

## Rendimiento

### Métricas Estimadas
- **Primera carga**: ~800-1200ms (depende de la red)
- **Cargas con caché**: ~100-200ms
- **Productos por request**: 100 (configurable)

### Optimizaciones Aplicadas
- ✅ Caché en localStorage
- ✅ Revalidación en background
- ✅ Imágenes optimizadas con Next.js Image
- ✅ Uso de `useMemo` para filtrado/ordenamiento
- ✅ Paginación en frontend

## Flujo de Datos

```
┌─────────────────┐
│   useProducts   │
│     Hook        │
└────────┬────────┘
         │
         ├──> Check localStorage cache
         │    │
         │    ├──> Cache hit → Return immediately
         │    │                 └──> Background revalidation
         │    │
         │    └──> Cache miss → Fetch from API
         │                      └──> Save to cache
         │
         ▼
┌─────────────────┐
│  TiendaContent  │
│   Component     │
└────────┬────────┘
         │
         ├──> Filter by category
         ├──> Filter by price
         ├──> Filter by width
         ├──> Filter by elasticity
         ├──> Sort products
         ├──> Paginate
         │
         ▼
┌─────────────────┐
│  ProductCard    │
│   Components    │
└─────────────────┘
```

## Ejemplo de Respuesta de API

```json
{
  "id": 2000100527675,
  "name": "SCUBA CREPE SUBLIMADO",
  "slug": "scuba-crepe-sublimado-2",
  "prices": {
    "price": "13500",
    "currency_code": "COP"
  },
  "images": [{
    "src": "https://www.telasreal.com/wp-content/uploads/2025/06/SCUBA-CREPE.jpeg",
    "thumbnail": "https://www.telasreal.com/wp-content/uploads/2025/06/SCUBA-CREPE-300x300.jpeg"
  }],
  "categories": [{
    "id": 617,
    "name": "SCUBA CREPE SUBLIMADO",
    "slug": "scuba-crepe-sublimado"
  }],
  "attributes": [{
    "id": 3,
    "name": "Ancho",
    "terms": [{
      "id": 659,
      "name": "1.50 metros",
      "slug": "150metros"
    }]
  }],
  "is_in_stock": true
}
```

## Próximas Mejoras Sugeridas

1. **Server-Side Rendering (SSR)**: Mover el fetch a servidor para mejor SEO
2. **Infinite Scroll**: Reemplazar paginación con scroll infinito
3. **Filtro de Peso**: Agregar atributo `pa_peso` en WordPress
4. **Búsqueda de texto**: Implementar búsqueda por nombre/descripción
5. **Filtro de Stock**: Mostrar solo productos en stock
6. **Wishlist**: Guardar productos favoritos

## Troubleshooting

### Los productos no se cargan
1. Verificar que la API esté accesible: `curl https://www.telasreal.com/wp-json/wc/store/products`
2. Revisar console del navegador para errores de CORS
3. Limpiar localStorage: `localStorage.clear()`

### Filtros no funcionan correctamente
1. Verificar que los productos tengan atributos configurados en WordPress
2. Revisar que los slugs de categorías coincidan
3. Comprobar el formato de los valores de atributos

### Caché no se actualiza
1. El caché se revalida automáticamente después de 10 minutos
2. Para forzar actualización: Limpiar localStorage del navegador
3. El caché se invalida automáticamente con cada cambio de versión (CACHE_VERSION)

## Contacto

Para dudas sobre la integración, revisar:
- `/lib/hooks/useProducts.ts` - Lógica de obtención de datos
- `/app/tienda/page.tsx` - Implementación de filtros y UI
- `/lib/cache.ts` - Utilidades de caché
