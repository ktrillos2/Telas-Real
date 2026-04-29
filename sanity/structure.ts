import type { StructureResolver } from 'sanity/structure'
import { Image } from 'lucide-react'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Panel Administrativo')
    .items([
      // 1. Diseños Sublimados (Categorizados por carpeta)
      S.listItem()
        .title('Diseños Sublimados')
        .icon(Image)
        .child(
          S.list()
            .title('Organización de Diseños')
            .items([
              S.listItem()
                .title('Todas las Imágenes')
                .child(S.documentTypeList('imagenSublimada').title('Todas las Imágenes')),
              S.divider(),
              // Carpetas por Categoría
              ...['BRUSH SUBLIMADO', 'PIEL DE CONEJO SUBLIMADO', 'SATIN SUBLIMADO', 'SUAVETINA SUBLIMADA '].map(category => (
                S.listItem()
                  .title(category)
                  .child(
                    S.documentTypeList('imagenSublimada')
                      .title(category)
                      .filter('_type == "imagenSublimada" && category == $category')
                      .params({ category })
                  )
              )),
              S.divider(),
              S.listItem()
                .title('Otras / Sin Categoría')
                .child(
                  S.documentTypeList('imagenSublimada')
                    .title('Otras')
                    .filter('_type == "imagenSublimada" && !(category in ["BRUSH SUBLIMADO", "PIEL DE CONEJO SUBLIMADO", "SATIN SUBLIMADO", "SUAVETINA SUBLIMADA "])')
                ),
            ])
        ),

      S.divider(),

      // Página de Inicio Group
      S.listItem()
        .title('Página de Inicio')
        .child(
          S.list()
            .title('Secciones Inicio')
            .items([
              S.listItem()
                .title('Sección de Banners')
                .child(
                  S.document()
                    .schemaType('homeBanners')
                    .documentId('homeBanners')
                    .title('Sección de Banners')
                ),
              S.listItem()
                .title('Sección Conócenos')
                .child(
                  S.document()
                    .schemaType('homeConocenos')
                    .documentId('homeConocenos')
                    .title('Sección Conócenos')
                ),
              S.listItem()
                .title('Servicios Especiales')
                .child(
                  S.document()
                    .schemaType('homeServices')
                    .documentId('homeServices')
                    .title('Servicios Especiales')
                ),
              S.listItem()
                .title('Configuración Tienda Inicio')
                .child(
                  S.document()
                    .schemaType('homeStore')
                    .documentId('homeStore')
                    .title('Configuración Tienda Inicio')
                ),
            ])
        ),

      S.listItem()
        .title('Tiendas')
        .child(S.documentTypeList('store').title('Tiendas')),

      S.listItem()
        .title('Catálogo')
        .child(
          S.list()
            .title('Catálogo')
            .items([
              S.listItem()
                .title('Productos')
                .child(S.documentTypeList('product').title('Todos los Productos')),

              S.listItem()
                .title('Categorías')
                .child(S.documentTypeList('category').title('Todas las Categorías')),
              S.listItem()
                .title('Usos')
                .child(S.documentTypeList('usage').title('Todos los Usos')),
              S.listItem()
                .title('Tonos')
                .child(S.documentTypeList('tone').title('Todos los Tonos')),
            ])
        ),

      S.listItem()
        .title('Blog')
        .child(S.documentTypeList('post').title('Artículos')),

      // Página Personalizado Group
      S.listItem()
        .title('Página Personalizado')
        .child(
          S.list()
            .title('Secciones Personalizado')
            .items([
              S.listItem()
                .title('Hero')
                .child(
                  S.document()
                    .schemaType('personalizadoHero')
                    .documentId('personalizadoHero')
                    .title('Hero Personalizado')
                ),
              S.listItem()
                .title('Grilla de Características')
                .child(
                  S.document()
                    .schemaType('personalizadoFeatures')
                    .documentId('personalizadoFeatures')
                    .title('Grilla de Características')
                ),
              S.listItem()
                .title('Info y Tarifas')
                .child(
                  S.document()
                    .schemaType('personalizadoInfo')
                    .documentId('personalizadoInfo')
                    .title('Info y Tarifas')
                ),
              S.listItem()
                .title('Requisitos y Validación')
                .child(
                  S.document()
                    .schemaType('personalizadoRequirements')
                    .documentId('personalizadoRequirements')
                    .title('Requisitos y Validación')
                ),
              S.listItem()
                .title('Llamada a la Acción (CTA)')
                .child(
                  S.document()
                    .schemaType('personalizadoCTA')
                    .documentId('personalizadoCTA')
                    .title('Llamada a la Acción (CTA)')
                ),
            ])
        ),

      S.listItem()
        .title('Ventas')
        .child(
          S.list()
            .title('Ventas')
            .items([
              S.listItem()
                .title('Pedidos')
                .child(
                  S.list()
                    .title('Filtros de Pedidos')
                    .items([
                      S.listItem()
                        .title('Todos los Pedidos')
                        .child(
                          S.documentTypeList('order')
                            .title('Todos los Pedidos')
                            .defaultOrdering([{ field: 'date', direction: 'desc' }])
                        ),
                      S.divider(),
                      S.listItem()
                        .title('Por Estado')
                        .child(
                          S.list()
                            .title('Estado del Pedido')
                            .items([
                              S.listItem()
                                .title('Pendientes')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Pendientes')
                                    .filter('_type == "order" && status == "pending"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                              S.listItem()
                                .title('Pagados')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Pagados')
                                    .filter('_type == "order" && status == "paid"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                              S.listItem()
                                .title('Procesando')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Procesando')
                                    .filter('_type == "order" && status == "processing"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                              S.listItem()
                                .title('Completados (Entregados)')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Completados (Entregados)')
                                    .filter('_type == "order" && status == "delivered"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                              S.listItem()
                                .title('Cancelados')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Cancelados')
                                    .filter('_type == "order" && status == "cancelled"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                            ])
                        ),
                      S.divider(),
                      S.listItem()
                        .title('Por Método de Pago')
                        .child(
                          S.list()
                            .title('Método de Pago')
                            .items([
                              S.listItem()
                                .title('Contraentrega')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Contraentrega')
                                    .filter('_type == "order" && paymentMethod == "cod"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                              S.listItem()
                                .title('Wompi')
                                .child(
                                  S.documentTypeList('order')
                                    .title('Wompi')
                                    .filter('_type == "order" && paymentMethod == "wompi"')
                                    .defaultOrdering([{ field: 'date', direction: 'desc' }])
                                ),
                            ])
                        )
                    ])
                ),
              S.listItem()
                .title('Usuarios')
                .child(S.documentTypeList('user').title('Todos los Usuarios')),
            ])
        ),

      S.divider(),

      // Elementos Globales Divider/Group
      S.listItem()
        .title('Elementos Globales')
        .child(
          S.list()
            .title('Elementos Globales')
            .items([
              S.listItem()
                .title('Encabezado')
                .child(
                  S.document()
                    .schemaType('header')
                    .documentId('header')
                    .title('Encabezado')
                ),
              S.listItem()
                .title('Pie de Página')
                .child(
                  S.document()
                    .schemaType('footer')
                    .documentId('footer')
                    .title('Pie de Página')
                ),
              S.listItem()
                .title('Configuraciones Generales')
                .child(
                  S.document()
                    .schemaType('globalSettings')
                    .documentId('globalSettings')
                    .title('Configuraciones Generales')
                ),
              S.listItem()
                .title('Configuración Calculadora')
                .child(
                  S.document()
                    .schemaType('calculadoraSettings')
                    .documentId('calculadoraSettings')
                    .title('Configuración Calculadora')
                ),
            ])
        ),
    ])
