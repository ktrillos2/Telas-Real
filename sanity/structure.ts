import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Gestionar Contenido')
    .items([
      // Gestionar Contenido Folder (Group)
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
                .child(S.documentTypeList('order').title('Todos los Pedidos')),
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
            ])
        ),
    ])
