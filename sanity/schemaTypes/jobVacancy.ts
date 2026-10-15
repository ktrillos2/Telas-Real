import { defineField, defineType } from 'sanity'
import { Briefcase } from 'lucide-react'

export const jobVacancy = defineType({
  name: 'jobVacancy',
  title: 'Vacantes y Convocatorias',
  type: 'document',
  icon: Briefcase,
  fields: [
    defineField({
      name: 'title',
      title: 'Título del Cargo',
      type: 'string',
      description: 'Ej: Asesor comercial, Operario de Corte, Asistente de Sublimación',
      validation: (Rule) => Rule.required().error('El título es obligatorio'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('El slug es obligatorio'),
    }),
    defineField({
      name: 'city',
      title: 'Ciudad / Ubicación',
      type: 'string',
      description: 'Ej: Bogotá D.C., Medellín, Nacional',
      initialValue: 'Bogotá, Colombia',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'modality',
      title: 'Modalidad',
      type: 'string',
      options: {
        list: [
          { title: 'Presencial', value: 'Presencial' },
          { title: 'Híbrido', value: 'Híbrido' },
          { title: 'Remoto', value: 'Remoto' },
        ],
        layout: 'radio',
      },
      initialValue: 'Presencial',
    }),
    defineField({
      name: 'schedule',
      title: 'Horario',
      type: 'string',
      description: 'Ej: Lunes a Sábado, horario comercial',
    }),
    defineField({
      name: 'department',
      title: 'Área / Departamento',
      type: 'string',
      description: 'Ej: Comercial y Ventas, Producción Textil, Logística, Administrativo',
    }),
    defineField({
      name: 'description',
      title: 'Descripción del Puesto',
      type: 'text',
      rows: 4,
      description: 'Resumen del cargo y lo que se espera de la persona.',
    }),
    defineField({
      name: 'requirements',
      title: 'Requisitos y Perfil Deseado',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lista de habilidades, competencias o experiencia.',
    }),
    defineField({
      name: 'conditions',
      title: 'Condiciones y Beneficios (Opcional)',
      type: 'text',
      rows: 2,
      description: 'Tipo de contrato, beneficios, etc.',
    }),
    defineField({
      name: 'isOpen',
      title: 'Convocatoria Abierta',
      type: 'boolean',
      description: 'Si está activa, se mostrará en la página de Trabaja con Nosotros.',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Orden de Prioridad',
      type: 'number',
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      city: 'city',
      isOpen: 'isOpen',
      modality: 'modality',
    },
    prepare(selection) {
      const { title, city, isOpen, modality } = selection
      return {
        title: title || 'Sin título',
        subtitle: `${isOpen ? '🟢 Abierta' : '🔴 Cerrada'} • ${city || ''} (${modality || 'Presencial'})`,
      }
    },
  },
})
