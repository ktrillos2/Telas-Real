"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getCustomerByEmail, createCustomer } from "@/lib/wordpress-orders"

export async function getCustomerData() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return null
    }

    try {
        const customer = await getCustomerByEmail(session.user.email)
        return customer
    } catch (error) {
        console.error("Error fetching customer data:", error)
        return null
    }
}

export async function updateCustomerAddress(type: 'billing' | 'shipping', data: any) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return { success: false, message: "No has iniciado sesión" }
    }

    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        return { success: false, message: "Error de configuración del servidor" }
    }

    const baseUrl = url.replace(/\/$/, "");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
        // First get the customer ID
        let customer = await getCustomerByEmail(session.user.email)

        // If customer doesn't exist, try to create it
        if (!customer) {
            try {
                console.log("Customer not found, creating new customer for:", session.user.email);
                customer = await createCustomer({
                    email: session.user.email,
                    first_name: data.first_name || session.user.name?.split(' ')[0] || '',
                    last_name: data.last_name || session.user.name?.split(' ').slice(1).join(' ') || '',
                })
            } catch (createError) {
                console.error("Error creating customer during address update:", createError);
                return { success: false, message: "No se pudo crear el perfil del cliente. Por favor contacta soporte." }
            }
        }

        if (!customer || !customer.id) {
            return { success: false, message: "Error al identificar al cliente" }
        }

        const response = await fetch(`${baseUrl}/wp-json/wc/v3/customers/${customer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify({
                [type]: data
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, message: error.message || "Error al actualizar la dirección" }
        }

        return { success: true, message: "Dirección actualizada correctamente" }
    } catch (error: any) {
        console.error("Error updating customer address:", error)
        return { success: false, message: "Error al actualizar la dirección" }
    }
}

export async function updateCustomerProfile(data: { first_name: string; last_name: string; email: string; username?: string }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return { success: false, message: "No has iniciado sesión" }
    }

    const url = process.env.WORDPRESS_API_URL;
    const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
    const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
        return { success: false, message: "Error de configuración del servidor" }
    }

    const baseUrl = url.replace(/\/$/, "");
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    try {
        const customer = await getCustomerByEmail(session.user.email)
        if (!customer) {
            return { success: false, message: "Cliente no encontrado" }
        }

        const response = await fetch(`${baseUrl}/wp-json/wc/v3/customers/${customer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${auth}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, message: error.message || "Error al actualizar el perfil" }
        }

        return { success: true, message: "Perfil actualizado correctamente" }
    } catch (error: any) {
        console.error("Error updating customer profile:", error)
        return { success: false, message: "Error al actualizar el perfil" }
    }
}
