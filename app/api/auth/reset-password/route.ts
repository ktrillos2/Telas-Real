import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import bcrypt from "bcrypt";

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json(
                { message: "Faltan datos requeridos" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: "La contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            );
        }

        // Fetch user
        const user = await client.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email }
        );

        if (!user) {
            return NextResponse.json(
                { message: "Código inválido o expirado" },
                { status: 400 }
            );
        }

        // Verify code
        if (user.resetCode !== code) {
            return NextResponse.json(
                { message: "El código es incorrecto" },
                { status: 400 }
            );
        }

        // Verify expiry
        if (!user.resetCodeExpiry || new Date(user.resetCodeExpiry) < new Date()) {
            return NextResponse.json(
                { message: "El código ha expirado" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await client.patch(user._id)
            .set({ password: hashedPassword })
            .unset(['resetCode', 'resetCodeExpiry'])
            .commit();

        return NextResponse.json(
            { message: "Contraseña actualizada exitosamente" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
