"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateCustomerAddress } from "@/app/actions/customer"
import { colombianDepartments, citiesByDepartment } from "@/lib/locations"
import { Pencil, Save, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface AddressCardProps {
    address: {
        firstName?: string
        lastName?: string
        company?: string
        address?: string
        apartment?: string
        city?: string
        region?: string
        zipCode?: string
        phone?: string
        email?: string
        documentId?: string
    } | null
    type: 'billing' | 'shipping'
    title: string
}

export function AddressCard({ address, type, title }: AddressCardProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        first_name: address?.firstName || "",
        last_name: address?.lastName || "",
        company: address?.company || "",
        address_1: address?.address || "",
        address_2: address?.apartment || "",
        city: address?.city || "Bogotá",
        state: address?.region || "Cundinamarca",
        postcode: address?.zipCode || "",
        phone: address?.phone || "",
        email: address?.email || "",
        // For billing address, documentId is relevant but customer.ts might not have mapped it fully yet
        // Let's assume user wants to save standard fields. 
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const result = await updateCustomerAddress(type, formData)
            if (result.success) {
                setIsEditing(false)
                router.refresh() // Refresh server component
            } else {
                alert("Error al actualizar la dirección: " + result.message)
            }
        } catch (error) {
            console.error(error)
            alert("Error al guardar cambios")
        } finally {
            setIsSaving(false)
        }
    }

    if (isEditing) {
        return (
            <Card className="h-fit border-blue-200 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between">
                        Editar {title}
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} disabled={isSaving}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="first_name" className="text-xs">Nombre</Label>
                                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="last_name" className="text-xs">Apellido</Label>
                                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required className="h-8 text-sm" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="address_1" className="text-xs">Dirección</Label>
                            <Input id="address_1" name="address_1" value={formData.address_1} onChange={handleInputChange} required className="h-8 text-sm" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="state" className="text-xs">Departamento</Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(value) => {
                                        const cities = citiesByDepartment[value] || []
                                        setFormData({
                                            ...formData,
                                            state: value,
                                            city: cities.length > 0 ? cities[0] : ""
                                        })
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-sm w-full">
                                        <SelectValue placeholder="Depto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colombianDepartments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="city" className="text-xs">Ciudad</Label>
                                <Select
                                    value={formData.city}
                                    onValueChange={(value) => setFormData({ ...formData, city: value })}
                                >
                                    <SelectTrigger className="h-8 text-sm w-full">
                                        <SelectValue placeholder="Ciudad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(citiesByDepartment[formData.state] || []).map((city) => (
                                            <SelectItem key={city} value={city}>
                                                {city}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                            <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email" className="text-xs">Email</Label>
                            <Input id="email" name="email" value={formData.email} onChange={handleInputChange} required className="h-8 text-sm" />
                        </div>

                        <Button type="submit" size="sm" className="w-full mt-2" disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Guardar Cambios
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-fit hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    {title}
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                {address ? (
                    <>
                        <p className="font-semibold">{address.firstName} {address.lastName}</p>
                        <p>{address.address}</p>
                        {address.apartment && <p>{address.apartment}</p>}
                        <p>{address.city}, {address.region}</p>
                        <p>{address.phone}</p>
                        {address.email && <p className="text-xs text-muted-foreground">{address.email}</p>}
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-muted-foreground mb-2">No tienes información guardada.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Agregar Dirección
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
