import { defineField, defineType } from 'sanity'
import { Building2 } from 'lucide-react'

export const empresasPage = defineType({
  name: 'empresasPage',
  title: 'Página Empresas (B2B)',
  type: 'document',
  icon: Building2,
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Título para buscadores (ej: Telas Real | Canal Mayorista)',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      description: 'Descripción para buscadores',
    }),
    // Hero Section
    defineField({
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        defineField({
          name: 'tagline',
          title: 'Etiqueta superior (Tagline)',
          type: 'string',
          initialValue: 'Canal Mayorista B2B',
        }),
        defineField({
          name: 'title',
          title: 'Título Principal',
          type: 'string',
          initialValue: 'Telas por Volumen para tu Negocio',
        }),
        defineField({
          name: 'description',
          title: 'Descripción Corta',
          type: 'text',
          initialValue: 'Soluciones textiles integrales para confeccionistas, diseñadores y marcas de moda.',
        }),
        defineField({
          name: 'buttonText',
          title: 'Texto del Botón',
          type: 'string',
          initialValue: 'Solicitar Asesoría Mayorista',
        }),
        defineField({
          name: 'backgroundImage',
          title: 'Imagen de Fondo',
          type: 'image',
          options: { hotspot: true },
        }),
      ],
    }),
    // Introducción
    defineField({
      name: 'introduction',
      title: 'Sección de Introducción',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Título',
          type: 'string',
          initialValue: '¿Por qué elegir nuestro canal mayorista?',
        }),
        defineField({
          name: 'description',
          title: 'Descripción',
          type: 'text',
          initialValue: 'Entendemos que en la industria textil, la puntualidad, la calidad y el volumen son factores críticos para el éxito. En Telas Real hemos diseñado un canal corporativo exclusivo para pronta moda, talleres de confección y distribuidores que buscan un proveedor confiable y a largo plazo.',
        }),
      ]
    }),
    // Estadísticas
    defineField({
      name: 'stats',
      title: 'Estadísticas (Cifras)',
      type: 'object',
      fields: [
        defineField({ name: 'years', title: 'Años de Experiencia', type: 'number', initialValue: 7 }),
        defineField({ name: 'clients', title: 'Clientes Satisfechos (+)', type: 'number', initialValue: 200 }),
        defineField({ name: 'tons', title: 'Toneladas Anuales', type: 'number', initialValue: 1400 }),
        defineField({ name: 'inventory', title: 'Metros Disponibles (+)', type: 'number', initialValue: 1000000 }),
      ]
    }),
    // Casos de éxito
    defineField({
      name: 'successCases',
      title: 'Casos de Éxito',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Título de la Sección',
          type: 'string',
          initialValue: 'Casos de Éxito',
        }),
        defineField({
          name: 'subtitle',
          title: 'Subtítulo',
          type: 'string',
          initialValue: 'Conoce las historias de marcas que han crecido junto a nosotros.',
        }),
        defineField({
          name: 'cases',
          title: 'Casos',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'clientName', title: 'Nombre del Cliente/Marca', type: 'string' }),
                defineField({ name: 'problem', title: 'Problema Inicial', type: 'text' }),
                defineField({ name: 'solution', title: 'Nuestra Solución', type: 'text' }),
                defineField({ name: 'result', title: 'Resultado Obtenido', type: 'text' }),
                defineField({
                  name: 'colorTheme',
                  title: 'Color del Tema (Borde)',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Azul', value: 'blue' },
                      { title: 'Violeta', value: 'purple' },
                      { title: 'Esmeralda (Verde)', value: 'emerald' },
                      { title: 'Naranja', value: 'orange' },
                      { title: 'Rojo', value: 'red' },
                    ]
                  },
                  initialValue: 'blue'
                }),
              ],
              preview: {
                select: { title: 'clientName' }
              }
            }
          ]
        }),
      ]
    }),
    // Formulario (Textos)
    defineField({
      name: 'formSection',
      title: 'Sección del Formulario (Lado Izquierdo)',
      type: 'object',
      fields: [
        defineField({
          name: 'tagline',
          title: 'Etiqueta Superior',
          type: 'string',
          initialValue: 'SOLUCIONES A MEDIDA',
        }),
        defineField({
          name: 'title',
          title: 'Título',
          type: 'string',
          initialValue: '¿Listo para impulsar tu producción?',
        }),
        defineField({
          name: 'description',
          title: 'Descripción',
          type: 'text',
          initialValue: 'Déjanos tus datos y un asesor especializado se pondrá en contacto contigo para entender las necesidades de tu empresa y ofrecerte las mejores opciones en textiles.',
        }),
        defineField({
          name: 'benefits',
          title: 'Beneficios',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'icon',
                  title: 'Icono',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Paquete (Package)', value: 'Package' },
                      { title: 'Camión (Truck)', value: 'Truck' },
                      { title: 'Edificio (Building)', value: 'Building2' },
                    ]
                  },
                  initialValue: 'Package'
                }),
                defineField({ name: 'title', title: 'Título', type: 'string' }),
                defineField({ name: 'description', title: 'Descripción', type: 'text' }),
              ],
              preview: { select: { title: 'title' } }
            }
          ]
        }),
        defineField({
          name: 'footerText',
          title: 'Texto inferior (Garantía)',
          type: 'text',
          initialValue: 'Garantizamos la privacidad de tus datos. Al enviar el formulario aceptas nuestra política de tratamiento de datos.',
        }),
      ]
    }),
  ],
  preview: {
    select: {
      title: 'seoTitle'
    },
    prepare() {
      return { title: 'Página Empresas (B2B)' }
    }
  }
})
