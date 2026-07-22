import { NextResponse } from 'next/server';
import { sendLabsMobileSms } from '@/lib/labsmobile';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { phone, message } = data;

        if (!phone || !message) {
            return NextResponse.json({ success: false, error: "Teléfono y mensaje son obligatorios" }, { status: 400 });
        }

        const result = await sendLabsMobileSms(phone, message, 'manual');

        if (result.success) {
            return NextResponse.json({ success: true, message: "SMS enviado correctamente." }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: result.message }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Manual SMS Error:", error);
        return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
    }
}
