import React, { useState } from 'react'
import { Card, Text, Box, TextInput, TextArea, Button, Stack, Container, ToastProvider, useToast } from '@sanity/ui'
import { MessageSquare } from 'lucide-react'

function SmsSenderInner() {
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const toast = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!phone || !message) {
            toast.push({
                status: 'error',
                title: 'Error',
                description: 'El teléfono y el mensaje son obligatorios.'
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/sms/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, message })
            })

            const data = await response.json()

            if (data.success) {
                toast.push({
                    status: 'success',
                    title: 'Enviado',
                    description: 'El SMS se envió correctamente.'
                })
                setPhone('')
                setMessage('')
            } else {
                throw new Error(data.error || 'Error al enviar SMS')
            }
        } catch (error: any) {
            toast.push({
                status: 'error',
                title: 'Fallo al enviar',
                description: error.message
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Container width={1} padding={4}>
            <Card padding={4} radius={2} shadow={1}>
                <Stack space={4}>
                    <Box paddingBottom={2}>
                        <Text size={3} weight="bold">
                            Enviar SMS Manual (LabsMobile)
                        </Text>
                        <Box marginTop={2}>
                            <Text size={1} muted>
                                Envía mensajes de texto instantáneos a clientes. Los envíos quedarán registrados en el historial de SMS.
                            </Text>
                        </Box>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Stack space={4}>
                            <Box>
                                <Text size={1} weight="semibold" style={{ marginBottom: '8px', display: 'block' }}>
                                    Número de Teléfono (con código de país, ej. +573001234567)
                                </Text>
                                <TextInput
                                    value={phone}
                                    onChange={(e) => setPhone(e.currentTarget.value)}
                                    placeholder="+57 300 000 0000"
                                />
                            </Box>
                            
                            <Box>
                                <Text size={1} weight="semibold" style={{ marginBottom: '8px', display: 'block' }}>
                                    Mensaje (Máximo 160 caracteres recomendado)
                                </Text>
                                <TextArea
                                    value={message}
                                    onChange={(e) => setMessage(e.currentTarget.value)}
                                    placeholder="Escribe el mensaje de texto aquí..."
                                    rows={4}
                                />
                            </Box>

                            <Box>
                                <Button
                                    type="submit"
                                    text={isSubmitting ? "Enviando..." : "Enviar SMS"}
                                    tone="primary"
                                    icon={MessageSquare}
                                    disabled={isSubmitting}
                                />
                            </Box>
                        </Stack>
                    </form>
                </Stack>
            </Card>
        </Container>
    )
}

export function SmsSender() {
    return (
        <ToastProvider>
            <SmsSenderInner />
        </ToastProvider>
    )
}
