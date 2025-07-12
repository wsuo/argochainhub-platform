"use client"

import type React from "react"

import { useState } from "react"
import { Send, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AIQueryBox() {
  const [query, setQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      // In a real app, this would navigate to the AI query page
      console.log("Searching for:", query)
      setQuery("")
    }
  }

  const exampleQueries = [
    "What fungicides are effective against tomato late blight?",
    "Show me glyphosate suppliers with EU registration",
    "Which insecticides are approved for organic farming?",
    "Find suppliers of 2,4-D with CAS 94-75-7",
  ]

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span>Ask Our AI Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            placeholder="Ask about products, suppliers, regulations, or market information..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!query.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
