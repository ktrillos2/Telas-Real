import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Gestionar Contenido')
    .items([
      // Gestionar Contenido Folder (Group)
      S.listItem()
        .title('Página de Inicio')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Página de Inicio')
        ),

      S.listItem()
        .title('Tiendas')
        .schemaType('store')
        .child(S.documentTypeList('store').title('Tiendas')),

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
