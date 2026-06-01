import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import resend from "@/lib/resend";

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "El correo es requerido" },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await client.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email }
        );

        // ALWAYS return success even if user doesn't exist to prevent email enumeration
        if (!user) {
            return NextResponse.json(
                { message: "Si el correo existe, se ha enviado un código de recuperación." },
                { status: 200 }
            );
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Expiry in 15 minutes
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 15);

        // Update user document
        await client.patch(user._id)
            .set({ 
                resetCode,
                resetCodeExpiry: expiryDate.toISOString() 
            })
            .commit();

        // minimalist email template
        const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; background-color: #ffffff; color: #333333;">
            <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 2px; margin-bottom: 30px; color: #111827;">TELAS REAL</h1>
            <p style="font-size: 16px; font-weight: 300; line-height: 1.6; margin-bottom: 30px;">
                Has solicitado restablecer tu contraseña. Utiliza el siguiente código de verificación. Este código expira en 15 minutos.
            </p>
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <span style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #111827;">${resetCode}</span>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 40px;">
                Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                <p style="font-size: 12px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} Telas Real. Todos los derechos reservados.
                </p>
            </div>
        </div>
        `;

        // Send email
        await resend.emails.send({
            from: 'Telas Real <soporte@telasreal.com>', // MUST BE VERIFIED SENDER
            to: email,
            subject: 'Código de Recuperación de Contraseña',
            html: htmlTemplate,
        });

        return NextResponse.json(
            { message: "Si el correo existe, se ha enviado un código de recuperación." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
