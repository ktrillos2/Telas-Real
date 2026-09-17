import { defineField, defineType } from 'sanity'
import { Building2, Calendar, Users, Target } from 'lucide-react'
import { WholesaleProgressEditor } from '../components/WholesaleProgressEditor'

export const clienteMayorista = defineType({
  name: 'clienteMayorista',
  title: 'Clientes Mayoristas (Empresas)',
  type: 'document',
  icon: Building2,
  groups: [
    { name: 'progress', title: 'Seguimiento Mensual (ERP)', icon: Calendar, default: true },
    { name: 'general', title: 'Información General', icon: Building2 },
    { name: 'commercial', title: 'Acuerdo Comercial', icon: Target },
    { name: 'users', title: 'Usuarios del Portal', icon: Users },
  ],
  fields: [
    // Componente Interactivo ERP en el tab principal
    defineField({
      name: 'editorProgreso',
      title: 'Panel de Control de Avance Mensual',
      type: 'string',
      group: 'progress',
      components: {
        input: WholesaleProgressEditor,
      },
    }),

    // Información General
    defineField({
      name: 'nombre',
      title: 'Nombre de la Empresa / Cliente',
      type: 'string',
      group: 'general',
      description: 'Nombre oficial de la cuenta (ej: NOVOA, ALEXIS VARGAS, MARIO TOVAR).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'codigoCliente',
      title: 'Código Único de Cliente',
      type: 'string',
      group: 'general',
      description: 'Identificador estandarizado (ej: CL-NOVOA, CL-ALEXIS). Se usa en Google Sheets como ID_CLIENTE.',
    }),
    defineField({
      name: 'sheetName',
      title: 'Pestaña Vinculada en Google Sheets',
      type: 'string',
      group: 'general',
      description: 'Nombre exacto de la hoja en el Google Spreadsheet (ej: NOVOA).',
    }),
    defineField({
      name: 'encargado',
      title: 'Asesor Comercial / Encargado Telas Real',
      type: 'string',
      group: 'general',
      initialValue: 'E-COMMERCE',
    }),
    defineField({
      name: 'cedulaNitPrincipal',
      title: 'Cédula o NIT Principal',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'telefono',
      title: 'Teléfono Principal de Contacto',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'direccion',
      title: 'Dirección Principal / Bodega',
      type: 'string',
      group: 'general',
    }),
    defineField({
      name: 'ciudad',
      title: 'Ciudad',
      type: 'string',
      group: 'general',
    }),

    // Acuerdo Comercial y Objetivo
    defineField({
      name: 'objetivoMensual',
      title: 'Objetivo Mensual de Compra',
      type: 'object',
      group: 'commercial',
      description: 'Meta mensual estipulada en el acuerdo mayorista.',
      fields: [
        {
          name: 'kg',
          type: 'number',
          title: 'Meta en KG',
          description: 'Objetivo de compra en Kilogramos (ej: 684.5 KG)',
          validation: (Rule) => Rule.required().positive(),
        },
        {
          name: 'mt',
          type: 'number',
          title: 'Meta en Metros (Referencial)',
          readOnly: true,
          description: 'Metros proyectados según el rendimiento estándar de la tela.',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'acuerdoKgPrecio',
      title: 'Precio Acordado por KG ($)',
      type: 'number',
      group: 'commercial',
      initialValue: 37950,
      description: 'Valor acordado por cada kilogramo de tela (ej: $37.950 COP).',
    }),
    defineField({
      name: 'acuerdoMtPrecio',
      title: 'Precio Acordado por MT ($)',
      type: 'number',
      group: 'commercial',
      initialValue: 11500,
      description: 'Valor acordado por cada metro de tela (ej: $11.500 COP).',
    }),
    defineField({
      name: 'tiemposCondiciones',
      title: 'Condiciones y Tiempos de Pago',
      type: 'string',
      group: 'commercial',
      initialValue: 'Acumulados del mes y pagando antes del 30 de cada mes',
    }),

    // Historial Mensual Calculado
    defineField({
      name: 'meses',
      title: 'Historial Mensual de Consumo',
      type: 'array',
      group: 'progress',
      description: 'Registros mensuales de cumplimiento. Las columnas de metros, faltantes y estado son calculadas exclusivamente por el backend.',
      of: [
        {
          type: 'object',
          title: 'Mes de Consumo',
          fields: [
            { name: 'mes', type: 'string', title: 'Mes (ej: SEPTIEMBRE)' },
            { name: 'mesNumero', type: 'number', title: 'Número de Mes (1-12)' },
            { name: 'anio', type: 'number', title: 'Año (ej: 2026)' },
            { name: 'kgCumplido', type: 'number', title: 'KG Cumplidos / Entregados' },
            { name: 'mtCumplido', type: 'number', title: 'Metros Cumplidos (Calculado)', readOnly: true },
            { name: 'dinero', type: 'number', title: 'Dinero Acumulado (Calculado)', readOnly: true },
            { name: 'faltanteKg', type: 'number', title: 'Cuánto falta en KG (Calculado)', readOnly: true },
            { name: 'faltanteMt', type: 'number', title: 'Cuánto falta en MT (Calculado)', readOnly: true },
            { name: 'faltanteDinero', type: 'number', title: 'Cuánto falta en $ (Calculado)', readOnly: true },
            { name: 'porcentaje', type: 'number', title: '% de Cumplimiento', readOnly: true },
            {
              name: 'cumplimiento',
              type: 'string',
              title: 'Cumplimiento (SI / NO)',
              options: { list: ['SI', 'NO'] },
              readOnly: true,
            },
            { name: 'updatedAt', type: 'datetime', title: 'Última Actualización', readOnly: true },
            { name: 'updatedBy', type: 'string', title: 'Origen del Cambio', readOnly: true },
          ],
          preview: {
            select: {
              mes: 'mes',
              anio: 'anio',
              kg: 'kgCumplido',
              mt: 'mtCumplido',
              cumplimiento: 'cumplimiento',
              porcentaje: 'porcentaje',
            },
            prepare({ mes, anio, kg, mt, cumplimiento, porcentaje }) {
              const badge = cumplimiento === 'SI' ? '✅ SI' : '❌ NO'
              return {
                title: `${mes || ''} ${anio || ''}: ${kg || 0} KG (${mt || 0} MT) — ${badge}`,
                subtitle: `Avance: ${porcentaje || 0}% de la meta mensual`,
              }
            },
          },
        },
      ],
    }),

    // Usuarios Asociados y Portal
    defineField({
      name: 'usuarios',
      title: 'Usuarios Asignados a este Cliente',
      type: 'array',
      group: 'users',
      description: 'Usuarios (cuentas de acceso) que representan a esta empresa mayorista en el portal web.',
      of: [
        {
          type: 'reference',
          to: [{ type: 'user' }],
        },
      ],
    }),
    defineField({
      name: 'mensajePersonalizado',
      title: 'Mensaje Personalizado para el Portal B2B',
      type: 'text',
      group: 'users',
      description: 'Mensaje de saludo y acuerdos específicos que los usuarios de esta empresa verán al iniciar sesión.',
    }),
  ],
  preview: {
    select: {
      title: 'nombre',
      codigo: 'codigoCliente',
      objetivoKg: 'objetivoMensual.kg',
      encargado: 'encargado',
    },
    prepare({ title, codigo, objetivoKg, encargado }) {
      return {
        title: `${title || 'Cliente Sin Nombre'} ${codigo ? `(${codigo})` : ''}`,
        subtitle: `Meta: ${objetivoKg || 0} KG/mes • Encargado: ${encargado || 'E-COMMERCE'}`,
        media: Building2,
      }
    },
  },
})
