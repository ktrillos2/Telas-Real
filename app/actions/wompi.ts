"use server"

import crypto from "crypto"

export async function generateWompiSignature(reference: string, amountInCents: number) {
    const integritySecret = "test_integrity_RbYdF5vA85KUXbBZK18z7qx4wqIISi2J" // In production use env var
    const currency = "COP"

    const chain = `${reference}${amountInCents}${currency}${integritySecret}`
    const signature = crypto.createHash("sha256").update(chain).digest("hex")

    return signature
}
