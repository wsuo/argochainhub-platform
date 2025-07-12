import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ShoppingCartView } from "@/components/shopping-cart-view"

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <ShoppingCartView />
        </main>
      </div>
    </div>
  )
}
