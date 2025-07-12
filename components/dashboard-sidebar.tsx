"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Database, ShoppingCart, MessageSquare, TestTube, FileCheck, Building2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "AI Agricultural Query", href: "/ai-query", icon: Bot },
  { name: "Product Database", href: "/products", icon: Database },
  { name: "Shopping Cart", href: "/cart", icon: ShoppingCart, badge: "3" },
  { name: "Inquiry Management", href: "/inquiries", icon: MessageSquare },
  { name: "Sample Management", href: "/samples", icon: TestTube },
  { name: "Registration Management", href: "/registrations", icon: FileCheck },
  { name: "Supplier Directory", href: "/suppliers", icon: Building2 },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 px-3 py-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Premium Member</span>
          </div>
          <div className="px-3 py-1 text-xs text-gray-500">AI Queries: 45/100 this month</div>
        </div>
      </nav>
    </aside>
  )
}
