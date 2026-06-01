"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import { Mail, Lock, User, ArrowLeft, KeyRound, Loader2 } from "lucide-react"

type AuthState = "login" | "register" | "forgot_password" | "verify_code" | "reset_password"

interface AuthDrawerProps {
  children: React.ReactNode
}

export function AuthDrawer({ children }: AuthDrawerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AuthState>("login")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const resetForms = () => {
    setEmail("")
    setPassword("")
    setName("")
    setCode("")
    setNewPassword("")
    setIsLoading(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setView("login")
        resetForms()
      }, 300)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        toast.error("Credenciales incorrectas")
      } else {
        toast.success("Inicio de sesión exitoso")
        setOpen(false)
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

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Cuenta creada exitosamente. Iniciando sesión...")
        await signIn("credentials", {
          redirect: false,
          email,
          password,
        })
        setOpen(false)
        router.refresh()
      } else {
        toast.error(data.message || "Error al registrarse")
      }
    } catch (error) {
      toast.error("Error al registrarse")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        toast.success("Si el correo existe, hemos enviado un código de recuperación")
        setView("verify_code")
      } else {
        toast.error("Error al solicitar recuperación")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Contraseña actualizada exitosamente")
        setView("login")
        setPassword("") // Clear old password
        setNewPassword("")
        setCode("")
      } else {
        toast.error(data.message || "Error al actualizar contraseña")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col overflow-y-auto p-6 pt-12 sm:p-8 sm:pt-14">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle className="text-2xl font-light text-center">
            {view === "login" && "Iniciar Sesión"}
            {view === "register" && "Crear Cuenta"}
            {view === "forgot_password" && "Recuperar Contraseña"}
            {view === "verify_code" && "Ingresar Código"}
            {view === "reset_password" && "Nueva Contraseña"}
          </SheetTitle>
        </SheetHeader>

        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button 
                  type="button" 
                  onClick={() => setView("forgot_password")}
                  className="text-xs text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ingresar
            </Button>
            <div className="text-center mt-6 text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <button 
                type="button" 
                onClick={() => setView("register")}
                className="text-primary hover:underline font-medium"
              >
                Regístrate
              </button>
            </div>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="reg-name" 
                  placeholder="Tu nombre" 
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="reg-email" 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="reg-password" 
                  type="password" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Cuenta
            </Button>
            <div className="text-center mt-6 text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <button 
                type="button" 
                onClick={() => setView("login")}
                className="text-primary hover:underline font-medium"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        )}

        {view === "forgot_password" && (
          <form onSubmit={handleForgotPassword} className="space-y-4 flex-1">
            <p className="text-sm text-muted-foreground text-center mb-6">
              Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
            </p>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="forgot-email" 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar Código
            </Button>
            <button 
              type="button" 
              onClick={() => setView("login")}
              className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
            </button>
          </form>
        )}

        {view === "verify_code" && (
          <form onSubmit={(e) => { e.preventDefault(); setView("reset_password") }} className="space-y-4 flex-1">
            <p className="text-sm text-muted-foreground text-center mb-6">
              Hemos enviado un código de 6 dígitos a <br/>
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificación</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="code" 
                  type="text" 
                  placeholder="123456" 
                  className="pl-10 text-center tracking-widest text-lg"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required 
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 mt-6" disabled={code.length !== 6}>
              Verificar Código
            </Button>
            <button 
              type="button" 
              onClick={() => setView("forgot_password")}
              className="flex items-center justify-center gap-2 w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar correo
            </button>
          </form>
        )}

        {view === "reset_password" && (
          <form onSubmit={handleResetPassword} className="space-y-4 flex-1">
            <p className="text-sm text-muted-foreground text-center mb-6">
              El código ha sido verificado. Ahora puedes establecer tu nueva contraseña.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="new-password" 
                  type="password" 
                  className="pl-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Actualizar Contraseña
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
