
import { defineField, defineType } from 'sanity'
import { User } from 'lucide-react'

export const user = defineType({
    name: 'user',
    title: 'Usuarios',
    type: 'document',
    icon: User,
    fields: [
        defineField({
            name: 'name',
            title: 'Nombre',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'password',
            title: 'Contraseña (Hashed)',
            type: 'string',
            hidden: true, // Hide from UI to prevent accidental edits
        }),
        defineField({
            name: 'image',
            title: 'Imagen de Perfil',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'role',
            title: 'Rol',
            type: 'string',
            options: {
                list: [
                    { title: 'Usuario', value: 'user' },
                    { title: 'Administrador', value: 'admin' },
                ],
                layout: 'radio'
            },
            initialValue: 'user',
        }),
        defineField({
            name: 'forcePasswordChange',
            title: 'Forzar Cambio de Contraseña',
            type: 'boolean',
            initialValue: false,
            description: 'Si está activado, el usuario debe cambiar su contraseña en el próximo inicio de sesión.'
        }),
        defineField({
            name: 'emailVerified',
            title: 'Email Verificado',
            type: 'datetime',
        }),
        defineField({
            name: 'purchases',
            title: 'Número de Compras',
            type: 'number',
            readOnly: true,
            initialValue: 0
        }),
        defineField({
            name: 'billingAddress',
            title: 'Dirección de Facturación',
            type: 'object',
            fields: [
                { name: 'firstName', type: 'string', title: 'Nombre' },
                { name: 'lastName', type: 'string', title: 'Apellido' },
                { name: 'company', type: 'string', title: 'Empresa' },
                { name: 'address', type: 'string', title: 'Dirección' },
                { name: 'apartment', type: 'string', title: 'Apartamento' },
                { name: 'city', type: 'string', title: 'Ciudad' },
                { name: 'region', type: 'string', title: 'Departamento' },
                { name: 'zipCode', type: 'string', title: 'Código Postal' },
                { name: 'phone', type: 'string', title: 'Teléfono' },
                { name: 'email', type: 'string', title: 'Email' },
                { name: 'documentId', type: 'string', title: 'Documento' }
            ]
        }),
        defineField({
            name: 'shippingAddress',
            title: 'Dirección de Envío',
            type: 'object',
            fields: [
                { name: 'firstName', type: 'string', title: 'Nombre' },
                { name: 'lastName', type: 'string', title: 'Apellido' },
                { name: 'company', type: 'string', title: 'Empresa' },
                { name: 'address', type: 'string', title: 'Dirección' },
                { name: 'apartment', type: 'string', title: 'Apartamento' },
                { name: 'city', type: 'string', title: 'Ciudad' },
                { name: 'region', type: 'string', title: 'Departamento' },
                { name: 'zipCode', type: 'string', title: 'Código Postal' },
            ]
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'email',
            media: 'image',
        }
    }
})
