import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AIQueryInterface } from "@/components/ai-query-interface"

export default function AIQueryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <AIQueryInterface />
        </main>
      </div>
    </div>
  )
}
