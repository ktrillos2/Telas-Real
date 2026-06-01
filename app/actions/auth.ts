"use server"

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
        // WordPress integration removed by user request.
        // User registration is currently disabled since there's no database.
        return { success: false, message: "El registro de nuevos usuarios está deshabilitado temporalmente." }
    } catch (error: any) {
        return { success: false, message: error.message || "Error al registrar usuario" }
    }
}
