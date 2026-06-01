import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function MyOrdersPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        redirect("/login");
    }

    if ((session.user as any).forcePasswordChange) {
        redirect("/change-password");
    }

    // WordPress WooCommerce fetch removed. 
    // Defaulting to empty array. A new order tracking database should be implemented.
    const orders: any[] = [];

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>
            <div className="grid gap-6">
                {orders.length === 0 ? (
                    <p>No tienes pedidos recientes.</p>
                ) : (
                    orders.map((order: any) => (
                        <Card key={order.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Pedido #{order.number}</CardTitle>
                                <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                                    {order.status}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-4">
                                    Fecha: {new Date(order.date_created).toLocaleDateString()}
                                </p>
                                <div className="space-y-2">
                                    {order.line_items.map((item: any) => (
                                        <div key={item.id} className="flex justify-between border-b pb-2">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>${Number(item.total).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>${Number(order.total).toLocaleString()}</span>
                                </div>
                                {/* Check for custom design link in metadata */}
                                {order.meta_data?.map((meta: any) => {
                                    if (meta.key === 'URL Diseño' || meta.key === 'Ver Diseño') {
                                        // Extract URL if it's a link tag
                                        const urlMatch = meta.value.match(/href="([^"]*)"/);
                                        const url = urlMatch ? urlMatch[1] : meta.value;
                                        if (url && url.startsWith('http')) {
                                            return (
                                                <div key={meta.id} className="mt-4">
                                                    <Link href={url} target="_blank" className="text-blue-600 hover:underline">
                                                        Ver Diseño Personalizado
                                                    </Link>
                                                </div>
                                            )
                                        }
                                    }
                                    return null;
                                })}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
