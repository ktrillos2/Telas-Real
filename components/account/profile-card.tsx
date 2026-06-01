"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCustomerProfile } from "@/app/actions/customer"
import { Pencil, Save, X, Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ProfileCardProps {
    user: {
        name?: string
        email?: string
        image?: string
        role?: string
    }
}

export function ProfileCard({ user }: ProfileCardProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
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
            const result = await updateCustomerProfile(formData)
            if (result.success) {
                setIsEditing(false)
                router.refresh()
            } else {
                alert("Error al actualizar el perfil: " + result.message)
            }
        } catch (error) {
            console.error(error)
            alert("Error al guardar cambios")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="h-fit relative group hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Tu Perfil
                    </div>
                    {!isEditing && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center p-4">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary text-3xl font-bold border-4 border-white shadow-sm relative overflow-hidden">
                        {user.image ? (
                            <Image src={user.image} alt={user.name || "Usuario"} fill className="object-cover" />
                        ) : (
                            user.name?.[0]?.toUpperCase() || "U"
                        )}
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSave} className="w-full space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-xs">Nombre Completo</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="h-8 text-sm text-center" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email" className="text-xs">Correo Electrónico</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required className="h-8 text-sm text-center" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" className="w-1/2" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button type="submit" size="sm" className="w-1/2" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Guardar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h3 className="font-medium text-xl text-center">{user.name}</h3>
                            <p className="text-sm text-muted-foreground text-center">{user.email}</p>
                            <div className="mt-4 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                                Rol: {user.role || "Usuario"}
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
