import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock providers for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock functions for common services
export const mockAISearchService = {
  sendMessage: vi.fn(),
  sendMessageBlocking: vi.fn(),
  resetConversation: vi.fn(),
  getConversationId: vi.fn(() => null),
  setConversationId: vi.fn(),
  getUserId: vi.fn(() => 'test-user-id'),
  setUserId: vi.fn(),
}

export const mockConversationManager = {
  startConversation: vi.fn(),
  onStreamMessage: vi.fn(),
  finishConversation: vi.fn(),
  clearConversation: vi.fn(),
  getConversation: vi.fn(),
  getActiveConversations: vi.fn(),
  clearAllConversations: vi.fn(),
}

// Mock data generators
export const createMockStreamEvent = (eventType: string, data: any = {}) => ({
  event: eventType,
  conversation_id: 'mock-conversation-id',
  message_id: 'mock-message-id',
  created_at: Date.now(),
  task_id: 'mock-task-id',
  workflow_run_id: 'mock-workflow-run-id',
  data,
})

export const createMockMessageEvent = (answer: string) => ({
  event: 'message',
  task_id: 'mock-task-id',
  id: 'mock-id',
  message_id: 'mock-message-id',
  conversation_id: 'mock-conversation-id',
  mode: 'streaming',
  answer,
  created_at: Date.now(),
})

export const createMockSearchResults = (count: number = 2) =>
  Array.from({ length: count }, (_, index) => ({
    id: `result-${index + 1}`,
    title: `搜索结果 ${index + 1}`,
    content: `这是第 ${index + 1} 个搜索结果的内容，包含详细的农药使用指导建议。`,
    confidence: 0.85 + index * 0.05,
    tags: ['农药', '病害', '防治'],
  }))

// Re-export testing library functions
export * from '@testing-library/react'
export { customRender as render }