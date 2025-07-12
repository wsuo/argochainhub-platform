"use client"

import { useState } from "react"
import { Send, Bot, User, History, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

const mockConversations = [
  { id: "1", title: "Tomato late blight fungicides", timestamp: "2 hours ago" },
  { id: "2", title: "EU glyphosate regulations", timestamp: "1 day ago" },
  { id: "3", title: "Organic insecticides", timestamp: "3 days ago" },
]

export function AIQueryInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI assistant for agricultural chemicals. I can help you find products, suppliers, regulations, and market information. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `I understand you're asking about "${inputValue}". Based on our database, here are some relevant findings:\n\n• Product recommendations with detailed specifications\n• Verified suppliers with quality ratings\n• Current market prices and availability\n• Regulatory status in different regions\n\nWould you like me to show you specific products or suppliers?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex">
      {/* Conversation History Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button className="w-full justify-start" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <History className="h-4 w-4 mr-2" />
              Recent Conversations
            </h3>
            {mockConversations.map((conv) => (
              <div
                key={conv.id}
                className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                <p className="text-xs text-gray-500 mt-1">{conv.timestamp}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">AI Agricultural Query</h1>
          <p className="text-sm text-gray-600">Ask questions about products, suppliers, and regulations</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex space-x-3 max-w-3xl ${message.type === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {message.type === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <Card className={message.type === "user" ? "bg-blue-600 text-white" : ""}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask about products, suppliers, regulations, or market information..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI responses are based on our agricultural chemical database and may not reflect real-time market
              conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
