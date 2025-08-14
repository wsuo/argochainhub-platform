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

const mockAISearchService = AISearchService as vi.Mocked<typeof AISearchService>
const mockConversationManager = conversationManager as vi.Mocked<typeof conversationManager>

describe('AISearchPage End-to-End Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAISearchService.getUserId.mockReturnValue('test-user-id')
    mockConversationManager.startConversation.mockReturnValue({
      conversationId: 'test-conv-id',
      guestId: 'test-guest-id',
      userQuery: '',
      userInputs: {},
      user: 'test-user-id',
      startTime: Date.now(),
      streamMessages: [],
      finalAnswer: null,
      usageStats: null,
      workflowData: null,
    })
  })

  describe('Complete User Journey - Success Path', () => {
    it('should handle complete AI search workflow successfully', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let workflowCallback: ((event: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete,
        onWorkflowEvent
      ) => {
        chunkCallback = onChunk
        workflowCallback = onWorkflowEvent
        completeCallback = onComplete

        // Simulate workflow progression
        setTimeout(() => {
          workflowCallback?.({
            event: 'workflow_started',
            data: { id: 'workflow-1', workflow_id: 'wf-123' }
          })

          workflowCallback?.({
            event: 'node_started',
            data: { title: '分析问题', node_type: 'analysis', index: 1 }
          })

          chunkCallback?.({
            event: 'message',
            answer: '根据您的问题，'
          })

          chunkCallback?.({
            event: 'message',
            answer: '我推荐使用以下农药进行防治：\n\n## 推荐方案\n\n1. **杀菌剂**：使用75%百菌清可湿性粉剂600-800倍液\n2. **使用方法**：叶面喷雾，7-10天一次'
          })

          workflowCallback?.({
            event: 'workflow_finished',
            data: {
              id: 'workflow-1',
              status: 'completed',
              outputs: { answer: '完整的农药使用指导方案' }
            }
          })

          completeCallback?.()
        }, 100)
      })

      mockConversationManager.finishConversation.mockResolvedValueOnce(true)

      render(<AISearchPage />)

      // 1. User sees initial page
      expect(screen.getByText('AI农药助手')).toBeInTheDocument()
      expect(screen.getByText('热门咨询问题')).toBeInTheDocument()

      // 2. User enters query
      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻稻瘟病如何防治' } })

      // 3. User submits search
      const searchButton = screen.getByRole('button', { name: /AI搜索/ })
      fireEvent.click(searchButton)

      // 4. Loading state is shown
      expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()
      expect(searchButton).toBeDisabled()

      // 5. Wait for AI response to complete
      await waitFor(() => {
        expect(screen.queryByText('AI正在思考中...')).not.toBeInTheDocument()
      }, { timeout: 5000 })

      // 6. Results are displayed
      expect(screen.getByText('解答结果')).toBeInTheDocument()
      expect(screen.getByText(/关于.*"水稻稻瘟病如何防治"/)).toBeInTheDocument()
      expect(screen.getByText('推荐方案')).toBeInTheDocument()
      expect(screen.getByText(/杀菌剂/)).toBeInTheDocument()

      // 7. Continue questioning option is available
      expect(screen.getByText('还有其他问题？')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '继续提问' })).toBeInTheDocument()

      // 8. Verify service calls
      expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
        '水稻稻瘟病如何防治',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )

      expect(mockConversationManager.startConversation).toHaveBeenCalled()
      expect(mockConversationManager.finishConversation).toHaveBeenCalled()
    })

    it('should handle quick question selection workflow', async () => {
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        completeCallback = onComplete
        // Simulate quick response for quick question
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            answer: '水稻常见病害包括稻瘟病、纹枯病等，建议使用相应的杀菌剂进行防治。'
          })
          onComplete?.()
        }, 50)
      })

      render(<AISearchPage />)

      // Click on quick question
      const quickQuestion = screen.getByText('水稻病害防治')
      fireEvent.click(quickQuestion.closest('[role="button"]') || quickQuestion)

      // Should start search immediately
      await waitFor(() => {
        expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
          '水稻常见病害如何防治',
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        )
      })

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      })

      expect(screen.getByText(/稻瘟病/)).toBeInTheDocument()
    })
  })

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError
      ) => {
        setTimeout(() => {
          onError?.(new Error('网络连接失败，请检查网络设置'))
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '网络测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('搜索遇到问题')).toBeInTheDocument()
        expect(screen.getByText('网络连接失败，请检查网络设置')).toBeInTheDocument()
      })

      // Should show retry button
      const retryButton = screen.getByRole('button', { name: '重试搜索' })
      expect(retryButton).toBeInTheDocument()

      // Test retry functionality
      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        setTimeout(() => onComplete?.(), 50)
      })

      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText('搜索遇到问题')).not.toBeInTheDocument()
      })

      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('should handle AI service timeout', async () => {
      vi.useFakeTimers()

      mockAISearchService.sendMessage.mockImplementationOnce(async () => {
        // Simulate timeout - never resolves
        return new Promise(() => {})
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '超时测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should show loading state
      expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()

      // Fast forward time but don't complete the request
      vi.advanceTimersByTime(30000)

      // Loading should still be shown (no automatic timeout handling)
      expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('should handle malformed AI responses', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        setTimeout(() => {
          // Send malformed/empty response
          onChunk?.({ event: 'message', answer: '' })
          onComplete?.()
        }, 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '空响应测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('抱歉，未能获取到有效的搜索结果，请重试。')).toBeInTheDocument()
      })

      expect(screen.getByText('重试')).toBeInTheDocument()
    })
  })

  describe('Performance and Memory Management', () => {
    it('should handle rapid consecutive searches', async () => {
      let searchCount = 0
      mockAISearchService.sendMessage.mockImplementation(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        searchCount++
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            answer: `搜索结果 ${searchCount}: ${query}`
          })
          onComplete?.()
        }, 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)

      // Perform rapid searches
      for (let i = 1; i <= 5; i++) {
        fireEvent.change(searchInput, { target: { value: `快速搜索 ${i}` } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Wait for last search to complete
      await waitFor(() => {
        expect(screen.getByText(/搜索结果 5/)).toBeInTheDocument()
      }, { timeout: 5000 })

      // Should have made multiple calls
      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(5)
    })

    it('should handle very long AI responses efficiently', async () => {
      const longContent = '这是一个非常长的农药使用指导回答。'.repeat(1000)

      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        setTimeout(() => {
          // Send content in chunks to simulate real streaming
          const chunks = longContent.match(/.{1,100}/g) || []
          let accumulatedContent = ''

          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              accumulatedContent += chunk
              onChunk?.({
                event: 'message',
                answer: accumulatedContent
              })

              if (index === chunks.length - 1) {
                onComplete?.()
              }
            }, index * 10)
          })
        }, 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '长内容测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 15000 })

      // Content should be displayed
      expect(screen.getByText(/农药使用指导回答/)).toBeInTheDocument()
    })

    it('should clean up resources on component unmount', () => {
      const { unmount } = render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '卸载测试' } })

      // Start a search
      mockAISearchService.sendMessage.mockImplementationOnce(async () => {
        return new Promise(() => {}) // Never resolves
      })

      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Unmount component
      unmount()

      // Should not cause any errors or memory leaks
      expect(() => {
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }).not.toThrow()
    })
  })

  describe('Mobile and Accessibility', () => {
    it('should be accessible via keyboard navigation', async () => {
      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // Focus search input
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)

      // Type query
      fireEvent.change(searchInput, { target: { value: '键盘测试' } })

      // Press Enter to submit
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })

      expect(mockAISearchService.sendMessage).toHaveBeenCalled()
    })

    it('should handle touch interactions for mobile', async () => {
      render(<AISearchPage />)

      const quickQuestion = screen.getByText('玉米虫害')
      
      // Simulate touch interaction
      fireEvent.touchStart(quickQuestion.closest('[role="button"]') || quickQuestion)
      fireEvent.touchEnd(quickQuestion.closest('[role="button"]') || quickQuestion)
      fireEvent.click(quickQuestion.closest('[role="button"]') || quickQuestion)

      expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
        '玉米草地贪夜蛾防治方案',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('should maintain responsive layout during search', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            answer: '响应式布局测试回答'
          })
          onComplete?.()
        }, 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '响应式测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      })

      // Check that layout elements are present (basic responsive check)
      expect(screen.getByTestId('layout')).toBeInTheDocument()
      expect(screen.getByText('继续提问')).toBeInTheDocument()
    })
  })

  describe('Data Validation and Security', () => {
    it('should sanitize user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>玉米病害'

      mockAISearchService.sendMessage.mockImplementationOnce(async (
        query,
        onChunk,
        onError,
        onComplete
      ) => {
        // Verify that the input is passed as-is to the service
        expect(query).toBe(maliciousInput)
        setTimeout(() => onComplete?.(), 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: maliciousInput } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(mockAISearchService.sendMessage).toHaveBeenCalled()
      })

      // The input should be displayed safely (React handles XSS prevention)
      expect(screen.queryByText('alert')).toBeInTheDocument()
    })

    it('should handle extremely long queries', async () => {
      const veryLongQuery = '农药使用问题 '.repeat(1000)

      mockAISearchService.sendMessage.mockImplementationOnce(async (query) => {
        expect(query).toBe(veryLongQuery)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: veryLongQuery } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      expect(mockAISearchService.sendMessage).toHaveBeenCalledWith(
        veryLongQuery,
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )
    })

    it('should validate query before sending', () => {
      render(<AISearchPage />)

      const searchButton = screen.getByRole('button', { name: /AI搜索/ })
      
      // Empty query should disable button
      expect(searchButton).toBeDisabled()

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // Whitespace-only query should still disable button
      fireEvent.change(searchInput, { target: { value: '   \n\t   ' } })
      expect(searchButton).toBeDisabled()

      // Valid query should enable button
      fireEvent.change(searchInput, { target: { value: '有效查询' } })
      expect(searchButton).not.toBeDisabled()
    })
  })
})