# Integración WordPress API - Página de Inicio

## Resumen
Se integró el endpoint de WordPress para cargar dinámicamente el contenido de la página de inicio.

## Endpoint
```
https://www.telasreal.com/wp-json/wp/v2/secciones_inicio?_fields=acf
```

## Archivos creados

### `lib/hooks/useHomeData.ts`
Hook personalizado que:
- Hace fetch al endpoint de WordPress una sola vez al montar
- Devuelve `{ data, loading, error }`
- Usa `cache: 'no-store'` para datos siempre frescos

### `lib/wordpress-media.ts`
Utilidades para convertir IDs de attachments de WordPress a URLs:
- `getWordPressImageUrl(id)` - Convierte un ID a URL
- `getWordPressImageUrls(ids[])` - Convierte múltiples IDs a URLs

## Archivos modificados

### `components/header.tsx`
- TopTicker ahora usa textos dinámicos del API
- Consume `useHomeData()` hook
- Filtra textos vacíos de `textos_header` (texto_1, texto_2, texto_3, texto_4)
- Fallback a mensajes por defecto si no hay datos

### `components/hero-carousel.tsx`
- Banner ahora usa imágenes dinámicas del API
- Consume `useHomeData()` hook
- Convierte IDs de WordPress a URLs usando `getWordPressImageUrls()`
- Filtra imágenes que fallan al cargar (con `onError`)
- Muestra loading spinner mientras obtiene las URLs
- No renderiza slides vacíos

### `components/loading-screen.tsx`
- Ahora sincronizado con el estado de carga del hook `useHomeData()`
- Se mantiene visible hasta que los datos terminen de cargarse
- Mínimo 1 segundo para buena UX

## Flujo de datos

1. **Inicio**: `LoadingScreen` visible
2. **Fetch**: `useHomeData` hace petición al endpoint de WordPress
3. **Procesamiento**: 
   - `TopTicker` extrae y filtra textos
   - `HeroCarousel` convierte IDs de imágenes a URLs
4. **Renderizado**: Componentes muestran datos dinámicos
5. **Fin**: `LoadingScreen` hace fade out

## Manejo de errores

- **Imágenes**: Si una imagen falla al cargar, se excluye del carousel
- **Textos vacíos**: Se filtran automáticamente
- **Fallback**: Si no hay datos, se usan valores por defecto
- **Errores de red**: Se loggean en consola, no rompen la UI

## Mejoras futuras

- [ ] Agregar revalidación periódica con SWR o React Query
- [ ] Cache en localStorage para primera carga instantánea
- [ ] Optimización de imágenes con Next.js Image Optimization
- [ ] Manejo de errores con UI (toast/banner)
