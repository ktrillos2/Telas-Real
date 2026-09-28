import { defineField, defineType, defineArrayMember } from 'sanity'
import { Sparkles } from 'lucide-react'

export const eventSettings = defineType({
    name: 'eventSettings',
    title: 'Promociones y Descuentos (Precio o %)',
    type: 'document',
    icon: Sparkles,
    fields: [
        defineField({
            name: 'title',
            title: 'Título Interno de la Promoción',
            type: 'string',
            initialValue: 'PROMO DEL 25 AL 30 DE SEP',
            description: 'Nombre para identificar este evento o promoción en el panel de Sanity.'
        }),
        defineField({
            name: 'campaignName',
            title: 'Nombre de la Campaña',
            type: 'string',
            initialValue: 'KI LOVERS – Amor y Amistad',
            description: 'Nombre público de la campaña comercial (ej: "KI LOVERS – Amor y Amistad").'
        }),
        defineField({
            name: 'isActive',
            title: 'Activar Promoción de Descuento',
            type: 'boolean',
            initialValue: false,
            description: '⚠️ EXCLUSIVIDAD: Solo UNA promoción debe estar activa a la vez. Antes de activar esta, asegúrate de desactivar cualquier otra. Si dos están activas, el sistema usa la primera (puede ser una no deseada).'
        }),
        defineField({
            name: 'discountType',
            title: 'Modalidad de Descuento (Precio Fijo o Porcentaje)',
            type: 'string',
            description: 'Elige si el descuento se aplicará como un PORCENTAJE (%) sobre el valor de las telas o como un MONTO FIJO en pesos ($ COP).',
            options: {
                list: [
                    { title: '％ Porcentaje de Descuento (%)', value: 'percentage' },
                    { title: '💲 Monto Fijo en Pesos ($ COP por unidad/kg)', value: 'fixed' },
                ],
                layout: 'radio'
            },
            initialValue: 'percentage'
        }),
        defineField({
            name: 'discountUnit',
            title: 'Unidad de Referencia para la Medición',
            type: 'string',
            description: 'Elige si la promoción se medirá y calculará por KILOGRAMO (peso estimado) o por METRO.',
            options: {
                list: [
                    { title: '⚖️ Descuento por KILOGRAMO (Basado en peso estimado de la tela)', value: 'kg' },
                    { title: '📏 Descuento por METRO (Venta por metro lineal)', value: 'meter' },
                ],
                layout: 'radio'
            },
            initialValue: 'kg'
        }),
        defineField({
            name: 'discountPercentage',
            title: 'Porcentaje de Descuento Base (%)',
            type: 'number',
            initialValue: 3.5,
            description: 'Porcentaje a descontar sobre las telas participantes (ej: 3.5 para 3.5%, 5 para 5%). Se aplica cuando no hay mecánicas por rango o como base.',
            hidden: ({ parent }) => parent?.discountType === 'fixed'
        }),
        defineField({
            name: 'discountPromoPercentage',
            title: 'Porcentaje de Descuento en Productos en Oferta Previa (%)',
            type: 'number',
            description: 'Porcentaje adicional para productos que ya tengan precio de liquidación u oferta previa (opcional).',
            hidden: ({ parent }) => parent?.discountType === 'fixed'
        }),
        defineField({
            name: 'discountNoPromo',
            title: 'Monto Fijo en Productos Sin Oferta ($ COP)',
            type: 'number',
            description: 'Monto en pesos a descontar por cada METRO o KG en referencias con precio regular (ej: 1000).',
            hidden: ({ parent }) => parent?.discountType === 'percentage'
        }),
        defineField({
            name: 'discountPromo',
            title: 'Monto Fijo en Productos Con Oferta ($ COP)',
            type: 'number',
            description: 'Monto en pesos a descontar por cada METRO o KG en referencias con precio de oferta (ej: 3000).',
            hidden: ({ parent }) => parent?.discountType === 'percentage'
        }),
        defineField({
            name: 'tiers',
            title: 'Mecánicas de Descuento / Rangos por Kilos (Tiers)',
            type: 'array',
            description: 'Configura las diferentes mecánicas de la promoción (ej: 1kg a 10kg = 3.5%, 10kg a 20kg + 3 hilos = 5%). Las mecánicas son excluyentes entre sí.',
            initialValue: [
                {
                    _type: 'promotionTier',
                    name: 'KI LOVERS',
                    minKg: 1,
                    maxKg: 10,
                    discountType: 'percentage',
                    discountValue: 3.5,
                    requiresCombo: false,
                    description: '3.5% de Dcto por compras de tela 1Kg A 10 kg. Promo válida del 25 al 30 de septiembre.'
                },
                {
                    _type: 'promotionTier',
                    name: 'KI LOVERS DUO',
                    minKg: 10,
                    maxKg: 20,
                    discountType: 'percentage',
                    discountValue: 5,
                    requiresCombo: true,
                    comboMinQuantity: 3,
                    description: '5% de Dcto por compra de 10Kg a 20kg + 3 Hilos en cualquier color. Promo válida del 25 al 30 de septiembre.'
                }
            ],
            of: [
                defineArrayMember({
                    type: 'object',
                    name: 'promotionTier',
                    title: 'Mecánica de Promoción',
                    fields: [
                        defineField({
                            name: 'name',
                            title: 'Nombre de la Mecánica',
                            type: 'string',
                            description: 'Ej: KI LOVERS, KI LOVERS DUO'
                        }),
                        defineField({
                            name: 'minKg',
                            title: 'Kilos Mínimos de Tela (kg)',
                            type: 'number',
                            description: 'Kilos mínimos de tela requeridos (ej: 1 o 10).'
                        }),
                        defineField({
                            name: 'maxKg',
                            title: 'Kilos Máximos de Tela (kg)',
                            type: 'number',
                            description: 'Kilos máximos de tela permitidos para esta mecánica (ej: 10 o 20).'
                        }),
                        defineField({
                            name: 'discountType',
                            title: 'Tipo de Descuento en esta Mecánica',
                            type: 'string',
                            options: {
                                list: [
                                    { title: '％ Porcentaje (%)', value: 'percentage' },
                                    { title: '💲 Monto Fijo ($ COP)', value: 'fixed' },
                                ],
                                layout: 'radio'
                            },
                            initialValue: 'percentage'
                        }),
                        defineField({
                            name: 'discountValue',
                            title: 'Valor del Descuento (% o $)',
                            type: 'number',
                            description: 'Porcentaje (ej: 3.5 para 3.5% o 5 para 5%) o monto en pesos si es fijo.'
                        }),
                        defineField({
                            name: 'requiresCombo',
                            title: '¿Requiere Producto Adicional en Combo?',
                            type: 'boolean',
                            initialValue: false,
                            description: 'Activa si esta mecánica exige comprar otros productos adicionales (ej: 3 Hilos).'
                        }),
                        defineField({
                            name: 'comboCategory',
                            title: 'Categoría Requerida en Combo',
                            type: 'reference',
                            to: [{ type: 'category' }],
                            description: 'Categoría complementaria requerida (ej: Hilos).',
                            hidden: ({ parent }) => !parent?.requiresCombo
                        }),
                        defineField({
                            name: 'comboMinQuantity',
                            title: 'Cantidad Mínima Requerida del Combo',
                            type: 'number',
                            initialValue: 3,
                            description: 'Cantidad mínima requerida de productos complementarios (ej: 3 hilos en cualquier color).',
                            hidden: ({ parent }) => !parent?.requiresCombo
                        }),
                        defineField({
                            name: 'description',
                            title: 'Descripción / Beneficio de la Mecánica',
                            type: 'string',
                            description: 'Ej: 3.5% de Dcto por compras de tela 1Kg A 10 kg'
                        }),
                    ],
                    preview: {
                        select: {
                            name: 'name',
                            minKg: 'minKg',
                            maxKg: 'maxKg',
                            discountValue: 'discountValue',
                            discountType: 'discountType',
                            requiresCombo: 'requiresCombo',
                            comboMinQuantity: 'comboMinQuantity'
                        },
                        prepare({ name, minKg, maxKg, discountValue, discountType, requiresCombo, comboMinQuantity }) {
                            const sym = discountType === 'fixed' ? '$' : '%'
                            const combo = requiresCombo ? ` + ${comboMinQuantity || ''} combo` : ''
                            return {
                                title: `${name || 'Mecánica'} (${discountValue || 0}${sym} Dcto)`,
                                subtitle: `${minKg || 0}kg a ${maxKg || 0}kg de tela${combo}`
                            }
                        }
                    }
                })
            ]
        }),
        defineField({
            name: 'eventTag',
            title: 'Etiqueta del Evento / Badge (Tag)',
            type: 'string',
            initialValue: 'KI LOVERS',
            description: 'Texto que aparecerá como etiqueta destacada en los productos, carrito y checkout (ej: "KI LOVERS", "PROMO POR METRO").'
        }),
        defineField({
            name: 'applicableCategories',
            title: 'Categorías de Tela Participantes (Telas que aplican)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'category' }] }],
            description: 'Selecciona las categorías participantes (ej: Brush Standard, Brush Premium, Suavetina, Satín, Antifluido, Poly Licra, Seda de Mango).'
        }),
        defineField({
            name: 'applicableProducts',
            title: 'Productos Específicos Participantes (Opcional)',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
            description: 'Opcional. Selecciona productos individuales específicos a los que se aplicará el descuento. Si se deja vacío, aplica a todas las telas de las categorías seleccionadas.'
        }),
        defineField({
            name: 'startDate',
            title: 'Fecha de Inicio',
            type: 'datetime',
            initialValue: '2026-09-25T00:00:00.000Z',
            description: 'Fecha y hora exactas en que la promoción se activa de forma automática.'
        }),
        defineField({
            name: 'endDate',
            title: 'Fecha de Fin',
            type: 'datetime',
            initialValue: '2026-09-30T23:59:59.000Z',
            description: 'Fecha y hora exactas en que la promoción termina.'
        }),
        defineField({
            name: 'termsAndConditions',
            title: 'Términos y Condiciones (T&C)',
            type: 'text',
            rows: 14,
            initialValue: `Vigencia: Del 25 al 30 de septiembre de 2026.
Campaña: KI LOVERS – Amor y Amistad.

• La promoción es válida únicamente del 25 al 30 de septiembre de 2026 y aplica para Puntos de ventas físicos y Tienda Virtual.
• La promoción está sujeta a disponibilidad de inventario de las referencias participantes (Brush, Suavetina, Satín, Antifluido, Poly licra, Seda mango // Unicolor y Sublimado).
• El Descuento del 3.5% solo aplica para CLIENTES RETAIL que compren entre 1kg a 10kg de tela en las referencias seleccionadas y se aplicará sobre el valor total de la tela facturada.
• El Descuento del 5% es válido para CLIENTES RETAIL que compren entre 10kg y 20kg de tela en las referencias seleccionadas + 3 HILOS en cualquier color y están sujetos a disponibilidad de inventario. Para el combo el descuento del 5% se aplicará directamente al valor total de la tela facturada.
• Las mecánicas son excluyentes entre sí y se aplicará únicamente el beneficio correspondiente al rango de kilos adquirido.
• Los kilos de tela deberán estar registrados en una misma factura para determinar la mecánica aplicable.
• La promoción va dirigida a CLIENTE RETAIL por lo tanto no es acumulable con otros descuentos, promociones, acuerdos de 2do, 3er y 4to precio o beneficios comerciales los cuales estén dirigidos a clientes MAYORISTAS.
• Los descuentos no aplican para programaciones de sublimados solo para producto disponible en stock de los puntos de venta y tienda virtual.
• Los beneficios promocionales no son canjeables por dinero ni transferibles.
• La compañía se reserva el derecho de verificar el cumplimiento de las condiciones de la promoción antes de aplicar el beneficio.
• Cualquier situación no contemplada en estos términos será definida por la Gerencia Comercial de Telas Real.
• La promoción aplica únicamente para las compras que cumplan las condiciones establecidas en cada mecánica.`,
            description: 'Términos y condiciones oficiales de la campaña promocional.'
        }),
    ],
    preview: {
        select: {
            title: 'title',
            isActive: 'isActive',
            discountType: 'discountType',
            discountUnit: 'discountUnit',
            discountPercentage: 'discountPercentage',
            discountNoPromo: 'discountNoPromo',
            eventTag: 'eventTag'
        },
        prepare(selection) {
            const { title, isActive, discountType, discountUnit, discountPercentage, discountNoPromo, eventTag } = selection
            const isPct = discountType === 'percentage'
            const valueText = isPct ? `${discountPercentage || 0}%` : `$${(discountNoPromo || 0).toLocaleString('es-CO')}`
            const unitLabel = discountUnit === 'kg' ? '⚖️ Por KG' : '📏 Por Metro'
            return {
                title: title || 'Promoción de Descuento',
                subtitle: isActive 
                    ? `🟢 Activo · ${valueText} (${unitLabel})${eventTag ? ` · Tag: ${eventTag}` : ''}` 
                    : `🔴 Inactivo · ${valueText} (${unitLabel})`,
                media: Sparkles
            }
        }
    }
})
