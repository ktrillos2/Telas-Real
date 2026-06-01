"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updatePassword } from "@/app/actions/customer"
import { Loader2 } from "lucide-react"

export default function ChangePasswordPage() {
    const router = useRouter()
    const { data: session } = useSession()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden")
            return
        }

        if (password.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres")
            return
        }

        setIsLoading(true)

        try {
            const result = await updatePassword(password)

            if (result.success) {
                toast.success("Contraseña actualizada correctamente")
                // Force logout or better, update session? 
                // For safety, let's keep them logged in but redirect if possible, 
                // but since we rely on session for 'forcePasswordChange', we need to make sure backend cleared it.
                // Assuming updatePassword clears specific field.

                // Refresh session or redirect
                // Ideally we should reload session.
                router.push('/cuenta')
                router.refresh()
            } else {
                toast.error(result.error || "Error al actualizar contraseña")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid items-center justify-center bg-muted/20 p-4">
            <div className="w-full max-w-md bg-white border border-border rounded-xl p-8 shadow-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Cambio de Contraseña Requerido</h1>
                    <p className="text-muted-foreground text-sm">
                        Por razones de seguridad, debes cambiar tu contraseña temporal antes de continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirmar Contraseña</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            "Actualizar Contraseña"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
