import { defineField, defineType } from 'sanity'
import { ShoppingBag } from 'lucide-react'

export const homeStore = defineType({
    name: 'homeStore',
    title: 'Configuración Tienda Inicio',
    type: 'document',
    icon: ShoppingBag,
    fields: [
        defineField({
            name: 'sublimadosProducts',
            title: 'Productos Sublimados (Inicio)',
            description: 'Selecciona los productos que se mostrarán en la pestaña SUBLIMADOS de la página de inicio.',
            type: 'array',
            of: [
                {
                    type: 'reference',
                    to: [{ type: 'product' }]
                }
            ],
            validation: (Rule) => Rule.max(12)
        }),
        defineField({
            name: 'unicolorProducts',
            title: 'Productos Unicolor (Inicio)',
            description: 'Selecciona los productos que se mostrarán en la pestaña UNICOLOR de la página de inicio.',
            type: 'array',
            of: [
                {
                    type: 'reference',
                    to: [{ type: 'product' }]
                }
            ],
            validation: (Rule) => Rule.max(12)
        }),
    ],
    preview: {
        prepare() {
            return {
                title: 'Configuración Tienda Inicio',
            }
        }
    }
})
