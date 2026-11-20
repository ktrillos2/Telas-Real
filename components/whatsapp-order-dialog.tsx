"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MessageCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { WhatsAppCustomer } from "@/lib/whatsapp-origin"

const STORAGE_KEY = "telasreal_wa_customer"

/**
 * Antes de "Comprar por WhatsApp" se piden los datos básicos del cliente para que el pedido llegue
 * completo al admin (nombre y correo obligatorios; celular, ciudad y dirección opcionales). Se recuerdan en el
 * navegador y se completan con la cuenta si el cliente inició sesión.
 */
export function WhatsAppOrderDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (customer: WhatsAppCustomer) => void
}) {
  const { data: session } = useSession()
  const [form, setForm] = useState<WhatsAppCustomer>({ fullName: "", phone: "", city: "", email: "", address: "" })
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    let saved: Partial<WhatsAppCustomer> = {}
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}
    } catch {}
    setForm((f) => ({
      fullName: f.fullName || saved.fullName || session?.user?.name || "",
      phone: f.phone || saved.phone || "",
      city: f.city || saved.city || "",
      email: f.email || saved.email || session?.user?.email || "",
      address: f.address || saved.address || "",
    }))
    setError("")
  }, [open, session])

  const set = (k: keyof WhatsAppCustomer) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const phoneDigits = (form.phone || "").replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "")
    if ((form.fullName || "").trim().length < 3) return setError("Escribe tu nombre completo.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((form.email || "").trim())) return setError("Escribe un correo válido.")
    if (phoneDigits && phoneDigits.length !== 10) return setError("El celular debe tener 10 dígitos.")
    const customer: WhatsAppCustomer = {
      fullName: form.fullName.trim(),
      phone: phoneDigits,
      city: form.city.trim(),
      email: (form.email || "").trim(),
      address: (form.address || "").trim(),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))
    } catch {}
    onConfirm(customer)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-medium">
            <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden />
            Tus datos para el pedido
          </DialogTitle>
          <DialogDescription>
            Así tu pedido queda registrado y te atendemos más rápido por WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="wa-name">Nombre completo *</Label>
            <Input id="wa-name" autoComplete="name" value={form.fullName} onChange={set("fullName")} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa-email">Correo *</Label>
            <Input id="wa-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone">Celular (opcional)</Label>
              <Input id="wa-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-city">Ciudad (opcional)</Label>
              <Input id="wa-city" autoComplete="address-level2" value={form.city} onChange={set("city")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa-address">Dirección de envío (opcional)</Label>
            <Input id="wa-address" autoComplete="street-address" value={form.address} onChange={set("address")} />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" className="w-full bg-[#25D366] text-white hover:bg-[#1ebe5a]">
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
            Enviar pedido por WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
