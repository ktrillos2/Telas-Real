import { defineField, defineType } from 'sanity'
import { Building2 } from 'lucide-react'

/** Solicitudes del formulario de Ventas Corporativas (B2B) en /empresas. */
export const b2bLead = defineType({
  name: 'b2bLead',
  title: 'Solicitudes B2B',
  type: 'document',
  icon: Building2,
  fields: [
    defineField({
      name: 'status',
      title: 'Estado',
      type: 'string',
      options: {
        list: [
          { title: '🆕 Nueva', value: 'nuevo' },
          { title: '📞 Contactado', value: 'contactado' },
          { title: '💬 En negociación', value: 'negociacion' },
          { title: '✅ Cliente', value: 'cliente' },
          { title: '❌ Descartado', value: 'descartado' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'nuevo',
    }),
    defineField({ name: 'nombre', title: 'Nombre / Empresa', type: 'string', readOnly: true }),
    defineField({ name: 'correo', title: 'Correo', type: 'string', readOnly: true }),
    defineField({ name: 'telefono', title: 'Teléfono', type: 'string', readOnly: true }),
    defineField({ name: 'ciudad', title: 'Ciudad', type: 'string', readOnly: true }),
    defineField({ name: 'intereses', title: 'Productos de interés', type: 'array', of: [{ type: 'string' }], readOnly: true }),
    defineField({ name: 'volumen', title: 'Volumen estimado', type: 'string', readOnly: true }),
    defineField({ name: 'necesidad', title: 'Necesidad', type: 'text', rows: 4, readOnly: true }),
    defineField({ name: 'source', title: 'Página de origen', type: 'string', readOnly: true }),
    defineField({ name: 'notes', title: 'Notas internas', type: 'text', rows: 3, description: 'Seguimiento del equipo comercial.' }),
  ],
  orderings: [{ title: 'Más recientes', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] }],
  preview: {
    select: { nombre: 'nombre', ciudad: 'ciudad', volumen: 'volumen', status: 'status', createdAt: '_createdAt' },
    prepare({ nombre, ciudad, volumen, status, createdAt }) {
      const icons: Record<string, string> = { nuevo: '🆕', contactado: '📞', negociacion: '💬', cliente: '✅', descartado: '❌' }
      const date = createdAt ? new Date(createdAt).toLocaleDateString('es-CO') : ''
      return { title: `${icons[status] || '🆕'} ${nombre || 'Sin nombre'}`, subtitle: [date, ciudad, volumen].filter(Boolean).join(' · ') }
    },
  },
})
