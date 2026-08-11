
import { defineField, defineType } from 'sanity'
import { User } from 'lucide-react'
import { ResetMayoristaButton } from '../components/ResetMayoristaButton'

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
            title: 'Contraseña (Hashed o Texto Plano)',
            type: 'string',
            description: 'Para crear manualmente, escribe la contraseña; el sistema permitirá el login y forzará el cambio.',
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
                    { title: 'Mayorista', value: 'mayorista' },
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
            name: 'resetCode',
            title: 'Código de Recuperación',
            type: 'string',
            hidden: true,
        }),
        defineField({
            name: 'resetCodeExpiry',
            title: 'Expiración del Código',
            type: 'datetime',
            hidden: true,
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
        defineField({
            name: 'wholesaleData',
            title: 'Información Mayorista',
            type: 'object',
            hidden: ({document}) => document?.role !== 'mayorista',
            fields: [
                { name: 'cliente', type: 'string', title: 'Cliente' },
                { name: 'encargado', type: 'string', title: 'Encargado' },
                { name: 'cedula', type: 'string', title: 'Cédula / NIT' },
                { name: 'direccion', type: 'string', title: 'Dirección' },
                { name: 'telefono', type: 'string', title: 'Teléfono' },
                { name: 'facturacion', type: 'string', title: 'Facturación' },
                { name: 'acuerdo_mt', type: 'string', title: 'Acuerdo $ MT' },
                { name: 'acuerdo_kg', type: 'string', title: 'Acuerdo $ KG' },
                { name: 'volumen_mes_kg', type: 'number', title: 'Volumen Mes KG Brush P' },
                { name: 'volumen_mes_mt', type: 'number', title: 'Volumen Mes MT Brush P' },
                { 
                    name: 'volumen_compra_kg', 
                    type: 'number', 
                    title: 'Compra Mínima en KG (Por Pedido)',
                    description: 'La cantidad mínima de kilos que este usuario debe pedir en cada compra individual.'
                },
                { name: 'acuerdo_kg_mes', type: 'string', title: 'Acuerdo KG Brush P Mes $' },
                { name: 'tiempos', type: 'string', title: 'Tiempos (Condiciones)' },
                { name: 'brush_kg_cumplido', type: 'number', title: 'Brush KG Cumplido' },
                { name: 'brush_mt_cumplido', type: 'number', title: 'Brush MT Cumplido' },
                { name: 'cuanto_falto_kg', type: 'number', title: 'Cuánto le faltó en KG' },
                { name: 'cuanto_falto_mt', type: 'number', title: 'Cuánto le faltó en MT' },
                { name: 'cuanto_falto_dinero', type: 'string', title: 'Cuánto le faltó en $' },
                { 
                    name: 'mensaje_personalizado', 
                    type: 'text', 
                    title: 'Mensaje Personalizado',
                    description: 'Escribe el mensaje de saludo y avance que verá el cliente al iniciar sesión.'
                },
                {
                    name: 'reset_button',
                    type: 'string',
                    title: 'Reiniciar Conteo',
                    components: {
                        input: ResetMayoristaButton
                    }
                },
                {
                    name: 'historial_meses',
                    type: 'array',
                    title: 'Historial de Avance por Mes',
                    description: 'Registra los meses (Junio, Julio, Agosto...) para mostrar el avance del cliente en la tabla.',
                    of: [
                        {
                            type: 'object',
                            title: 'Registro Mensual',
                            fields: [
                                { name: 'mes', type: 'string', title: 'Mes (ej: JUNIO, JULIO)' },
                                { name: 'kg', type: 'number', title: 'KG Comprados' },
                                { name: 'mt', type: 'number', title: 'MT Comprados' },
                                { name: 'cuanto_va_dinero', type: 'string', title: 'Cuánto va en $' },
                                { name: 'falta_kg', type: 'number', title: 'Cuánto le falta en KG' },
                                { name: 'falta_mt', type: 'number', title: 'Cuánto le falta en MT' },
                                { name: 'falta_dinero', type: 'string', title: 'Cuánto le falta en $' }
                            ],
                            preview: {
                                select: {
                                    title: 'mes',
                                    subtitle: 'cuanto_va_dinero'
                                }
                            }
                        }
                    ]
                }
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
