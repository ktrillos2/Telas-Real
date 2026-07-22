import { client } from "@/sanity/lib/client";

export async function sendLabsMobileSms(recipientPhone: string, messageText: string, type: 'automated_abandoned_cart' | 'manual', relatedOrderId?: string) {
    const username = process.env.LABSMOBILE_USERNAME;
    const token = process.env.LABSMOBILE_TOKEN;

    if (!username || !token) {
        console.error("Faltan credenciales de LabsMobile en las variables de entorno.");
        return { success: false, error: "Credenciales faltantes" };
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${token}`).toString('base64');
    
    // Clean phone number (remove spaces, +, etc)
    const cleanedPhone = recipientPhone.replace(/\D/g, '');

    const payload = {
        message: messageText,
        tpoa: "Telas Real",
        recipient: [
            {
                msisdn: cleanedPhone
            }
        ]
    };

    let apiResultCode = "";
    let apiResultMessage = "";
    let isSuccess = false;

    try {
        const response = await fetch("https://api.labsmobile.com/json/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // LabsMobile returns code 0 for success
        if (data && data.code === "0" || data.code === 0) {
            isSuccess = true;
        }

        apiResultCode = String(data?.code ?? "Desconocido");
        apiResultMessage = String(data?.message ?? "Sin mensaje");

    } catch (error: any) {
        console.error("Error al enviar SMS LabsMobile:", error);
        apiResultCode = "Exception";
        apiResultMessage = error.message || "Error desconocido";
    }

    // Registrar en Sanity
    try {
        const logData: any = {
            _type: 'smsLog',
            recipientPhone: cleanedPhone,
            message: messageText,
            type: type,
            status: isSuccess ? 'sent' : 'failed',
            responseCode: `${apiResultCode}: ${apiResultMessage}`,
            sentAt: new Date().toISOString()
        };

        if (relatedOrderId && type === 'automated_abandoned_cart') {
            logData.relatedOrder = {
                _type: 'reference',
                _ref: relatedOrderId
            };
        }

        await client.create(logData);
    } catch (sanityError) {
        console.error("Error guardando el registro del SMS en Sanity:", sanityError);
    }

    return { success: isSuccess, code: apiResultCode, message: apiResultMessage };
}
