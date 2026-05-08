
import { NextResponse } from 'next/server';
import { sendOrderEmail } from '@/lib/email-notifications';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'ktrillos2@gmail.com';

    console.log("Triggering test email to:", email);

    const testOrder = {
        id: "TEST-" + Math.floor(Math.random() * 10000),
        number: "00001",
        status: 'pending',
        date_created: new Date().toISOString(),
        total: "150000",
        currency: 'COP',
        billing: {
            first_name: "Keyner",
            last_name: "Trillos",
            email: email,
            phone: "3001234567",
            address_1: "Calle Falsa 123",
            city: "Cúcuta",
            state: "Norte de Santander",
            postcode: "540001",
            country: 'CO'
        },
        line_items: [
            {
                name: "Tela Satin Premium (Prueba)",
                quantity: 2,
                price: 75000,
                total: "150000"
            }
        ],
        payment_method_title: 'Wompi'
    };

    try {
        const result = await sendOrderEmail(testOrder, 'processing');
        return NextResponse.json({ 
            message: "Test email process completed", 
            result,
            env_check: {
                has_resend_key: !!process.env.RESEND_API_KEY,
                resend_key_prefix: process.env.RESEND_API_KEY?.substring(0, 7)
            }
        });
    } catch (error: any) {
        console.error("Test email route failed:", error);
        return NextResponse.json({ 
            error: error.message || "Unknown error",
            stack: error.stack
        }, { status: 500 });
    }
}
