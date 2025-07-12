"use client"

import { useState } from "react"
import { Trash2, Plus, Minus, MessageSquare, TestTube, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const mockCartItems = [
  {
    id: 1,
    name: "Glyphosate 41% SL",
    supplier: "Zhejiang Xinan Chemical",
    activeIngredient: "Glyphosate",
    content: "41%",
    formulation: "SL",
    quantity: 1000,
    unit: "kg",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 2,
    name: "Imidacloprid 20% SC",
    supplier: "Jiangsu Yangnong Chemical",
    activeIngredient: "Imidacloprid",
    content: "20%",
    formulation: "SC",
    quantity: 500,
    unit: "L",
    image: "/placeholder.svg?height=80&width=80",
  },
  {
    id: 3,
    name: "Mancozeb 80% WP",
    supplier: "Limin Chemical",
    activeIngredient: "Mancozeb",
    content: "80%",
    formulation: "WP",
    quantity: 2000,
    unit: "kg",
    image: "/placeholder.svg?height=80&width=80",
  },
]

export function ShoppingCartView() {
  const [cartItems, setCartItems] = useState(mockCartItems)
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) return
    setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
    setSelectedItems((selected) => selected.filter((itemId) => itemId !== id))
  }

  const toggleSelectItem = (id: number) => {
    setSelectedItems((selected) =>
      selected.includes(id) ? selected.filter((itemId) => itemId !== id) : [...selected, id],
    )
  }

  const selectAll = () => {
    setSelectedItems(cartItems.map((item) => item.id))
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <Badge variant="secondary">{cartItems.length} items</Badge>
      </div>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Button>Browse Products</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Selection Controls */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedItems.length} of {cartItems.length} selected
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                    />

                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-blue-600 hover:underline cursor-pointer">{item.supplier}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Active Ingredient:</span>
                          <p className="font-medium">{item.activeIngredient}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Content:</span>
                          <p className="font-medium">{item.content}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Formulation:</span>
                          <p className="font-medium">{item.formulation}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 100)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 100)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm text-gray-600">{item.unit}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Batch Actions */}
          {selectedItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Batch Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Send Inquiry ({selectedItems.length} items)</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                    <TestTube className="h-4 w-4" />
                    <span>Request Samples ({selectedItems.length} items)</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                    <FileCheck className="h-4 w-4" />
                    <span>Apply for Registration ({selectedItems.length} items)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
