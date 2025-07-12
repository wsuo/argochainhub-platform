"use client"

import { useState } from "react"
import { Search, Filter, Grid, List, ShoppingCart, MessageSquare, TestTube, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const mockProducts = [
  {
    id: 1,
    name: "Glyphosate 41% SL",
    category: "Herbicide",
    activeIngredient: "Glyphosate",
    content: "41%",
    formulation: "SL",
    supplier: "Zhejiang Xinan Chemical",
    rating: 4.8,
    registrations: ["EU", "US", "Brazil"],
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "Imidacloprid 20% SC",
    category: "Insecticide",
    activeIngredient: "Imidacloprid",
    content: "20%",
    formulation: "SC",
    supplier: "Jiangsu Yangnong Chemical",
    rating: 4.6,
    registrations: ["EU", "Australia"],
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "Mancozeb 80% WP",
    category: "Fungicide",
    activeIngredient: "Mancozeb",
    content: "80%",
    formulation: "WP",
    supplier: "Limin Chemical",
    rating: 4.7,
    registrations: ["US", "Canada", "Mexico"],
    image: "/placeholder.svg?height=200&width=200",
  },
]

export function ProductDatabase() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Database</h1>
        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="top100">Top 100 Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by product name, CAS number, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="herbicide">Herbicide</SelectItem>
                <SelectItem value="insecticide">Insecticide</SelectItem>
                <SelectItem value="fungicide">Fungicide</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Product Grid */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {mockProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Ingredient:</span>
                      <span className="font-medium">{product.activeIngredient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Content:</span>
                      <span className="font-medium">{product.content}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Formulation:</span>
                      <span className="font-medium">{product.formulation}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                        {product.supplier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating:</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">{product.rating}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-yellow-400">
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Registrations:</span>
                    <div className="flex flex-wrap gap-1">
                      {product.registrations.map((reg) => (
                        <Badge key={reg} variant="outline" className="text-xs">
                          {reg}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button size="sm" className="text-xs">
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Inquiry
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      <TestTube className="h-3 w-3 mr-1" />
                      Sample
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      <FileCheck className="h-3 w-3 mr-1" />
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="text-center py-12">
            <p className="text-gray-500">Supplier directory coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="top100">
          <div className="text-center py-12">
            <p className="text-gray-500">Top 100 suppliers ranking coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
