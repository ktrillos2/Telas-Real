"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import { registerUser } from "@/app/actions/auth"

export function AuthTabs() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Login State
    const [loginEmail, setLoginEmail] = useState("")
    const [loginPassword, setLoginPassword] = useState("")

    // Register State
    const [registerEmail, setRegisterEmail] = useState("")
    const [registerPassword, setRegisterPassword] = useState("")
    const [registerConfirm, setRegisterConfirm] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                username: loginEmail,
                password: loginPassword,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Error de inicio de sesión. Verifica tus credenciales.")
            } else {
                toast.success("Inicio de sesión exitoso")
                router.refresh()
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData()
        formData.append("email", registerEmail)
        formData.append("password", registerPassword)
        formData.append("confirm", registerConfirm)

        try {
            const result = await registerUser(formData)
            if (result.success) {
                toast.success(result.message)
                // Switch to login tab or clear form
                setRegisterEmail("")
                setRegisterPassword("")
                setRegisterConfirm("")
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al registrar usuario")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="login-email">Usuario o Correo</Label>
                        <Input
                            id="login-email"
                            type="text"
                            placeholder="usuario@ejemplo.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="login-password">Contraseña</Label>
                        <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                        {isLoading ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                </form>
                <Button variant="link" className="w-full text-sm font-light">
                    ¿Olvidaste tu contraseña?
                </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="register-email">Correo Electrónico</Label>
                        <Input
                            id="register-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <Input
                            id="register-password"
                            type="password"
                            placeholder="••••••••"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="register-confirm">Confirmar Contraseña</Label>
                        <Input
                            id="register-confirm"
                            type="password"
                            placeholder="••••••••"
                            value={registerConfirm}
                            onChange={(e) => setRegisterConfirm(e.target.value)}
                            required
                        />
                    </div>
                    <p className="text-xs font-light text-muted-foreground">
                        Al registrarte, recibirás un correo de verificación para activar tu cuenta.
                    </p>
                    <Button className="w-full" size="lg" type="submit" disabled={isLoading}>
                        {isLoading ? "Registrando..." : "Registrarse"}
                    </Button>
                </form>
            </TabsContent>
        </Tabs>
    )
}
