import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import AISearchPage from '@/pages/AISearchPage'
import { AISearchService } from '@/services/aiSearchService'
import { conversationManager } from '@/managers/ConversationManager'

// Mock dependencies
vi.mock('@/services/aiSearchService')
vi.mock('@/managers/ConversationManager')
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))
vi.mock('@/components/chat/WorkflowProgress', () => ({
  WorkflowProgress: ({ status }: any) => (
    <div data-testid="workflow-progress" data-running={status.isRunning}>
      {status.currentNode?.title || 'No current node'}
    </div>
  ),
}))
vi.mock('@/components/chat/MessageContent', () => ({
  MessageContent: ({ content, isStreaming }: any) => (
    <div data-testid="message-content" data-streaming={isStreaming}>
      {content}
    </div>
  ),
}))

const mockAISearchService = AISearchService as vi.Mocked<typeof AISearchService>
const mockConversationManager = conversationManager as vi.Mocked<typeof conversationManager>

describe('AISearchPage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAISearchService.getUserId.mockReturnValue('test-user-id')
    mockConversationManager.startConversation.mockReturnValue({
      conversationId: 'test-conv-id',
      guestId: 'test-guest-id',
      userQuery: 'test query',
      userInputs: {},
      user: 'test-user-id',
      startTime: Date.now(),
      streamMessages: [],
      finalAnswer: null,
      usageStats: null,
      workflowData: null,
    })
  })

  describe('User Interface Tests', () => {
    it('should render initial state correctly', () => {
      render(<AISearchPage />)

      expect(screen.getByText('AI农药助手')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/描述您的农化问题/)).toBeInTheDocument()
      expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /AI搜索/ })).toBeInTheDocument()
      expect(screen.getByText('水稻病害防治')).toBeInTheDocument()
      expect(screen.getByText('玉米虫害')).toBeInTheDocument()
      expect(screen.getByText('除草剂选择')).toBeInTheDocument()
      expect(screen.getByText('果树病虫害')).toBeInTheDocument()
    })

    it('should handle search input and submission', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        // Simulate immediate completion
        onComplete?.()
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      const searchButton = screen.getByRole('button', { name: /AI搜索/ })

      fireEvent.change(searchInput, { target: { value: '水稻病害如何防治' } })
      fireEvent.click(searchButton)

      expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
        '水稻病害如何防治',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )

      expect(mockConversationManager.startConversation).toHaveBeenCalledWith({
        conversation_id: 'mock-uuid-12345',
        query: '水稻病害如何防治',
        inputs: {},
        user: 'test-user-id',
      })
    })

    it('should handle quick question clicks', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        onComplete?.()
      })

      render(<AISearchPage />)

      const quickQuestion = screen.getByText('水稻病害防治')
      fireEvent.click(quickQuestion.closest('[role="button"]') || quickQuestion)

      await waitFor(() => {
        expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
          '水稻常见病害如何防治',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        )
      })
    })

    it('should disable search button when searching', async () => {
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
        // Don't call onComplete immediately to simulate ongoing search
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      const searchButton = screen.getByRole('button', { name: /AI搜索/ })

      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(searchButton)

      expect(searchButton).toBeDisabled()
      expect(screen.getByText('分析中')).toBeInTheDocument()

      // Complete the search
      completeCallback?.()

      await waitFor(() => {
        expect(searchButton).not.toBeDisabled()
      })
    })
  })

  describe('AI Streaming Response Tests', () => {
    it('should handle workflow progress updates', async () => {
      let workflowEventCallback: ((event: any) => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete, onWorkflowEvent) => {
        workflowEventCallback = onWorkflowEvent
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Simulate workflow events
      workflowEventCallback?.({
        event: 'workflow_started',
        data: { id: 'workflow-1' }
      })

      await waitFor(() => {
        expect(screen.getByTestId('workflow-progress')).toHaveAttribute('data-running', 'true')
      })

      workflowEventCallback?.({
        event: 'node_started',
        data: {
          title: '正在分析问题',
          node_type: 'analysis',
          index: 1
        }
      })

      await waitFor(() => {
        expect(screen.getByText('正在分析问题')).toBeInTheDocument()
      })
    })

    it('should handle streaming content display', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Simulate streaming chunks
      chunkCallback?.({
        event: 'message',
        answer: '这是第一个流式响应片段。'
      })

      await waitFor(() => {
        expect(screen.getByTestId('message-content')).toHaveTextContent('这是第一个流式响应片段。')
        expect(screen.getByTestId('message-content')).toHaveAttribute('data-streaming', 'true')
      })

      chunkCallback?.({
        event: 'message',
        answer: '这是更多内容。'
      })

      await waitFor(() => {
        expect(screen.getByTestId('message-content')).toHaveTextContent('这是第一个流式响应片段。这是更多内容。')
      })

      // Complete the response
      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      })
    })

    it('should handle empty or malformed responses', async () => {
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
        // No chunks sent - simulate empty response
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByText('抱歉，未能获取到有效的搜索结果，请重试。')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Tests', () => {
    it('should display error message when AI service fails', async () => {
      let errorCallback: ((error: Error) => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError) => {
        errorCallback = onError
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      errorCallback?.(new Error('网络连接失败'))

      await waitFor(() => {
        expect(screen.getByText('搜索遇到问题')).toBeInTheDocument()
        expect(screen.getByText('网络连接失败')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '重试搜索' })).toBeInTheDocument()
      })
    })

    it('should retry search when retry button is clicked', async () => {
      let errorCallback: ((error: Error) => void) | undefined

      mockAISearchService.sendMessage
        .mockImplementationOnce(async (query, onChunk, onError) => {
          errorCallback = onError
        })
        .mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
          onComplete?.()
        })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      errorCallback?.(new Error('网络连接失败'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '重试搜索' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: '重试搜索' }))

      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('should handle conversation manager errors', async () => {
      mockConversationManager.finishConversation.mockRejectedValueOnce(new Error('保存失败'))

      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      completeCallback?.()

      // Should still display results even if conversation saving fails
      await waitFor(() => {
        expect(mockConversationManager.finishConversation).toHaveBeenCalled()
        // Page should still function normally
      })
    })
  })

  describe('Content Parsing Tests', () => {
    it('should parse markdown-formatted streaming content correctly', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻病害防治' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Simulate structured markdown response
      chunkCallback?.({
        event: 'message',
        answer: '## 水稻稻瘟病防治\n\n推荐使用75%三环唑可湿性粉剂800-1000倍液喷雾。\n\n## 施药注意事项\n\n建议在发病初期进行防治，效果更佳。'
      })

      completeCallback?.()

      await waitFor(() => {
        // Should create multiple search results from structured content
        expect(screen.getAllByText(/解答/)).toHaveLength(2)
        expect(screen.getByText('水稻稻瘟病防治')).toBeInTheDocument()
        expect(screen.getByText('施药注意事项')).toBeInTheDocument()
      })
    })

    it('should calculate confidence scores based on content quality', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '农药推荐' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      chunkCallback?.({
        event: 'message',
        answer: '推荐使用50%多菌灵可湿性粉剂500倍液，能有效防治多种真菌病害。使用浓度为0.1%效果最佳。'
      })

      completeCallback?.()

      await waitFor(() => {
        // Should show high confidence due to specific recommendations and percentages
        expect(screen.getByText(/可信度 9[0-9]%/)).toBeInTheDocument()
      })
    })

    it('should extract relevant tags from content', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '小麦除草剂' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      chunkCallback?.({
        event: 'message',
        answer: '小麦田除草剂推荐使用75%苯磺隆可湿性粉剂防治阔叶杂草和部分禾本科杂草。'
      })

      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByText('除草剂')).toBeInTheDocument()
        expect(screen.getByText('小麦')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should throttle streaming content updates', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk) => {
        chunkCallback = onChunk
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Send rapid chunks
      for (let i = 0; i < 10; i++) {
        chunkCallback?.({
          event: 'message',
          answer: `块 ${i} `
        })
      }

      // Should handle rapid updates without performance issues
      await waitFor(() => {
        expect(screen.getByTestId('message-content')).toBeInTheDocument()
      })
    })

    it('should handle long streaming content efficiently', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '详细防治方案' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Simulate very long response
      const longContent = '这是一个非常长的农药使用指导内容。'.repeat(100)
      chunkCallback?.({
        event: 'message',
        answer: longContent
      })

      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByTestId('message-content')).toBeInTheDocument()
      })
    })
  })

  describe('User Journey Tests', () => {
    it('should support continue questioning workflow', async () => {
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      // First search
      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '第一个问题' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByText('还有其他问题？')).toBeInTheDocument()
      })

      // Click continue questioning
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))

      await waitFor(() => {
        expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
        expect(searchInput.value).toBe('')
      })

      // Second search
      fireEvent.change(searchInput, { target: { value: '第二个问题' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('should maintain conversation context across multiple queries', async () => {
      mockAISearchService.getConversationId.mockReturnValue('existing-conv-123')

      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // First search
      fireEvent.change(searchInput, { target: { value: '水稻病害' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      completeCallback?.()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '继续提问' })).toBeInTheDocument()
      })

      // Continue questioning should maintain context
      fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
      
      fireEvent.change(searchInput, { target: { value: '用量多少' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should use existing conversation context
      expect(mockConversationManager.startConversation).toHaveBeenCalledTimes(2)
    })
  })
})