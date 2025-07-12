import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { WelcomeSection } from "@/components/welcome-section"
import { FeatureCards } from "@/components/feature-cards"
import { AIQueryBox } from "@/components/ai-query-box"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <WelcomeSection />
            <FeatureCards />
            <AIQueryBox />
          </div>
        </main>
      </div>
    </div>
  )
}
