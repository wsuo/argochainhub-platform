import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Search, MessageSquare, TestTube, FileCheck, TrendingUp } from "lucide-react"

const features = [
  {
    title: "AI-Powered Search",
    description: "Ask questions about products, regulations, and suppliers in natural language",
    icon: Bot,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Smart Product Discovery",
    description: "Browse 10,000+ agricultural chemicals with advanced filtering",
    icon: Search,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Streamlined Inquiries",
    description: "Send bulk inquiries to multiple suppliers with one click",
    icon: MessageSquare,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Sample Management",
    description: "Request and track product samples for testing and evaluation",
    icon: TestTube,
    color: "bg-orange-50 text-orange-600",
  },
  {
    title: "Registration Support",
    description: "Get assistance with product registration in your target markets",
    icon: FileCheck,
    color: "bg-red-50 text-red-600",
  },
  {
    title: "Market Intelligence",
    description: "Access real-time market data and supplier performance metrics",
    icon: TrendingUp,
    color: "bg-indigo-50 text-indigo-600",
  },
]

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => (
        <Card key={feature.title} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
              <feature.icon className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
