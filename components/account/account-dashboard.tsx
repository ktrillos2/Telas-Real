"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, MapPin, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface Order {
    id: number
    number: string
    status: string
    date_created: string
    total: string
    line_items: Array<{
        id: number
        name: string
        quantity: number
        total: string
        image?: {
            src: string
        }
    }>
    meta_data?: Array<{
        id: number
        key: string
        value: string
    }>
}

interface AccountDashboardProps {
    user: {
        name?: string | null
        email?: string | null
    }
    orders: Order[]
    customer: any
}

import { updateCustomerAddress, updateCustomerProfile } from "@/app/actions/customer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Colombian departments
const colombianDepartments = [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá",
    "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare",
    "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
    "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
    "Valle del Cauca", "Vaupés", "Vichada"
]

// Major Colombian cities
const colombianCities = [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga",
    "Pereira", "Santa Marta", "Ibagué", "Pasto", "Manizales", "Neiva", "Villavicencio",
    "Armenia", "Valledupar", "Montería", "Sincelejo", "Popayán", "Tunja", "Florencia",
    "Riohacha", "Quibdó", "Yopal", "Mocoa", "San Andrés", "Leticia"
]

export function AccountDashboard({ user, orders, customer }: AccountDashboardProps) {
    const router = useRouter()
    const [isEditingBilling, setIsEditingBilling] = useState(false)
    const [isEditingShipping, setIsEditingShipping] = useState(false)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentOrdersPage, setCurrentOrdersPage] = useState(1)
    const ordersPerPage = 5

    // Billing Form State
    const [billingData, setBillingData] = useState({
        first_name: customer?.billing?.first_name || "",
        last_name: customer?.billing?.last_name || "",
        address_1: customer?.billing?.address_1 || "",
        city: customer?.billing?.city || "Bogotá",
        state: customer?.billing?.state || "Cundinamarca",
        phone: customer?.billing?.phone || ""
    })

    // Shipping Form State
    const [shippingData, setShippingData] = useState({
        first_name: customer?.shipping?.first_name || "",
        last_name: customer?.shipping?.last_name || "",
        address_1: customer?.shipping?.address_1 || "",
        city: customer?.shipping?.city || "Bogotá",
        state: customer?.shipping?.state || "Cundinamarca",
    })

    // Profile Form State
    const [profileData, setProfileData] = useState({
        first_name: customer?.first_name || user.name?.split(' ')[0] || "",
        last_name: customer?.last_name || user.name?.split(' ').slice(1).join(' ') || "",
        email: customer?.email || user.email || "",
        username: customer?.username || ""
    })

    // Order status translations
    const translateOrderStatus = (status: string): string => {
        const translations: Record<string, string> = {
            'pending': 'Pendiente',
            'processing': 'Procesando',
            'on-hold': 'En Espera',
            'completed': 'Completado',
            'cancelled': 'Cancelado',
            'refunded': 'Reembolsado',
            'failed': 'Fallido'
        }
        return translations[status] || status
    }

    const handleSaveAddress = async (type: 'billing' | 'shipping') => {
        setIsLoading(true)
        const data = type === 'billing' ? billingData : shippingData

        try {
            const result = await updateCustomerAddress(type, data)
            if (result.success) {
                toast.success(result.message)
                if (type === 'billing') setIsEditingBilling(false)
                else setIsEditingShipping(false)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al guardar la dirección")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        setIsLoading(true)
        try {
            const result = await updateCustomerProfile(profileData)
            if (result.success) {
                toast.success(result.message)
                setIsEditingProfile(false)

                // Check if email was changed
                if (profileData.email !== user.email) {
                    toast.info("Correo actualizado. Cerrando sesión...")
                    setTimeout(() => {
                        signOut({ callbackUrl: '/login' })
                    }, 2000)
                } else {
                    router.refresh()
                }
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("Error al actualizar el perfil")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light">Hola, {user.name || user.email}</h2>
                <Button variant="outline" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList>
                    <TabsTrigger value="orders">Mis Pedidos</TabsTrigger>
                    <TabsTrigger value="locations">Direcciones</TabsTrigger>
                    <TabsTrigger value="profile">Perfil</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-6 space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-10 border border-dashed rounded-lg">
                            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">No tienes pedidos recientes.</p>
                            <Link href="/tienda">
                                <Button variant="link" className="mt-2">Ir a la tienda</Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {orders
                                .slice((currentOrdersPage - 1) * ordersPerPage, currentOrdersPage * ordersPerPage)
                                .map((order) => (
                                    <Card key={order.id}>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <div>
                                                <CardTitle className="text-lg font-medium">Pedido #{order.number}</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(order.date_created).toLocaleDateString('es-CO', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                                                {translateOrderStatus(order.status)}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3 mb-4">
                                                {order.line_items.map((item) => (
                                                    <div key={item.id} className="flex gap-3 text-sm">
                                                        {item.image && (
                                                            <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                                                                <img
                                                                    src={item.image.src}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                <p className="text-muted-foreground">Cantidad: {item.quantity}</p>
                                                            </div>
                                                            <span className="font-medium">${Number(item.total).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between font-bold pt-2 border-t">
                                                <span>Total</span>
                                                <span>${Number(order.total).toLocaleString()}</span>
                                            </div>

                                            {/* Custom Design Links */}
                                            {order.meta_data?.map((meta) => {
                                                if (meta.key === 'URL Diseño' || meta.key === 'Ver Diseño' || meta.key === 'Diseño Personalizado') {
                                                    // Extract URL if it's a link tag or raw URL
                                                    let url = meta.value;
                                                    if (meta.value.includes('href=')) {
                                                        const match = meta.value.match(/href="([^"]*)"/);
                                                        if (match) url = match[1];
                                                    }

                                                    if (url && (url.startsWith('http') || url.startsWith('/'))) {
                                                        return (
                                                            <div key={meta.id} className="mt-4 pt-2 border-t border-dashed">
                                                                <Link href={url} target="_blank">
                                                                    <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                                                        Descargar Diseño Personalizado
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        )
                                                    }
                                                }
                                                return null;
                                            })}
                                        </CardContent>
                                    </Card>
                                ))}

                            {/* Pagination Controls */}
                            {orders.length > ordersPerPage && (
                                <div className="flex justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentOrdersPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentOrdersPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.ceil(orders.length / ordersPerPage) }, (_, i) => i + 1).map(page => (
                                            <Button
                                                key={page}
                                                variant={currentOrdersPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentOrdersPage(page)}
                                                className="w-10"
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentOrdersPage(prev => Math.min(Math.ceil(orders.length / ordersPerPage), prev + 1))}
                                        disabled={currentOrdersPage === Math.ceil(orders.length / ordersPerPage)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="locations" className="mt-6 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Billing Address */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Dirección de Facturación
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingBilling(!isEditingBilling)}>
                                    {isEditingBilling ? "Cancelar" : "Editar"}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isEditingBilling ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="billing_first_name">Nombre</Label>
                                                <Input id="billing_first_name" value={billingData.first_name} onChange={(e) => setBillingData({ ...billingData, first_name: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="billing_last_name">Apellido</Label>
                                                <Input id="billing_last_name" value={billingData.last_name} onChange={(e) => setBillingData({ ...billingData, last_name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="billing_address_1">Dirección</Label>
                                            <Input id="billing_address_1" value={billingData.address_1} onChange={(e) => setBillingData({ ...billingData, address_1: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="billing_city">Ciudad</Label>
                                                <Select value={billingData.city} onValueChange={(value) => setBillingData({ ...billingData, city: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona tu ciudad" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {colombianCities.map((city) => (
                                                            <SelectItem key={city} value={city}>
                                                                {city}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="billing_state">Departamento</Label>
                                                <Select value={billingData.state} onValueChange={(value) => setBillingData({ ...billingData, state: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona tu departamento" />
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
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="billing_phone">Teléfono</Label>
                                            <Input id="billing_phone" value={billingData.phone} onChange={(e) => setBillingData({ ...billingData, phone: e.target.value })} />
                                        </div>
                                        <Button className="w-full mt-2" onClick={() => handleSaveAddress('billing')} disabled={isLoading}>
                                            {isLoading ? "Guardando..." : "Guardar Dirección"}
                                        </Button>
                                    </div>
                                ) : (
                                    customer?.billing?.address_1 ? (
                                        <div className="text-sm space-y-1">
                                            <p className="font-medium">{customer.billing.first_name} {customer.billing.last_name}</p>
                                            <p>{customer.billing.address_1}</p>
                                            <p>{customer.billing.city}, {customer.billing.state}</p>
                                            <p>{customer.billing.phone}</p>
                                            <p>{customer.billing.email}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No hay dirección registrada.</p>
                                    )
                                )}
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Dirección de Envío
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingShipping(!isEditingShipping)}>
                                    {isEditingShipping ? "Cancelar" : "Editar"}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isEditingShipping ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="shipping_first_name">Nombre</Label>
                                                <Input id="shipping_first_name" value={shippingData.first_name} onChange={(e) => setShippingData({ ...shippingData, first_name: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="shipping_last_name">Apellido</Label>
                                                <Input id="shipping_last_name" value={shippingData.last_name} onChange={(e) => setShippingData({ ...shippingData, last_name: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="shipping_address_1">Dirección</Label>
                                            <Input id="shipping_address_1" value={shippingData.address_1} onChange={(e) => setShippingData({ ...shippingData, address_1: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label htmlFor="shipping_city">Ciudad</Label>
                                                <Select value={shippingData.city} onValueChange={(value) => setShippingData({ ...shippingData, city: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona tu ciudad" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {colombianCities.map((city) => (
                                                            <SelectItem key={city} value={city}>
                                                                {city}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="shipping_state">Departamento</Label>
                                                <Select value={shippingData.state} onValueChange={(value) => setShippingData({ ...shippingData, state: value })}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Selecciona tu departamento" />
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
                                        </div>
                                        <Button className="w-full mt-2" onClick={() => handleSaveAddress('shipping')} disabled={isLoading}>
                                            {isLoading ? "Guardando..." : "Guardar Dirección"}
                                        </Button>
                                    </div>
                                ) : (
                                    customer?.shipping?.address_1 ? (
                                        <div className="text-sm space-y-1">
                                            <p className="font-medium">{customer.shipping.first_name} {customer.shipping.last_name}</p>
                                            <p>{customer.shipping.address_1}</p>
                                            <p>{customer.shipping.city}, {customer.shipping.state}</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Igual a la de facturación o no registrada.</p>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Información Personal</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                                {isEditingProfile ? "Cancelar" : "Editar"}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isEditingProfile ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="profile_first_name">Nombre</Label>
                                            <Input id="profile_first_name" value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="profile_last_name">Apellido</Label>
                                            <Input id="profile_last_name" value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="profile_email">Correo Electrónico</Label>
                                        <Input id="profile_email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                                    </div>
                                    <Button className="w-full mt-2" onClick={handleSaveProfile} disabled={isLoading}>
                                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1 text-sm">
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="font-medium">Nombre:</span>
                                        <span className="col-span-2">{customer?.first_name} {customer?.last_name}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="font-medium">Email:</span>
                                        <span className="col-span-2">{customer?.email}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <span className="font-medium">Usuario:</span>
                                        <span className="col-span-2">{customer?.username}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
