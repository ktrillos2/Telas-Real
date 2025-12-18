"use server"

import crypto from "crypto"

export async function generateWompiSignature(reference: string, amountInCents: number) {
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET
    if (!integritySecret) {
        throw new Error("WOMPI_INTEGRITY_SECRET is not defined")
    }
    const currency = "COP"

    const chain = `${reference}${amountInCents}${currency}${integritySecret}`
    const signature = crypto.createHash("sha256").update(chain).digest("hex")

    return signature
}
