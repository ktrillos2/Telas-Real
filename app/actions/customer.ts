"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { client } from "@/sanity/lib/client"

export async function getCustomerData() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return null
    }

    try {
        const user = await client.fetch(
            `*[_type == "user" && email == $email][0]{
                name,
                email,
                billingAddress,
                shippingAddress
            }`,
            { email: session.user.email }
        )

        if (!user) return null

        return {
            email: user.email,
            billing: user.billingAddress ? {
                first_name: user.billingAddress.firstName,
                last_name: user.billingAddress.lastName,
                company: user.billingAddress.company,
                address_1: user.billingAddress.address,
                address_2: user.billingAddress.apartment,
                city: user.billingAddress.city,
                state: user.billingAddress.region,
                postcode: user.billingAddress.zipCode,
                phone: user.billingAddress.phone,
                email: user.billingAddress.email,
            } : null,
            shipping: user.shippingAddress ? {
                first_name: user.shippingAddress.firstName,
                last_name: user.shippingAddress.lastName,
                company: user.shippingAddress.company,
                address_1: user.shippingAddress.address,
                address_2: user.shippingAddress.apartment,
                city: user.shippingAddress.city,
                state: user.shippingAddress.region,
                postcode: user.shippingAddress.zipCode,
            } : null
        }
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

    try {
        const addressData = {
            firstName: data.first_name,
            lastName: data.last_name,
            company: data.company,
            address: data.address_1,
            apartment: data.address_2,
            city: data.city,
            region: data.state,
            zipCode: data.postcode,
            phone: data.phone,
            email: data.email,
        };

        // Remove undefined values
        Object.keys(addressData).forEach(key => (addressData as any)[key] == null && delete (addressData as any)[key]);

        const fieldName = type === 'billing' ? 'billingAddress' : 'shippingAddress';
        const userId = (session.user as any).id;

        // Retrieve ID if missing from session
        let docId = userId;
        if (!docId) {
            const user = await client.fetch(`*[_type == "user" && email == $email][0]._id`, { email: session.user.email });
            if (!user) return { success: false, message: "Usuario no encontrado" };
            docId = user;
        }

        await client.patch(docId).set({ [fieldName]: addressData }).commit();

        return { success: true, message: "Dirección actualizada correctamente" }
    } catch (error: any) {
        console.error("Error updating customer address:", error)
        return { success: false, message: "Error al actualizar la dirección" }
    }
}

export async function updateCustomerProfile(data: { first_name: string; last_name: string; email: string }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        return { success: false, message: "No has iniciado sesión" }
    }

    try {
        let docId = (session.user as any).id;
        if (!docId) {
            const user = await client.fetch(`*[_type == "user" && email == $email][0]._id`, { email: session.user.email });
            if (!user) return { success: false, message: "Usuario no encontrado" };
            docId = user;
        }

        await client.patch(docId).set({
            name: `${data.first_name} ${data.last_name}`.trim(),
        }).commit();

        return { success: true, message: "Perfil actualizado correctamente" }

    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, message: "Error al actualizar el perfil" };
    }
}
