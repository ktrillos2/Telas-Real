import { defineField, defineType } from 'sanity'
import { MessageCircle } from 'lucide-react'
import { DEFAULT_WHATSAPP_MESSAGES, type WhatsAppMessageKey } from '../../lib/whatsapp/messages'

/**
 * Textos de los mensajes automáticos de WhatsApp (documento único "whatsappMessages").
 * Vacío = se usa el texto por defecto (lib/whatsapp/messages.ts).
 */

const VARIABLES_PEDIDO = '{nombre} cliente · {pedido} número · {total} total (pagado / a pagar) · {productos} lista · {direccion} · {transportadora} · {enlacePedido} · {enlacesResena} enlaces para calificar'

const field = (name: WhatsAppMessageKey, title: string, description: string, group: string) =>
    defineField({
        name,
        title,
        type: 'text',
        rows: 10,
        group,
        description: `${description} Déjalo vacío para usar el texto por defecto. *negrita*, _cursiva_.`,
        initialValue: DEFAULT_WHATSAPP_MESSAGES[name],
    })

export const whatsappMessages = defineType({
    name: 'whatsappMessages',
    title: 'Mensajes automáticos de WhatsApp',
    type: 'document',
    icon: MessageCircle,
    groups: [
        { name: 'pedidos', title: 'Pedidos', default: true },
        { name: 'bot', title: 'Respuestas del bot' },
    ],
    fields: [
        field('confirmacionEnvio', 'Compra confirmada (envío a domicilio)', `Se envía al confirmarse el pago o el pedido contraentrega. Variables: ${VARIABLES_PEDIDO}.`, 'pedidos'),
        field('confirmacionRecoger', 'Compra confirmada (recoger en tienda)', `Igual que la anterior, para pedidos que se recogen en la tienda. Variables: ${VARIABLES_PEDIDO}.`, 'pedidos'),
        field('despacho', 'Pedido enviado', 'Al marcar el pedido como "Enviado". Variables: {nombre} · {pedido} · {transportadora} · {guia} número de guía · {enlaceRastreo}. Si el pedido no tiene guía, las líneas con {guia} y {enlaceRastreo} se quitan solas.', 'pedidos'),
        field('listoParaRecoger', 'Pedido listo para recoger', 'Al marcar como "Enviado" un pedido de recoger en tienda. Variables: {nombre} · {pedido}.', 'pedidos'),
        field('encuesta', 'Pedido entregado: agradecimiento y encuesta', 'Al marcar el pedido como "Entregado". Debe pedir responder con un número del 1 al 5 (el bot reconoce la respuesta). Variables: {nombre} · {pedido} · {enlacesResena}.', 'pedidos'),
        field('botBienvenida', 'Bienvenida y menú (cuando el cliente saluda)', 'Respuesta a "hola", "menú", "buenas"... Mantén las opciones 1 a 5: el bot responde a cada número con los textos de abajo.', 'bot'),
        field('botMenuPorDefecto', 'Menú por defecto (otros mensajes)', 'Respuesta a cualquier otro mensaje; se envía como máximo una vez cada 6 horas por chat.', 'bot'),
        field('botOpcionPedido', 'Opción 1: estado del pedido', 'Respuesta al número 1.', 'bot'),
        field('botOpcionEnvios', 'Opción 2: envíos', 'Respuesta al número 2 o a mensajes con "envío", "guía", "Coordinadora".', 'bot'),
        field('botOpcionUbicacion', 'Opción 3: ubicación y horarios', 'Respuesta al número 3 o a mensajes con "horario", "dirección", "ubicación".', 'bot'),
        field('botOpcionCatalogo', 'Opción 4: catálogo', 'Respuesta al número 4 o a mensajes con "catálogo".', 'bot'),
        field('botOpcionAsesor', 'Opción 5: hablar con un asesor', 'Respuesta al número 5 o a mensajes con "asesor".', 'bot'),
        field('botGraciasCalificacionAlta', 'Gracias por calificación de 4 o 5', 'Respuesta a la encuesta con nota 4 o 5. Variables: {nota} número · {estrellas} ⭐⭐⭐⭐.', 'bot'),
        field('botGraciasCalificacionBaja', 'Gracias por calificación de 1 a 3', 'Respuesta a la encuesta con nota de 1 a 3; conviene pedir que cuente qué pasó (ese mensaje se guarda en el pedido y llega por correo). Variables: {nota} · {estrellas}.', 'bot'),
        field('botGraciasComentario', 'Gracias por el comentario', 'Respuesta al comentario que envía el cliente después de una nota baja.', 'bot'),
    ],
    preview: {
        prepare: () => ({ title: 'Mensajes automáticos de WhatsApp' }),
    },
})
