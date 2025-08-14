import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../test/utils'
import AISearchPage from '@/pages/AISearchPage'
import { AISearchService } from '@/services/aiSearchService'
import { conversationManager } from '@/managers/ConversationManager'

// Mock dependencies for performance testing
vi.mock('@/services/aiSearchService')
vi.mock('@/managers/ConversationManager')
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))

const mockAISearchService = AISearchService as vi.Mocked<typeof AISearchService>
const mockConversationManager = conversationManager as vi.Mocked<typeof conversationManager>

describe('AISearchPage Performance Tests', () => {
  let performanceEntries: PerformanceEntry[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    performanceEntries = []
    
    // Mock performance measurement
    vi.spyOn(performance, 'mark').mockImplementation((name) => {
      performanceEntries.push({ name, startTime: Date.now() } as PerformanceEntry)
    })
    
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
    vi.restoreAllMocks()
  })

  describe('Streaming Response Performance', () => {
    it('should maintain UI responsiveness during heavy streaming', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined
      let chunkCount = 0
      const totalChunks = 100
      const renderTimes: number[] = []

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        // Send many small chunks rapidly
        const sendChunk = () => {
          if (chunkCount < totalChunks) {
            const startTime = performance.now()
            
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `块 ${chunkCount} 的内容。`,
              created_at: Date.now(),
            })
            
            chunkCount++
            const endTime = performance.now()
            renderTimes.push(endTime - startTime)
            
            // Continue sending chunks
            setTimeout(sendChunk, 10) // Very fast chunks
          } else {
            completeCallback?.()
          }
        }

        setTimeout(sendChunk, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '性能测试查询' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Wait for streaming to complete
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 10000 })

      // Verify performance metrics
      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      expect(averageRenderTime).toBeLessThan(50) // Should average less than 50ms per chunk
      expect(Math.max(...renderTimes)).toBeLessThan(200) // No single render should take more than 200ms
    }, 15000)

    it('should handle throttling effectively under high load', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      const updateTimes: number[] = []
      let lastUpdateTime = 0

      // Mock throttle to capture timing
      vi.mock('@/hooks/useTypewriterEffect', () => ({
        useTypewriterEffect: vi.fn(),
        throttle: (fn: Function, delay: number) => {
          return (...args: any[]) => {
            const currentTime = performance.now()
            if (currentTime - lastUpdateTime >= delay) {
              lastUpdateTime = currentTime
              updateTimes.push(currentTime)
              return fn(...args)
            }
          }
        }
      }))

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk) => {
        chunkCallback = onChunk

        // Send 50 chunks in rapid succession
        for (let i = 0; i < 50; i++) {
          setTimeout(() => {
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: `快速块 ${i} `,
              created_at: Date.now(),
            })
          }, i * 5) // Every 5ms
        }
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '节流测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      // Wait for all chunks to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify throttling is working (should have fewer updates than chunks sent)
      expect(updateTimes.length).toBeLessThan(50) // Should be throttled
      if (updateTimes.length > 1) {
        const intervals = updateTimes.slice(1).map((time, i) => time - updateTimes[i])
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        expect(averageInterval).toBeGreaterThanOrEqual(90) // Should respect 100ms throttle
      }
    }, 8000)

    it('should manage memory usage during long streaming sessions', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      const memoryUsage: number[] = []

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk

        // Simulate long streaming session with large content
        const largeContent = 'A'.repeat(1000) // 1KB per chunk
        
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            // Measure memory before chunk
            if (performance.memory) {
              memoryUsage.push(performance.memory.usedJSHeapSize)
            }
            
            chunkCallback?.({
              event: 'message',
              task_id: 'task-123',
              id: 'msg-123',
              message_id: 'msg-123',
              conversation_id: 'conv-123',
              mode: 'streaming',
              answer: largeContent,
              created_at: Date.now(),
            })
          }, i * 100)
        }

        setTimeout(() => {
          onComplete?.()
        }, 2500)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      // Perform multiple searches to test memory management
      for (let search = 0; search < 3; search++) {
        fireEvent.change(searchInput, { target: { value: `内存测试 ${search + 1}` } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

        await waitFor(() => {
          expect(screen.getByText('解答结果')).toBeInTheDocument()
        }, { timeout: 5000 })

        // Reset for next search
        if (search < 2) {
          fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
          await waitFor(() => {
            expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
          })
        }
      }

      // Check memory usage pattern
      if (memoryUsage.length > 0) {
        const initialMemory = memoryUsage[0]
        const finalMemory = memoryUsage[memoryUsage.length - 1]
        const memoryGrowth = finalMemory - initialMemory
        
        // Memory growth should be reasonable (less than 10MB)
        expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
      }
    }, 15000)
  })

  describe('User Interaction Performance', () => {
    it('should respond quickly to user input', async () => {
      let responseTime = 0

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        const startTime = performance.now()
        
        setTimeout(() => {
          responseTime = performance.now() - startTime
          onComplete?.()
        }, 100)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      
      const startTime = performance.now()
      fireEvent.change(searchInput, { target: { value: '响应时间测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
      
      // Measure time until loading state appears
      await waitFor(() => {
        expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()
      })
      
      const interactionTime = performance.now() - startTime
      
      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // UI should respond within 100ms
      expect(interactionTime).toBeLessThan(100)
      expect(responseTime).toBeGreaterThan(0)
    }, 5000)

    it('should handle rapid user interactions smoothly', async () => {
      const interactionTimes: number[] = []

      mockAISearchService.sendMessage.mockImplementation(async (query, onChunk, onError, onComplete) => {
        setTimeout(() => {
          onComplete?.()
        }, Math.random() * 200 + 50) // Random delay 50-250ms
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)

      // Perform rapid interactions
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now()
        
        fireEvent.change(searchInput, { target: { value: `快速查询 ${i + 1}` } })
        fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))
        
        await waitFor(() => {
          expect(screen.getByText('AI正在思考中...')).toBeInTheDocument()
        })
        
        const interactionTime = performance.now() - startTime
        interactionTimes.push(interactionTime)
        
        await waitFor(() => {
          expect(screen.getByText('解答结果')).toBeInTheDocument()
        }, { timeout: 3000 })

        // Reset for next interaction
        fireEvent.click(screen.getByRole('button', { name: '继续提问' }))
        await waitFor(() => {
          expect(screen.getByText('热门咨询问题')).toBeInTheDocument()
        })
      }

      // All interactions should be fast
      const averageTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length
      expect(averageTime).toBeLessThan(50)
      expect(Math.max(...interactionTimes)).toBeLessThan(100)
    }, 20000)
  })

  describe('Component Rendering Performance', () => {
    it('should render workflow progress efficiently', async () => {
      let workflowEventCallback: ((event: any) => void) | undefined
      const renderTimes: number[] = []

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete, onWorkflowEvent) => {
        workflowEventCallback = onWorkflowEvent

        // Send many workflow events
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            const startTime = performance.now()
            
            workflowEventCallback?.({
              event: 'node_started',
              conversation_id: 'conv-123',
              message_id: 'msg-123',
              created_at: Date.now(),
              task_id: 'task-123',
              workflow_run_id: 'run-123',
              data: {
                id: `node-${i}`,
                node_id: `analysis-${i}`,
                node_type: 'llm',
                title: `处理步骤 ${i + 1}`,
                index: i + 1,
                created_at: Date.now(),
              }
            })
            
            const endTime = performance.now()
            renderTimes.push(endTime - startTime)
          }, i * 50)
        }

        setTimeout(() => {
          onComplete?.()
        }, 1500)
      })

      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '工作流测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Workflow rendering should be efficient
      if (renderTimes.length > 0) {
        const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
        expect(averageRenderTime).toBeLessThan(20) // Should be very fast for workflow updates
      }
    }, 5000)

    it('should handle large search results efficiently', async () => {
      let chunkCallback: ((chunk: any) => void) | undefined
      let completeCallback: (() => void) | undefined

      mockAISearchService.sendMessage.mockImplementationOnce(async (query, onChunk, onError, onComplete) => {
        chunkCallback = onChunk
        completeCallback = onComplete

        // Generate large structured response
        const sections = [
          '# 主要病害类型\n\n稻瘟病是水稻最重要的病害之一。',
          '# 防治策略\n\n综合防治包括农业防治、生物防治和化学防治。',
          '# 药剂推荐\n\n推荐使用三环唑、稻瘟灵等杀菌剂。',
          '# 施药技术\n\n掌握适期施药，提高防治效果。',
          '# 注意事项\n\n避免产生抗药性，合理轮换用药。'
        ]

        setTimeout(() => {
          chunkCallback?.({
            event: 'message',
            task_id: 'task-123',
            id: 'msg-123',
            message_id: 'msg-123',
            conversation_id: 'conv-123',
            mode: 'streaming',
            answer: sections.join('\n\n'),
            created_at: Date.now(),
          })
          completeCallback?.()
        }, 100)
      })

      const startTime = performance.now()
      
      render(<AISearchPage />)

      const searchInput = screen.getByPlaceholderText(/描述您的农化问题/)
      fireEvent.change(searchInput, { target: { value: '大结果测试' } })
      fireEvent.click(screen.getByRole('button', { name: /AI搜索/ }))

      await waitFor(() => {
        expect(screen.getByText('解答结果')).toBeInTheDocument()
      }, { timeout: 3000 })

      const totalTime = performance.now() - startTime
      
      // Should render large results within reasonable time
      expect(totalTime).toBeLessThan(2000) // Less than 2 seconds
      
      // Should create multiple result sections
      expect(screen.getAllByText(/解答/)).toHaveLength(5)
    }, 5000)
  })
})