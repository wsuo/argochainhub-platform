import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import AISearchPage from '@/pages/AISearchPage'
import { AISearchService } from '@/services/aiSearchService'
import { conversationManager } from '@/managers/ConversationManager'

// Mock browser APIs
vi.mock('@/services/aiSearchService')
vi.mock('@/managers/ConversationManager')
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))

const mockAISearchService = AISearchService as vi.Mocked<typeof AISearchService>
const mockConversationManager = conversationManager as vi.Mocked<typeof conversationManager>

describe('AISearchPage Edge Cases and Error Scenarios', () => {
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

  describe('Network Error Scenarios', () => {
    it('should handle network disconnection during streaming', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let errorCallback: ((error: Error) => void) | undefined
      let chunksSent = 0

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError) => {
        chunkCallback = onChunk
        errorCallback = onError

        // Send a few chunks successfully
        const sendChunk = () => {
          if (chunksSent < 3) {
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `网络测试块 ${chunksSent + 1}`,
              created_at: Date.now(),
            })
            chunksSent++
            setTimeout(sendChunk, 200)
          } else {
            // Simulate network disconnection
            errorCallback?.(new Error('网络连接中断'))
          }
        }

        setTimeout(sendChunk, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '网络中断测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should show streaming content initially
      await waitFor(() => {
        expect(screen.getByText('AI正在回答...')).toBeInTheDocument()
      })

      // Then show error after network disconnection
      await waitFor(() => {
        expect(screen.getByText('搜索遇到问题')).toBeInTheDocument()
        expect(screen.getByText('网络连接中断')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should clear conversation on error
      expect(mockConversationManager.clearConversation).toHaveBeenCalled()
    }, 8000)

    it('should handle API rate limiting gracefully', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError) => {
        setTimeout(() => {
          onError?.(new Error('API调用频率超限，请稍后再试'))
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '频率限制测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('API调用频率超限，请稍后再试')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '重试搜索' })).toBeInTheDocument()
      })
    }, 3000)

    it('should handle server errors with proper fallback', async () => {
      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError) => {
        setTimeout(() => {
          onError?.(new Error('服务器内部错误 (500)'))
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '服务器错误测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('服务器内部错误 (500)')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '重试搜索' })).toBeInTheDocument()
      })

      // Should be able to retry
      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '重试成功，这是正常响应',
            created_at: Date.now(),
          })
          onComplete?.()
        }, 100)
      })

      fireEvent.click(screen.getByRole('button', { name: '重试搜索' }))

      await waitFor(() => {
        expect(screen.getByText('重试成功，这是正常响应')).toBeInTheDocument()
      }, { timeout: 3000 })
    }, 8000)
  })

  describe('Malformed Data Handling', () => {
    it('should handle malformed streaming events gracefully', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        setTimeout(() => {
          // Send malformed event (missing required fields)
          chunkCallback?.({
            event: 'message',
            answer: '部分数据1'
          })
        }, 100)

        setTimeout(() => {
          // Send null/undefined data
          chunkCallback?.(null as any)
        }, 200)

        setTimeout(() => {
          // Send valid data
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '正常数据',
            created_at: Date.now(),
          })
        }, 300)

        setTimeout(() => {
          completeCallback?.()
        }, 400)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '畸形数据测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle malformed data and continue to show results
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should show the valid content
      expect(screen.getByText(/正常数据/)).toBeInTheDocument()
    }, 5000)

    it('should handle empty or whitespace-only responses', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        setTimeout(() => {
          // Send empty content
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '   \n\n  \t  ',
            created_at: Date.now(),
          })
        }, 100)

        setTimeout(() => {
          completeCallback?.()
        }, 200)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '空响应测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('抱歉，未能获取到有效的搜索结果，请重试。')).toBeInTheDocument()
        expect(screen.getByText('重试')).toBeInTheDocument() // Should show retry tag
      }, { timeout: 3000 })
    }, 5000)

    it('should handle corrupted JSON in streaming data', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        setTimeout(() => {
          // Send corrupted data that might cause JSON parse errors
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '{"invalid": json}', // This could cause issues if parsed incorrectly
            created_at: Date.now(),
          })
        }, 100)

        setTimeout(() => {
          // Send normal content
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '正常的农药建议内容',
            created_at: Date.now(),
          })
        }, 200)

        setTimeout(() => {
          completeCallback?.()
        }, 300)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: 'JSON损坏测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle corrupted data gracefully and continue
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
        expect(screen.getByText(/正常的农药建议内容/)).toBeInTheDocument()
      }, { timeout: 3000 })
    }, 5000)
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle browsers without crypto.randomUUID', async () => {
      // Temporarily remove crypto.randomUUID
      const originalCrypto = global.crypto
      global.crypto = {} as any

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '无crypto测试内容',
            created_at: Date.now(),
          })
          onComplete?.()
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: 'crypto兼容测试' } })
      
      // Should not crash even without crypto.randomUUID
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
      }).not.toThrow()

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Restore crypto
      global.crypto = originalCrypto
    }, 5000)

    it('should handle browsers with limited localStorage', async () => {
      // Mock localStorage that throws errors
      const originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage')
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => { throw new Error('Storage quota exceeded') }),
          setItem: vi.fn(() => { throw new Error('Storage quota exceeded') }),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true
      })

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          onChunk?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '存储限制测试内容',
            created_at: Date.now(),
          })
          onComplete?.()
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '存储限制测试' } })
      
      // Should not crash even with storage issues
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
      }).not.toThrow()

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Restore localStorage
      if (originalLocalStorage) {
        Object.defineProperty(window, 'localStorage', originalLocalStorage)
      }
    }, 5000)
  })

  describe('Extreme Content Scenarios', () => {
    it('should handle extremely long single responses', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        setTimeout(() => {
          // Create extremely long response (10KB)
          const veryLongContent = '这是一个非常详细的农药使用指导说明。'.repeat(500)
          
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: veryLongContent,
            created_at: Date.now(),
          })
        }, 100)

        setTimeout(() => {
          completeCallback?.()
        }, 200)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '极长响应测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle very long content without crashing
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Should still be able to interact with the page
      expect(screen.getByRole('button', { name: '继续提问' })).toBeInTheDocument()
    }, 8000)

    it('should handle responses with special characters and emojis', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '🌾 水稻病害防治 🦠\n\n使用农药时需要注意：\n• 温度 ≥ 25°C\n• 湿度 < 80%\n• 风速 ≤ 3m/s\n\n推荐用量：500-750毫升/公顷\n⚠️ 注意安全 ⚠️\n\n效果：★★★★☆\n成本：¥50-80/亩',
            created_at: Date.now(),
          })
        }, 100)

        setTimeout(() => {
          completeCallback?.()
        }, 200)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '特殊字符测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should display special characters correctly
      expect(screen.getByText(/🌾 水稻病害防治 🦠/)).toBeInTheDocument()
      expect(screen.getByText(/★★★★☆/)).toBeInTheDocument()
    }, 5000)
  })

  describe('Concurrent Operations Edge Cases', () => {
    it('should handle rapid search cancellations correctly', async () => {
      let searchCount = 0

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        searchCount++
        const currentSearch = searchCount
        
        // Simulate search that takes different amounts of time
        setTimeout(() => {
          if (currentSearch <= searchCount) { // Only complete if this is still the latest search
            onChunk?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `搜索 ${currentSearch} 的结果`,
              created_at: Date.now(),
            })
            onComplete?.()
          }
        }, Math.random() * 500 + 200)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)

      // Start multiple searches rapidly
      fireEvent.change(searchInput, { target: { value: '第一次搜索' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await new Promise(resolve => setTimeout(resolve, 50))

      fireEvent.change(searchInput, { target: { value: '第二次搜索' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await new Promise(resolve => setTimeout(resolve, 50))

      fireEvent.change(searchInput, { target: { value: '第三次搜索' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should eventually show a result
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should handle multiple rapid requests
      expect(searchCount).toBeGreaterThanOrEqual(3)
    }, 8000)

    it('should handle browser refresh during streaming', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk) => {
        chunkCallback = onChunk

        // Start streaming
        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '开始流式响应',
            created_at: Date.now(),
          })
        }, 100)

        // Simulate more chunks that would come after refresh
        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '刷新后的内容',
            created_at: Date.now(),
          })
        }, 500)
      })

      const { rerender } = render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '刷新测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Wait for streaming to start
      await waitFor(() => {
        expect(screen.getByText('AI正在回答...')).toBeInTheDocument()
      })

      // Simulate page refresh by re-rendering component
      rerender(<AISearchPage />)

      // Should handle refresh gracefully and reset to initial state
      expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
      expect(screen.queryByText('AI正在回答...')).not.toBeInTheDocument()
    }, 3000)
  })
})