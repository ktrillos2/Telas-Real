import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, Package, LogOut, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { AddressCard } from "@/components/account/address-card";
import { ProfileCard } from "@/components/account/profile-card";
import { OrderList } from "@/components/account/order-list";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any).forcePasswordChange) {
    redirect("/change-password");
  }

  const userId = (session.user as any).id;

  // Fetch User Details including Addresses
  const userData = await client.fetch(`
       *[_type == "user" && _id == $userId][0]{
           name,
           email,
           role,
           image,
           billingAddress,
           shippingAddress
       }
   `, { userId });

  // Fetch User Orders
  const orders = await client.fetch(`
       *[_type == "order" && user._ref == $userId] | order(date desc) {
           _id,
           orderNumber,
           date,
           status,
           total,
           shippingAddress,
           items[] {
               name,
               quantity,
               price,
               image
           }
       }
   `, { userId });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-[70vh]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-light">Mi Cuenta</h1>
        <SignOutButton />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Perfil y Direcciones */}
        <div className="space-y-6 md:col-span-1">
          {/* Perfil */}
          <ProfileCard user={{
            name: userData?.name || session.user?.name || "",
            email: userData?.email || session.user?.email || "",
            image: userData?.image,
            role: userData?.role
          }} />

          {/* Dirección por defecto */}
          <AddressCard
            title="Detalles de Facturación"
            type="billing"
            address={userData?.billingAddress || null}
          />
        </div>

        {/* Compras / Contenido Principal */}
        <Card className="md:col-span-2 border-0 shadow-none md:border md:shadow-sm">

          <CardContent>
            <OrderList orders={orders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
