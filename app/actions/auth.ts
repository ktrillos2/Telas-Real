"use server"

import { createCustomer } from "@/lib/wordpress-orders"

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm") as string

    if (!email || !password || !confirmPassword) {
        return { success: false, message: "Todos los campos son obligatorios" }
    }

    if (password !== confirmPassword) {
        return { success: false, message: "Las contraseñas no coinciden" }
    }

    try {
        await createCustomer({ email, password })
        return { success: true, message: "Usuario registrado correctamente. Por favor inicia sesión." }
    } catch (error: any) {
        return { success: false, message: error.message || "Error al registrar usuario" }
    }
}
