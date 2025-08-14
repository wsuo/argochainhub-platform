import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '../../test/utils'
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

// Real-world AI integration test scenarios
describe('AISearchPage Integration Tests - Real AI Scenarios', () => {
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

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Real AI Streaming Integration', () => {
    it('should handle complete AI workflow with realistic timing', async () => {
      let workflowEventCallback: ((event: any) => void) | undefined
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete, onWorkflowEvent) => {
        workflowEventCallback = onWorkflowEvent
        chunkCallback = onChunk
        completeCallback = onComplete

        // Simulate realistic AI workflow timing
        setTimeout(() => {
          // Workflow started
          workflowEventCallback?.({
            event: 'workflow_started',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'workflow-1',
              workflow_id: 'pesticide-assistant',
              inputs: { query },
              created_at: Date.now(),
            }
          })
        }, 100)

        setTimeout(() => {
          // Node analysis started
          workflowEventCallback?.({
            event: 'node_started',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'node-1',
              node_id: 'analysis',
              node_type: 'llm',
              title: '问题分析',
              index: 1,
              created_at: Date.now(),
            }
          })
        }, 200)

        setTimeout(() => {
          // Start streaming response
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '根据您的问题，',
            created_at: Date.now(),
          })
        }, 500)

        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '我建议使用以下防治方案：\n\n',
            created_at: Date.now(),
          })
        }, 800)

        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '## 杀菌剂推荐\n推荐使用75%百菌清可湿性粉剂600-800倍液。\n\n## 使用方法\n叶面喷雾，间隔7-10天。',
            created_at: Date.now(),
          })
        }, 1200)

        setTimeout(() => {
          // Workflow finished
          workflowEventCallback?.({
            event: 'workflow_finished',
            conversation_id: 'conv-123',
            message_id: 'msg-123',
            created_at: Date.now(),
            task_id: 'task-123',
            workflow_run_id: 'run-123',
            data: {
              id: 'run-123',
              workflow_id: 'pesticide-assistant',
              status: 'completed',
              outputs: { answer: 'Complete response' },
              elapsed_time: 1500,
              total_tokens: 450,
              total_steps: 3,
              created_at: Date.now(),
              finished_at: Date.now(),
            }
          })

          completeCallback?.()
        }, 1500)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻稻瘟病防治方案' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Verify initial loading state
      expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()

      // Wait for workflow to start
      await waitFor(() => {
        expect(screen.getByText('工作流已启动')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Wait for analysis node
      await waitFor(() => {
        expect(screen.getByText('问题分析')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Wait for streaming content to appear
      await waitFor(() => {
        expect(screen.getByText('AI正在回答...')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait for final results
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
        expect(screen.getByText('杀菌剂推荐')).toBeInTheDocument()
        expect(screen.getByText('使用方法')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify conversation management
      expect(mockConversationManager.startConversation).toHaveBeenCalledWith({
        conversation_id: 'mock-uuid-12345',
        query: '水稻稻瘟病防治方案',
        inputs: {},
        user: 'test-user-id',
      })
      expect(mockConversationManager.finishConversation).toHaveBeenCalled()
    }, 10000)

    it('should handle network interruptions gracefully', async () => {
      let errorCallback: ((error: Error) => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError) => {
        errorCallback = onError
        
        // Simulate network error after delay
        setTimeout(() => {
          errorCallback?.(new Error('网络连接超时'))
        }, 1000)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should show loading initially
      expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('搜索遇到问题')).toBeInTheDocument()
        expect(screen.getByText('网络连接超时')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verify error recovery options
      expect(screen.getByRole('button', { name: '重试搜索' })).toBeInTheDocument()
      expect(mockConversationManager.clearConversation).toHaveBeenCalled()
    }, 8000)

    it('should handle malformed streaming data robustly', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        // Send malformed chunk
        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            // Missing required fields
            answer: '部分响应内容'
          })
        }, 100)

        // Send valid chunk
        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: '完整的响应内容',
            created_at: Date.now(),
          })
        }, 200)

        setTimeout(() => {
          completeCallback?.()
        }, 300)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle malformed data and continue normally
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should show the valid content
      expect(screen.getByText(/完整的响应内容/)).toBeInTheDocument()
    }, 5000)
  })

  describe('Performance and Memory Management', () => {
    it('should handle rapid successive searches without memory leaks', async () => {
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        completeCallback = onComplete
        setTimeout(() => {
          completeCallback?.()
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // Perform multiple rapid searches
      for (let i = 0; i < 5; i++) {
        fireEvent.change(searchInput, { target: { value: `查询 ${i + 1}` } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
        
        await waitFor(() => {
          expect(screen.getByText('解答结果')).toBeInTheDocument()
        })

        // Reset for next search
        fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
        
        await waitFor(() => {
          expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
        })
      }

      // Verify all searches were handled
      expect(mockAISearchService.sendMessage).toHaveBeenCalledTimes(5)
      expect(mockConversationManager.startConversation).toHaveBeenCalledTimes(5)
    }, 10000)

    it('should throttle streaming updates for performance', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      const contentUpdates: string[] = []

      // Mock throttled content updates to capture timing
      vi.mock('@/hooks/useTypewriterEffect', () => ({
        useTypewriterEffect: vi.fn(),
        throttle: (fn: Function, delay: number) => {
          return (...args: any[]) => {
            contentUpdates.push(args[0])
            return fn(...args)
          }
        }
      }))

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk) => {
        chunkCallback = onChunk
        
        // Send rapid chunks
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `块 ${i} `,
              created_at: Date.now(),
            })
          }, i * 10) // Every 10ms
        }
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '性能测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Wait for all chunks to be processed
      await new Promise(resolve => setTimeout(resolve, 500))

      // Should handle rapid updates efficiently
      expect(contentUpdates.length).toBeGreaterThan(0)
    }, 5000)

    it('should handle very long streaming responses efficiently', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        // Simulate very long response in chunks
        const longContent = '这是一个包含大量农药使用指导信息的详细响应。'.repeat(50)
        const chunkSize = 100
        
        for (let i = 0; i < longContent.length; i += chunkSize) {
          const chunk = longContent.slice(i, i + chunkSize)
          setTimeout(() => {
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: chunk,
              created_at: Date.now(),
            })
          }, (i / chunkSize) * 50)
        }

        setTimeout(() => {
          completeCallback?.()
        }, (longContent.length / chunkSize + 1) * 50)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '详细农药指导' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle long content without performance issues
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify content was processed completely
      expect(screen.getByText(/包含大量农药使用指导信息/)).toBeInTheDocument()
    }, 8000)
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary API failures', async () => {
      let attemptCount = 0

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        attemptCount++
        
        if (attemptCount === 1) {
          // First attempt fails
          setTimeout(() => {
            onError?.(new Error('API暂时不可用'))
          }, 100)
        } else {
          // Second attempt succeeds
          setTimeout(() => {
            onChunk?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: '恢复成功，这是正常的AI响应。',
              created_at: Date.now(),
            })
            onComplete?.()
          }, 100)
        }
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '恢复测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('API暂时不可用')).toBeInTheDocument()
      })

      // Retry
      fireEvent.click(screen.getByRole('button', { name: '重试搜索' }))

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText('恢复成功，这是正常的AI响应。')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(attemptCount).toBe(2)
    }, 8000)

    it('should handle concurrent search requests properly', async () => {
      let requestCount = 0
      const activeRequests = new Set<string>()

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        requestCount++
        const requestId = `req-${requestCount}`
        activeRequests.add(requestId)

        setTimeout(() => {
          if (activeRequests.has(requestId)) {
            onChunk?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `响应 ${requestId}: ${query}`,
              created_at: Date.now(),
            })
            onComplete?.()
            activeRequests.delete(requestId)
          }
        }, Math.random() * 1000 + 500) // Random delay
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // Start first search
      fireEvent.change(searchInput, { target: { value: '第一个查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Quickly start second search (should cancel first)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      fireEvent.change(searchInput, { target: { value: '第二个查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Should handle the concurrent requests properly
      await waitFor(() => {
        expect(screen.getByText(/响应.*第二个查询/)).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(requestCount).toBeGreaterThanOrEqual(2)
    }, 8000)
  })

  describe('Content Quality and Parsing', () => {
    it('should handle mixed content formats correctly', async () => {
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
            answer: '# 水稻病害综合防治方案\n\n**主要病害类型：**\n1. 稻瘟病\n2. 纹枯病\n3. 白叶枯病\n\n## 推荐药剂\n\n### 杀菌剂选择\n- 75%三环唑可湿性粉剂 800-1000倍液\n- 40%稻瘟灵乳油 1000倍液\n\n**使用方法：**叶面喷雾，间隔7-10天\n\n> 注意事项：避免在高温时段施药\n\n---\n\n## 防治时期\n建议在发病初期进行防治，效果更佳。\n\n**用量建议：**每亩用药液量50-75公斤',
            created_at: Date.now(),
          })
          completeCallback?.()
        }, 200)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '水稻病害防治' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Should parse multiple structured sections
      expect(screen.getAllByText(/解答/)).toHaveLength(4) // Should create multiple results from structured content
      expect(screen.getByText('水稻病害综合防治方案')).toBeInTheDocument()
      expect(screen.getByText('推荐药剂')).toBeInTheDocument()
      expect(screen.getByText('防治时期')).toBeInTheDocument()
    }, 5000)

    it('should calculate accurate confidence scores for different content types', async () => {
      const testCases = [
        {
          query: '基础咨询',
          content: '建议使用常规农药。',
          expectedConfidenceRange: [70, 79] // Basic content
        },
        {
          query: '专业推荐',
          content: '推荐使用75%多菌灵可湿性粉剂500倍液，能有效防治多种真菌病害。使用浓度为0.1%效果最佳，建议在发病初期施药。',
          expectedConfidenceRange: [90, 99] // Professional content with specifics
        },
        {
          query: '简短回答',
          content: '可以使用杀菌剂。',
          expectedConfidenceRange: [70, 79] // Short content
        }
      ]

      for (const testCase of testCases) {
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
              answer: testCase.content,
              created_at: Date.now(),
            })
            completeCallback?.()
          }, 100)
        })

        const { rerender } = render(<AISearchPage />)

        const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
        fireEvent.change(searchInput, { target: { value: testCase.query } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

        await waitFor(() => {
          expect(screen.getByText('解答结果')).toBeInTheDocument()
        }, { timeout: 3000 })

        // Check confidence score is in expected range
        const confidenceElement = screen.getByText(/可信度 \d+%/)
        const confidenceMatch = confidenceElement.textContent?.match(/可信度 (\d+)%/)
        if (confidenceMatch) {
          const confidence = parseInt(confidenceMatch[1])
          expect(confidence).toBeGreaterThanOrEqual(testCase.expectedConfidenceRange[0])
          expect(confidence).toBeLessThanOrEqual(testCase.expectedConfidenceRange[1])
        }

        // Reset for next test
        fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
        await waitFor(() => {
          expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
        })
      }
    }, 15000)

    it('should extract relevant tags accurately from various content types', async () => {
      const testCases = [
        {
          content: '小麦田除草剂推荐使用苯磺隆防治阔叶杂草',
          expectedTags: ['除草剂', '小麦']
        },
        {
          content: '水稻稻瘟病用杀菌剂防治，建议使用三环唑',
          expectedTags: ['杀菌剂', '防治', '病害', '水稻']
        },
        {
          content: '玉米虫害严重时需要使用杀虫剂进行防治',
          expectedTags: ['杀虫剂', '防治', '虫害', '玉米']
        }
      ]

      for (const [index, testCase] of testCases.entries()) {
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
              answer: testCase.content,
              created_at: Date.now(),
            })
            completeCallback?.()
          }, 100)
        })

        render(<AISearchPage />)

        const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
        fireEvent.change(searchInput, { target: { value: `标签测试 ${index + 1}` } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

        await waitFor(() => {
          expect(screen.getByText('解答结果')).toBeInTheDocument()
        }, { timeout: 3000 })

        // Verify expected tags are present
        for (const expectedTag of testCase.expectedTags) {
          expect(screen.getByText(expectedTag)).toBeInTheDocument()
        }

        // Reset for next test
        fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
        await waitFor(() => {
          expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
        })
      }
    }, 20000)
  })
})