import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrdersByCustomerEmail, getCustomerByEmail } from "@/lib/wordpress-orders"

import { AuthTabs } from "@/components/account/auth-tabs"
import { AccountDashboard } from "@/components/account/account-dashboard"

export default async function CuentaPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  // If logged in, fetch orders and customer data
  let orders = []
  let customer = null

  if (user?.email) {
    const [ordersData, customerData] = await Promise.all([
      getOrdersByCustomerEmail(user.email),
      getCustomerByEmail(user.email)
    ])
    orders = ordersData
    customer = customerData
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 mb-20 lg:mb-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light mb-8 text-center lg:text-left">Mi Cuenta</h1>

          {user ? (
            <AccountDashboard user={user} orders={orders} customer={customer} />
          ) : (
            <div className="max-w-md mx-auto">
              <AuthTabs />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
