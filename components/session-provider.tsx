"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextAuthSessionProvider
            // No re-consultar la sesión al volver a la pestaña (principal causa de spam)
            refetchOnWindowFocus={false}
            // Re-consultar cada 5 minutos en lugar de cada 30 segundos (valor por defecto)
            refetchInterval={300}
        >
            {children}
        </NextAuthSessionProvider>
    )
}

