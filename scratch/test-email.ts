import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use require to ensure it's loaded AFTER dotenv
const { sendOrderEmail } = require('../lib/email-notifications');

async function test() {
    const email = 'ktrillos2@gmail.com';
    console.log("🚀 Starting test email to:", email);

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
        console.log("📦 Sending email...");
        const result = await sendOrderEmail(testOrder, 'processing');
        console.log("✅ Result:", JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error("❌ Failed:", error);
    }
}

test();
